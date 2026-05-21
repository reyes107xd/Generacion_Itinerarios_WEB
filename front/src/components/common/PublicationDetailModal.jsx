import { X, Trash2, Calendar, Send, MessageCircle, UserCheck, UserPlus, Check, Flag, Map } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2'; 
import ImageLightbox from './ImageLightbox';
import ProfileModal from './ProfileModal';
import ItineraryViewerModal from './ItineraryViewerModal';
import ModalConfirmacion from '../../components/modalConfirm'; 
import { useAuth } from '../../context/authContext';
import { useAlert } from '../../context/alertContext';
import { obtenerComentariosAPI, crearComentarioAPI, eliminarComentarioAPI } from '../../api/a-comentario';
import { obtenerMisReportesAPI, enviarReporteAPI } from '../../api/a-reporte';
import { generateAvatarUrl, getFullName } from '../../utils/userHelpers';

const timeAgo = (dateString) => {
  if (!dateString) return '';
  let safeDate = dateString;
  if (!dateString.endsWith('Z') && !dateString.includes('+')) safeDate += 'Z';
  const now = new Date();
  const past = new Date(safeDate);
  if (isNaN(past.getTime())) return 'hace poco';
  const diffInSeconds = Math.max(0, Math.floor((now - past) / 1000));
  if (diffInSeconds < 5) return 'ahora';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;
  return past.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

const setSwalZIndex = () => {
  const container = Swal.getContainer();
  if (container) container.style.zIndex = '11000'; 
};

// --- COMPONENTE PRINCIPAL ---
const PublicationDetailModal = ({
  post,
  onClose,
  onDelete,
  onSendRequest,
  allowDelete = false,
  hideFriendButton = false
}) => {
  const { token, user } = useAuth();
  const { showAlert } = useAlert();

  // --- ESTADOS ---

  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    action: null, 
    id: null, 
    titulo: '', 
    mensaje: ''
  });

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [viewingItineraryId, setViewingItineraryId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [requestSentLocal, setRequestSentLocal] = useState(false);
  const [reportedComments, setReportedComments] = useState([]);
  const commentsEndRef = useRef(null);

  // --- CARGAR DATOS (sin cambios) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dataComentarios, dataReportes] = await Promise.all([
          obtenerComentariosAPI(token, post.id),
          obtenerMisReportesAPI(token)
        ]);
        setComments(dataComentarios);
        setReportedComments(dataReportes.comentarios || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoadingComments(false);
      }
    };
    if (token && post.id) fetchData();

  }, [token, post.id]);

  // --- DATOS DEL POST (sin cambios) ---
  const rawDate = post.fecha_publicacion || post.created_at || new Date().toISOString();
  const fechaFormateada = new Date(rawDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

  let images = [];
  if (post.images && Array.isArray(post.images)) {
    images = post.images.filter(img => img && img.trim() !== '');
  } else if (post.image && typeof post.image === 'string' && post.image.trim() !== '') {
    images = [post.image];
  }

  const currentUserId = user?.id || user?.id_usuario;
  const postAuthorName = post.author?.name || 'Usuario';
  const postAuthorAvatar = generateAvatarUrl(post.author?.foto, postAuthorName);

  const myFullName = getFullName(user);
  const myAvatar = generateAvatarUrl(user?.foto, myFullName);

  const isPostAuthorFriend = post.isFriend === true;
  const isPostAuthorMe =
    String(currentUserId) === String(post.author?.id) ||
    String(currentUserId) === String(post.author?.id_usuario);
  const showFriendAction = !isPostAuthorMe && !hideFriendButton;

  // --- HANDLERS (Usando showAlert para toasts) ---
  const openLightbox = (index) => {
    setInitialImageIndex(index);
    setLightboxOpen(true);
  };

  const handleUserClick = (autorData, isPostAuthor = false) => {
    const isAuthor = isPostAuthor || (String(autorData.id || autorData.id_turista) === String(post.author.id));
    const friendStatus = isAuthor ? isPostAuthorFriend : false;

    const nombreAutor = getFullName(autorData);
    const avatarAutor = generateAvatarUrl(autorData.foto, nombreAutor);

    const perfilAdaptado = {
      id: autorData.id || autorData.id_turista,
      name: nombreAutor,
      nombre_usuario: autorData.nombre_usuario || '',
      avatar: avatarAutor,
      foto: autorData.foto,
      isFriend: friendStatus
    };
    setSelectedProfile(perfilAdaptado);
  };

  const handleAddFriendClick = () => {
    if (onSendRequest) {
      onSendRequest(post.author.id);
      setRequestSentLocal(true);
    }
  };

  const confirmDeleteComment = (idComentario) => {
    setConfirmModal({
      isOpen: true,
      action: 'comment',
      id: idComentario,
      titulo: '¿Borrar comentario?',
      mensaje: 'Esta acción es irreversible.'
    });
  };

  const handleConfirmAction = async () => {
    const { action, id } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false }); 

    if (action === 'post' && onDelete) {
      onDelete(id);
    } else if (action === 'comment') {
      try {
        await eliminarComentarioAPI(token, id);
        setComments(prev => prev.filter(c => c.id_comentario !== id));
        // Usando showAlert para el toast de éxito
        showAlert('success', '¡Comentario eliminado con éxito!', 'El comentario ha sido eliminado.'); 
      } catch (error) {
        console.error(error);
        // Usando showAlert para el error
        showAlert('error', 'Error al eliminar comentario', 'No se pudo eliminar el comentario.');
      }
    }
  };

  const handleCloseConfirm = () => {
    setConfirmModal({ isOpen: false, action: null, id: null, titulo: '', mensaje: '' });
  };

  // Mantenemos Swal.fire SOLO para la interfaz de reporte (el formulario)
  const handleReportComment = async (idComentario) => {
    const { value: motivo } = await Swal.fire({
      title: '<h3 class="text-xl font-bold text-gray-900">Reportar comentario</h3>',
      html: `
            <div class="flex flex-col items-start mt-2">
                <label for="swal-motivo" class="text-sm font-medium text-gray-700 mb-2 block">Selecciona una razón:</label>
                <select id="swal-motivo" class="w-full p-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer">
                    <option value="" disabled selected>Elige una opción...</option>
                    <option value="spam">Es spam</option>
                    <option value="ofensivo">Es ofensivo o inapropiado</option>
                    <option value="acoso">Es acoso o intimidación</option>
                </select>
            </div>
        `,
      showCancelButton: true,
      confirmButtonText: 'Enviar Reporte',
      cancelButtonText: 'Cancelar',
      buttonsStyling: false,
      didOpen: setSwalZIndex,
      customClass: {
        popup: 'rounded-2xl p-6',
        confirmButton: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors focus:outline-none ml-3',
        cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-6 rounded-xl transition-colors focus:outline-none'
      },
      // --- AQUÍ ESTÁ LA CORRECCIÓN ---
      preConfirm: () => {
        // Tenemos que buscar el elemento manualmente por su ID
        const select = Swal.getPopup().querySelector('#swal-motivo');
        const value = select.value;
        
        if (!value) {
          Swal.showValidationMessage('<span class="text-red-500 text-sm font-medium">Por favor, selecciona un motivo</span>');
        }
        
        // Retornamos el valor STRING para que llegue a la variable 'motivo'
        return value;
      }
      // -------------------------------
    });

    if (motivo) {
      try {
        await enviarReporteAPI(token, { tipo: 'comentario', id_objeto: idComentario, motivo: motivo });
        setReportedComments(prev => [...prev, idComentario]);
        showAlert('success', '¡Reporte enviado con éxito!', 'Gracias por tu colaboración.');
      } catch (error) {
        console.error("Error al enviar reporte:", error);
        const errorMessage = error.response?.data?.message ||
          (error.response?.status === 500
            ? 'El servidor no pudo procesar la solicitud (Error 500).'
            : 'No se pudo enviar el reporte por un fallo de red.');

        showAlert('error', 'Error al enviar reporte', errorMessage);
      }
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setSendingComment(true);
      const comentarioGuardado = await crearComentarioAPI(token, post.id, newComment);
      const comentarioParaLista = {
        ...comentarioGuardado,
        fecha_comentario: new Date().toISOString(),
        autor: {
          id: currentUserId,
          nombre: myFullName,
          nombre_usuario: user.nombre_usuario,
          foto: user.foto
        }
      };
      setComments([...comments, comentarioParaLista]);
      setNewComment('');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) { console.error(error); } finally { setSendingComment(false); }
  };

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col md:flex-row relative">
          <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition">
            <X size={20} />
          </button>

          {/* FOTOS */}
          <div className="w-full md:w-3/5 bg-black flex items-center justify-center overflow-hidden relative">
            {images.length > 0 ? (
              <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col gap-1">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    onClick={() => openLightbox(idx)}
                    className="w-full object-contain cursor-pointer hover:opacity-90 transition min-h-[50%]"
                    alt={`Imagen ${idx + 1}`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-gray-500">Sin imágenes</div>
            )}
          </div>

          {/* INFO */}
          <div className="w-full md:w-2/5 flex flex-col bg-white h-full border-l border-gray-200">
            {/* HEADER AUTOR */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <img
                  src={postAuthorAvatar}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 cursor-pointer"
                  onClick={() => handleUserClick(post.author, true)}
                  alt={postAuthorName}
                />
                <div>
                  <h4
                    className="font-bold text-gray-900 text-sm cursor-pointer hover:underline"
                    onClick={() => handleUserClick(post.author, true)}
                  >
                    {postAuthorName}
                  </h4>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12} /> {fechaFormateada}
                  </span>
                </div>
              </div>
              {showFriendAction && (
                <>
                  {isPostAuthorFriend ? (
                    <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 border border-green-200 cursor-default mr-8">
                      <UserCheck size={14} /> Amigos
                    </div>
                  ) : (
                    <button
                      onClick={handleAddFriendClick}
                      disabled={requestSentLocal}
                      className={`px-3 py-1.5 text-xs font-bold rounded-full flex items-center gap-1 transition-colors mr-10 ${requestSentLocal ? 'bg-gray-100 text-gray-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                    >
                      {requestSentLocal ? <Check size={14} /> : <UserPlus size={14} />}
                      {requestSentLocal ? 'Enviada' : 'Agregar'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* DETALLE Y COMENTARIOS */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-2">{post.title}</h2>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{post.description}</p>
                {/* BOTÓN VER ITINERARIO */}
                {post.id_itinerario && (
                  <div
                    onClick={() => setViewingItineraryId(post.id_itinerario)}
                    className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between cursor-pointer hover:bg-emerald-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-200 p-2 rounded-lg text-emerald-800 group-hover:scale-110 transition-transform"><Map size={20} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-emerald-900 leading-tight break-words">
                          Itinerario: {post.itinerario_titulo || 'Ver detalles'}
                        </p>
                        <p className="text-xs text-emerald-600 truncate mt-0.5">
                          Autor: {post.itinerario_autor || 'Desconocido'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <MessageCircle size={14} /> Comentarios ({comments.length})
                </h5>
                {loadingComments ? (
                  <div className="text-center py-4 text-gray-400 text-xs">Cargando...</div>
                ) : (
                  comments.map((com) => {
                    const n = com.autor?.nombre || '';
                    const a = com.autor?.ap_p || '';
                    const comName = (n && a) ? `${n} ${a}`.trim() : (n || com.autor?.nombre_usuario || 'Usuario');
                    const comAvatar = generateAvatarUrl(com.autor?.foto, comName);
                    const isMyComment = String(com.id_turista) === String(currentUserId);
                    const isReported = reportedComments.includes(com.id_comentario);

                    return (
                      <div key={com.id_comentario} className="flex gap-3 group animate-fade-in">
                        <img
                          src={comAvatar}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer"
                          onClick={() => handleUserClick(com.autor, false)}
                          alt={comName}
                        />
                        <div className="flex-1">
                          <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none relative group/bubble">
                            <div className="flex justify-between items-baseline mb-1">
                              <span
                                className="text-xs font-bold text-gray-900 cursor-pointer hover:underline"
                                onClick={() => handleUserClick(com.autor, false)}
                              >
                                {comName}
                              </span>
                              <span className="text-[10px] text-gray-400">{timeAgo(com.fecha_comentario)}</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-snug">{com.contenido}</p>
                          </div>
                          <div className="flex gap-3 px-2 mt-1 h-4 items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            {isMyComment ? (
                              <button
                                onClick={() => confirmDeleteComment(com.id_comentario)} 
                                className="text-[10px] text-gray-400 hover:text-red-500 font-medium flex items-center gap-1"
                              >
                                <Trash2 size={10} /> Eliminar
                              </button>
                            ) : (
                              <button
                                onClick={() => !isReported && handleReportComment(com.id_comentario)}
                                disabled={isReported}
                                className={`text-[10px] font-medium flex items-center gap-1 transition-colors ${isReported ? 'text-red-300 cursor-default' : 'text-gray-400 hover:text-red-500'}`}
                              >
                                <Flag size={10} fill={isReported ? 'currentColor' : 'none'} />
                                {isReported ? 'Reportado' : 'Reportar'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={commentsEndRef} />
              </div>
              </div>

              {/* INPUT */}
              <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
                <form onSubmit={handleSendComment} className="flex gap-2 items-center">
                  <img src={myAvatar} className="w-8 h-8 rounded-full object-cover border border-gray-200" alt="Mi avatar" />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Agrega un comentario..."
                      className="w-full pl-4 pr-10 py-2.5 rounded-full border border-gray-300 focus:outline-none focus:border-emerald-500 text-sm"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={sendingComment}
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || sendingComment}
                      className="absolute right-1.5 top-1.5 p-1.5 bg-emerald-600 text-white rounded-full"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </form>
                {allowDelete && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={confirmDeletePost}
                      className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 py-1 px-2"
                    >
                      <Trash2 size={12} /> Eliminar Publicación
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          initialIndex={initialImageIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {selectedProfile && (
        <ProfileModal
          user={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onSendRequest={onSendRequest}
          isRequestAlreadySent={false}
        />
      )}

      {viewingItineraryId && (
        <ItineraryViewerModal
          idItinerario={viewingItineraryId}
          onClose={() => setViewingItineraryId(null)}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN ESTANDARIZADO */}
      <ModalConfirmacion
        isOpen={confirmModal.isOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmAction}
        titulo={confirmModal.titulo}
        mensaje={confirmModal.mensaje}
        tipo={confirmModal.action === 'post' ? 'eliminar' : 'eliminar'} 
        textoConfirmar={confirmModal.action === 'comment' ? 'Borrar' : 'Sí, eliminar'}
      />

    </>
  );

  return createPortal(modalContent, document.body);
};

export default PublicationDetailModal;