import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import usePageTitle from '../../Extras/nombre';
import MisAmigosGrid from "../../components/perfil/MisAmigosGrid";
import Editarperfil from "../../components/perfil/Editarperfil"; 
import MyPublicationsView from "../../components/perfil/MyPublicationsView"; // Ajusta la ruta si es necesaria (Components vs components)
import { useAlert } from '../../context/alertContext';
import NewPublicationModal from '../../components/common/NewPublicationModal';
import PublicationDetailModal from '../../components/common/PublicationDetailModal';
import ItineraryViewerModal from '../../components/common/ItineraryViewerModal';
import ModalConfirmacion from '../../components/modalConfirm'; 
import { useAuth } from '../../context/authContext';
import {
  obtenerMisPublicacionesAPI,
  crearPublicacionAPI,
  eliminarPublicacionAPI,
  obtenerUnicaPublicacionAPI
} from '../../api/a-publicacion';
import { obtenerConteoAmigosAPI, enviarSolicitudAmistadAPI } from '../../api/friends';
import { Plus, Pencil } from 'lucide-react'; 

// --- HELPER: NOMBRE COMPLETO ---
const getFullName = (u) => {
  if (!u) return 'Usuario';
  return u.ap_p ? `${u.nombre} ${u.ap_p}`.trim() : u.nombre;
};

// --- HELPER: AVATAR SEGURO ---
const getAvatarUrl = (foto, nombreCompleto) => {
  if (foto && foto.trim() !== '') return foto;
  const nombreSafe = nombreCompleto || 'Usuario';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreSafe)}&background=1D7743&color=fff&bold=true`;
};

const Perfil = () => {
  usePageTitle('Mi Perfil - Tlamatini');
  const { token, user } = useAuth();
  const { showAlert } = useAlert();

  // --- ESTADO ---
  const [activeTab, setActiveTab] = useState('publicaciones'); 
  const [activeEditSubTab, setActiveEditSubTab] = useState('datos-basicos'); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); 
  const [myPosts, setMyPosts] = useState([]);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isNewPubModalOpen, setIsNewPubModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewingItineraryId, setViewingItineraryId] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const myFullName = getFullName(user);
  const myAvatar = getAvatarUrl(user?.foto, myFullName);

  useEffect(() => {
    const cargarPerfil = async () => {
      if (!token || !user) return;

      const userId = user.id_usuario || user.id;
      if (!userId) {
        console.error('Usuario no encontrado.');
        return;
      }

      try {
        setLoading(true);

        const [dataBackend, amigos] = await Promise.all([
          obtenerMisPublicacionesAPI(token),
          obtenerConteoAmigosAPI(token, userId)
        ]);

        const listaPublicaciones = Array.isArray(dataBackend) ? dataBackend : [];

        const postsAdaptados = listaPublicaciones.map(p => {
          let imageUrl = 'https://via.placeholder.com/300';
          let imagesArray = [];

          if (p.foto) {
            if (Array.isArray(p.foto)) {
              imagesArray = p.foto.filter(img => img && img.trim() !== '');
              imageUrl = imagesArray[0] || imageUrl;
            } else if (typeof p.foto === 'string' && p.foto.trim() !== '') {
              imagesArray = [p.foto];
              imageUrl = p.foto;
            }
          }

          // --- LÓGICA DE ITINERARIO VINCULADO (NUEVO) ---
          const itData = Array.isArray(p.itinerario) ? p.itinerario[0] : p.itinerario;
          let nombreCreadorItinerario = 'Anónimo';
          let tituloItinerario = itData?.titulo;

          if (itData) {
            const creadorRaw = itData.creador || itData.turista || itData.usuario;
            const creadorObj = Array.isArray(creadorRaw) ? creadorRaw[0] : creadorRaw;

            if (creadorObj) {
                let perfil = creadorObj.usuario?.perfil_usuario;
                if (!perfil) perfil = creadorObj.perfil_usuario;
                if (!perfil && creadorObj.nombre) perfil = creadorObj;

                if (Array.isArray(perfil)) perfil = perfil[0];

                if (perfil) {
                    nombreCreadorItinerario = `${perfil.nombre || ''} ${perfil.ap_p || ''}`.trim() || 'Usuario';
                }
            }
          }
          // ----------------------------------------------

          return {
            id: p.id_publicacion,
            title: p.titulo || 'Sin título',
            description: p.descripcion || '',
            fecha_publicacion: p.fecha_publicacion || new Date().toISOString(),
            image: imageUrl,
            images: imagesArray,
            likes: p.likes || 0,
            comments: p.commentsCount || 0,
            isFriend: false,

            id_itinerario: p.id_itinerario,
            itinerario_titulo: tituloItinerario, // Pasamos el título extraído
            itinerario_autor: nombreCreadorItinerario, // Pasamos el autor extraído

            author: {
              id: userId,
              name: myFullName,
              avatar: myAvatar
            }
          };
        });

        setMyPosts(postsAdaptados);
        setFriendCount(amigos || 0);

      } catch (error) {
        console.error('Error cargando perfil:', error);
        showAlert('error', 'Error al obtener perfil.', 'Intentalo de nuevo mas tarde');
      } finally {
        setLoading(false);
      }
    };
    cargarPerfil();
  }, [token, user, myFullName, myAvatar]);


  // --- 2. CREAR POST ---
  const handleAddPost = async (datosDelModal) => {
    if (!token || !user) {
      showAlert('error', 'Usuario no autenticado.', 'Inicia sesión nuevamente');
      return;
    }

    try {
      const datosParaAPI = {
        titulo: datosDelModal.titulo || 'Sin título',
        descripcion: datosDelModal.description || '',
        tipo_publicacion: datosDelModal.tipo_publicacion || 'foto',
        foto: datosDelModal.fotos || [],
        privacidad: datosDelModal.privacidad || 'public',
        id_itinerario: datosDelModal.id_itinerario
      };

      const nueva = await crearPublicacionAPI(token, datosParaAPI);

      if (!nueva || (!nueva.id_publicacion && !nueva.publicacion?.id_publicacion)) {
        throw new Error('Respuesta inválida de la API');
      }

      const nuevoId = nueva.publicacion?.id_publicacion || nueva.id_publicacion;
      let nuevoLocal;

      try {
        const comp = await obtenerUnicaPublicacionAPI(token, nuevoId);
        
        // Lógica de Itinerario para carga optimista
        let itTitulo = 'Ver detalles';
        let itAutor = 'Anónimo';

        if (comp.itinerario) {
             const it = comp.itinerario;
             itTitulo = it.titulo || 'Ver detalles';
             
             const creadorRaw = it.creador || it.turista;
             let perfilItin = creadorRaw?.usuario?.perfil_usuario || creadorRaw?.perfil_usuario;
             if (Array.isArray(perfilItin)) perfilItin = perfilItin[0];

             if (perfilItin) {
                const n = perfilItin.nombre || '';
                const a = perfilItin.ap_p || '';
                itAutor = `${n} ${a}`.trim() || 'Usuario';
             }
        }

        nuevoLocal = {
          id: comp.id_publicacion,
          title: comp.titulo,
          description: comp.descripcion,
          fecha_publicacion: comp.fecha_publicacion,
          image: Array.isArray(comp.foto) ? comp.foto[0] : (comp.foto || 'https://via.placeholder.com/300'),
          images: Array.isArray(comp.foto) ? comp.foto : [],
          likes: 0,
          comments: 0,
          isFriend: false,

          id_itinerario: comp.id_itinerario,
          itinerario_titulo: itTitulo,
          itinerario_autor: itAutor,

          author: {
            id: user.id_usuario || user.id,
            name: myFullName,
            avatar: myAvatar
          }
        };
      } catch (e) {
        // Fallback
        nuevoLocal = {
          id: nuevoId,
          title: datosDelModal.titulo,
          description: datosDelModal.description,
          fecha_publicacion: new Date().toISOString(),
          image: Array.isArray(datosDelModal.fotos) && datosDelModal.fotos.length > 0 ? datosDelModal.fotos[0] : 'https://via.placeholder.com/300',
          images: datosDelModal.fotos || [],
          likes: 0,
          comments: 0,
          isFriend: false,
          id_itinerario: datosDelModal.id_itinerario,
          // En fallback no tenemos datos del itinerario, pero al recargar aparecerán
          itinerario_titulo: 'Ver detalles',
          itinerario_autor: 'Cargando...',
          author: {
            id: user.id_usuario || user.id,
            name: myFullName,
            avatar: myAvatar
          }
        };
      }

      setMyPosts(prev => [nuevoLocal, ...prev]);
      setIsNewPubModalOpen(false);
      showAlert('success', '¡Publicación creada con éxito!', 'Tu publicación ya está en el feed principal');

    } catch (error) {
      console.error('Error creando publicación:', error);
      showAlert('error', 'Error al crear publicación.', 'Intentalo de nuevo mas tarde.');
    }
  };

  // --- 3. ELIMINAR POST (EJECUTADA POR EL MODAL) ---
  const handleConfirmDeleteStart = (post) => {
    setPostToDelete({
      id: post.id,
      title: post.title
    });
  };

  const handleDeletePost = async () => {
    if (!token || !postToDelete) return;

    const postId = postToDelete.id;

    try {
      await eliminarPublicacionAPI(token, postId);
      setMyPosts(prev => prev.filter(p => p.id !== postId));
      showAlert('success', '¡Publicación eliminada con éxito!', '', 2500);
      setSelectedPost(null);
    } catch (error) {
      console.error('❌ Error eliminando publicación:', error);
      showAlert('error', 'Error al eliminar publicación.', 'Inténtalo de nuevo mas tarde');
    } finally {
      setPostToDelete(null);
    }
  };


  // --- 4. EDITAR PERFIL ---
  const handleOpenEditModal = () => { 
    setIsEditModalOpen(true);
    setActiveEditSubTab('datos-basicos'); 
  };

  const handleCloseEditModal = () => {
      setIsEditModalOpen(false);
  };
  
  // --- 4.1 NAVEGACIÓN POR ESTADÍSTICAS ---
  const handleViewPosts = () => {
    setActiveTab('publicaciones');
  };

  const handleViewFriends = () => {
    setActiveTab('mis-amigos');
  };

  // --- 5. ENVIAR SOLICITUD ---
  const handleSendRequest = async (authorId) => {
    try {
      await enviarSolicitudAmistadAPI(token, authorId);
      showAlert('success', '¡Solicitud enviada con éxito!', 'Se ha notificado al usuario.');
    } catch (error) {
      console.error('❌ Error enviando solicitud:', error);
      showAlert('error', 'Error al enviar solicitud.', error.message || 'Inténtalo de nuevo mas tarde.');
    }
  };

  // --- 6. ABRIR VISOR DE ITINERARIO (Función para el modal) ---
  const handleViewItinerary = (idItinerario) => {
    setViewingItineraryId(idItinerario);
  };

  const handleOpenPostModal = (post) => {
    setSelectedPost(post);
  };


  const renderContentView = () => {
    if (loading && activeTab === 'publicaciones') {
      return (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <p className="text-gray-500 mt-4">Cargando tus publicaciones...</p>
        </div>

      );
    }

    switch (activeTab) {
      case 'publicaciones':
        return (
          <MyPublicationsView
            posts={myPosts}
            onPostClick={handleOpenPostModal}
            allowDelete={true}
            onDeletePost={handleConfirmDeleteStart} 
          />
        );
      case 'mis-amigos':
        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
              Mis Amigos ({friendCount})
            </h2>
            <div className="max-h-[70vh] overflow-y-auto pr-2">
              <MisAmigosGrid onOpenChat={() => showAlert('success', 'Próximamente', 'La función de chat estará disponible pronto.')} />
            </div>
          </div>
        );
      case 'editar-perfil':
            setActiveTab('publicaciones');
            return null; 
      default:
        return <MyPublicationsView posts={myPosts} onOpenPostModal={handleOpenPostModal} />;
    }
  };

  return (
    <>
     <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* 1. PERFIL HEADER Y NAVEGACIÓN POR ESTADÍSTICAS */}
        <div className="bg-white rounded-3xl shadow-xl p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
            <img
                src={myAvatar}
                alt="Avatar"
                className="w-32 h-32 rounded-full ring-4 ring-emerald-500"
            />

            <div className="flex-1 space-y-3 text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900">{myFullName}</h1>
                <p className="text-emerald-600 text-sm font-medium bg-emerald-50 inline-block px-3 py-0.5 rounded-full truncate max-w-full">@{user?.nombre_usuario || 'usuario'}</p>
                <p className="text-gray-700">{user?.descripcion || 'Sin descripción'}</p>

                {/* 🔑 NAVEGACIÓN POR ESTADÍSTICAS */}
                <div className="flex justify-center md:justify-start gap-8 pt-4">
                {/* Botón de Publicaciones */}
                <div 
                    onClick={handleViewPosts}
                    className={`cursor-pointer transition-all pb-2 border-b-3 rounded-b-sm ${
                        activeTab === 'publicaciones' 
                            ? 'text-emerald-700 border-emerald-700' 
                            : 'text-gray-700 border-transparent hover:text-emerald-600'
                    }`}
                >
                    <p className={`text-xl font-bold ${activeTab === 'publicaciones' ? 'text-emerald-700' : 'text-current'}`}>
                        {myPosts.length}
                    </p>
                    <p className={`text-sm ${activeTab === 'publicaciones' ? 'text-emerald-600' : 'text-gray-500'}`}>
                        Publicaciones
                    </p>
                </div>

                {/* Botón de Amigos */}
                <div 
                    onClick={handleViewFriends}
                    className={`cursor-pointer transition-all pb-2 border-b-3 rounded-b-sm ${
                        activeTab === 'mis-amigos' 
                            ? 'text-emerald-700 border-emerald-700' 
                            : 'text-gray-700 border-transparent hover:text-emerald-600'
                    }`}
                >
                    <p className={`text-xl font-bold ${activeTab === 'mis-amigos' ? 'text-emerald-700' : 'text-current'}`}>
                        {friendCount}
                    </p>
                    <p className={`text-sm ${activeTab === 'mis-amigos' ? 'text-emerald-600' : 'text-gray-500'}`}>
                        Amigos
                    </p>
                </div>
            </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex gap-3 mt-4 md:mt-0 items-start">
                <button
                    onClick={() => setIsNewPubModalOpen(true)}
                    className="flex items-center gap-1 bg-green-200 hover:bg-green-300 text-emerald-700 px-4 py-2 rounded-xl font-medium transition-colors border-emerald-400 border"
                >
                    <Plus size={18} /> Publicar
                </button>

                <button
                    onClick={handleOpenEditModal} 
                    className="flex items-center gap-1 border border-emerald-500 text-emerald-600 px-4 py-2 rounded-xl font-medium hover:bg-emerald-50 transition-colors"
                >
                    <Pencil size={18} /> Editar perfil
                </button>
            </div>
        </div>

        {/* 2. CONTENIDO PRINCIPAL (Publicaciones o Amigos) */}
        <div className="bg-white rounded-3xl shadow-md p-6">
            {renderContentView()}
        </div>

    </div>


      {/* --- MODALES --- */}
      
      {/* MODAL DE EDICIÓN DE PERFIL */}
      {isEditModalOpen && createPortal(
          <Editarperfil
              onClose={handleCloseEditModal} 
              onProfileUpdate={() => { 
                  window.location.reload(); 
                  handleCloseEditModal(); 
              }}
              activeSubTab={activeEditSubTab} 
              setActiveSubTab={setActiveEditSubTab}
          />,
          document.body
      )}

      {/* MODAL NUEVA PUBLICACIÓN */}
      {isNewPubModalOpen && (
        <NewPublicationModal
          onClose={() => setIsNewPubModalOpen(false)}
          onAddPost={handleAddPost}
          showToast={showAlert}
        />
      )}

      {/* MODAL DETALLE PUBLICACIÓN y otros modales (sin cambios) */}
      {selectedPost && (
        <PublicationDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onDelete={handleDeletePost}
          allowDelete={false}
          onSendRequest={handleSendRequest}
          onViewItinerary={handleViewItinerary}
        />
      )}

      {viewingItineraryId && (
        <ItineraryViewerModal
          idItinerario={viewingItineraryId}
          onClose={() => setViewingItineraryId(null)}
        />
      )}

      {postToDelete && createPortal(
        <ModalConfirmacion
          isOpen={!!postToDelete}
          onClose={() => setPostToDelete(null)}
          onConfirm={handleDeletePost}
          titulo={`Eliminar Publicación: "${postToDelete.title || 'Sin título'}"`}
          mensaje="¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer."
          textoConfirmar="Eliminar"
          tipo="eliminar"
        />,
        document.body
      )}
    </>
  );
};

export default Perfil;
