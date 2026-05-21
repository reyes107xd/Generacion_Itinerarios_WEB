import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../Extras/nombre';
import RecommendationsSection from '../../components/RecommendationsSection';
import FeedSection from '../../components/FeedSection';
import NewPublication from '../../components/NewPublication';
import NewItinerario from '../../components/NewItinerario';
import ProfileModal from '../../components/common/ProfileModal';
import NewPublicationModal from '../../components/common/NewPublicationModal';
import PublicationDetailModal from '../../components/common/PublicationDetailModal';
import ItineraryViewerModal from '../../components/common/ItineraryViewerModal';
import { 
  Globe, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  MapPlus, 
  Plus
} from 'lucide-react'; 
import { useAlert } from '../../context/alertContext';
import { useAuth } from '../../context/authContext';

// APIs
import { obtenerFeedAPI, toggleLikeAPI, obtenerMisLikesAPI, crearPublicacionAPI, obtenerUnicaPublicacionAPI } from '../../api/a-publicacion';
import { obtenerMisReportesAPI } from '../../api/a-reporte';
import { enviarSolicitudAmistadAPI } from '../../api/friends';
import { toggleGuardadoAPI, obtenerIdsGuardadosAPI } from '../../api/a-guardado';
import { obtenerItinerarios } from '../../api/api-itinerario';

// --- HELPERS ---
const getAvatarUrl = (foto, nombre) => {
  if (foto && foto.trim() !== '') return foto;
  const nombreSafe = nombre || 'Usuario';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreSafe)}&background=1D7743&color=fff&bold=true`;
};

const getFullName = (u) => {
  if (!u) return 'Usuario';
  return u.ap_p ? `${u.nombre} ${u.ap_p}`.trim() : u.nombre;
};

const Home = () => {
  usePageTitle('Inicio - Tlamatini');
  const { token, user } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  // ID del usuario actual normalizado a String para comparaciones seguras
  const currentUserId = user ? String(user.id_usuario || user.id) : null;
  const [travelPosts, setTravelPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState([]);
  const [suggestedItinerarios, setSuggestedItinerarios] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [recControls, setRecControls] = useState(null);

  // Filtro
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'friends'

  const [reportedPostIds, setReportedPostIds] = useState([]);
  const [likedPostIds, setLikedPostIds] = useState([]);
  const [savedPostIds, setSavedPostIds] = useState([]);

  const [isNewPubModalOpen, setIsNewPubModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [postParaDetalle, setPostParaDetalle] = useState(null);
  const [viewingItineraryId, setViewingItineraryId] = useState(null);

  // 1. Cargar Datos
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const datosBackend = await obtenerFeedAPI(token);

        const postsAdaptados = datosBackend.map(p => {
          // 1. Datos del Autor
          const authorName = p.autor?.name || p.autor?.nombre || 'Anónimo';
          const authorAvatar = getAvatarUrl(p.autor?.avatar || p.autor?.foto, authorName);
          const username = p.autor?.username || p.autor?.nombre_usuario || `user${p.autor?.id || p.id_turista}`;

          // 2. Lógica de Itinerario Vinculado (Robusta)
          const itData = Array.isArray(p.itinerario) ? p.itinerario[0] : p.itinerario;
          let nombreCreadorItinerario = 'Anónimo';
          let tituloItinerario = itData?.titulo;

          if (itData) {
            // Intentamos buscar al creador en 'creador', 'turista', o 'usuario'
            const creadorRaw = itData.creador || itData.turista || itData.usuario; 
            const creadorObj = Array.isArray(creadorRaw) ? creadorRaw[0] : creadorRaw;

            if (creadorObj) {
                // Buscamos el perfil en varios niveles
                let perfil = creadorObj.usuario?.perfil_usuario; // Nivel profundo
                if (!perfil) perfil = creadorObj.perfil_usuario; // Nivel medio
                if (!perfil && creadorObj.nombre) perfil = creadorObj; // Nivel plano

                // Normalizamos si el perfil viene en un array
                if (Array.isArray(perfil)) perfil = perfil[0];

                if (perfil) {
                    nombreCreadorItinerario = `${perfil.nombre || ''} ${perfil.ap_p || ''}`.trim() || 'Usuario';
                }
            }
          }

          // 3. Lógica de Amistad y Privacidad (Restaurada)
          const autorIsFriend = Boolean(
            p.isFriend ||
            p.amistad ||
            (p.autor && (p.autor.isFriend || p.autor.amistad)) ||
            p.relacion === 'amigo' ||
            p.estado_amistad === 'aceptada'
          );

          const privacidadRaw = (p.privacidad || '').toString().toLowerCase().trim();
          const privacidadNorm = (
            privacidadRaw === 'friends' ||
            privacidadRaw === 'amigos' ||
            privacidadRaw === 'solo amigos' ||
            privacidadRaw === 'privado' ||
            privacidadRaw === 'private'
          ) ? 'friends' : 'public';

          return {
            id: p.id_publicacion,
            title: p.titulo,
            description: p.descripcion,
            fecha_publicacion: p.fecha_publicacion,
            images: Array.isArray(p.foto) ? p.foto : [],
            likes: p.likes || 0, 
            comments: p.commentsCount || 0,
            isFriend: autorIsFriend,
            privacidad: privacidadNorm,
            status: 'published',
            id_itinerario: p.id_itinerario,
            
            // Datos del itinerario calculados arriba
            itinerario_titulo: tituloItinerario || 'Ver detalles',
            itinerario_autor: nombreCreadorItinerario,
            
            author: {
              id: p.autor?.id || p.id_turista || 0,
              name: authorName,
              avatar: authorAvatar,
              username: username
            }
          };
        });
        setTravelPosts(postsAdaptados);
      } catch (error) {
        console.error("Error al cargar el feed:", error);
        showAlert('error', 'Error al obtener publicaciones.', 'No se pudo cargar el feed principal. Intentelo de nuevo más tarde.');
      }

      if (token) {
        try {
          const [reportesData, likesData, guardadosData] = await Promise.all([
            obtenerMisReportesAPI(token),
            obtenerMisLikesAPI(token),
            obtenerIdsGuardadosAPI(token)
          ]);
          setReportedPostIds(reportesData.publicaciones || []);
          setLikedPostIds(likesData);
          setSavedPostIds(guardadosData);
        } catch (error) {
          console.error("Error al obtener datos de usuario:", error);
        }
      }
      setLoading(false);
    };
    cargarDatos();
  }, [token]);

  // 2. Cargar Sugerencias
  useEffect(() => {
    const cargarSugerencias = async () => {
      try {
        setLoadingSuggestions(true);
        const data = await obtenerItinerarios();
        const lista = Array.isArray(data) ? data : (data.data || []);
        const publicos = lista.filter(it => it.privacidad !== true && it.id_privacidad !== 1);
        setSuggestedItinerarios(publicos.slice(0, 5));
      } catch (error) {
        console.error("Error al obtener sugerencias:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    cargarSugerencias();
  }, []);

  // --- LÓGICA DE FILTRADO Y SEGURIDAD ---
  const filteredPosts = travelPosts.filter(post => {
    // 1. Verificar si soy yo (Comparación Robustas de String)
    const postAuthorId = String(post.author.id);
    const isMe = postAuthorId === currentUserId;

    // 2. REGLA DE SEGURIDAD (Posts Privados)
    const isPrivateContent = post.privacidad === 'friends' || post.privacidad === 'amigos' || post.privacidad === 'solo amigos';

    // Si es privado, NO es amigo y NO soy yo -> OCULTAR
    if (isPrivateContent && !post.isFriend && !isMe) {
      return false;
    }

    // 3. REGLA DE PESTAÑAS
    if (feedFilter === 'all') {
      return true; // Muestra todo lo que pasó el filtro de seguridad (incluye mis posts privados)
    }

    if (feedFilter === 'friends') {
      return post.isFriend || isMe; // Muestra amigos y mis propios posts
    }

    return true;
  });

  // --- HANDLERS ---
  const handleLike = async (post) => {
    const isLiked = likedPostIds.includes(post.id);
    const accion = isLiked ? 'quitar' : 'dar';
    if (isLiked) {
      setLikedPostIds(prev => prev.filter(id => id !== post.id));
      setTravelPosts(posts => posts.map(p => p.id === post.id ? { ...p, likes: p.likes - 1 } : p));
    } else {
      setLikedPostIds(prev => [...prev, post.id]);
      setTravelPosts(posts => posts.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p));
    }
    try { await toggleLikeAPI(token, post.id, accion); } catch (e) { console.error(e); }
  };

  const handleToggleSave = async (post) => {
    const isSaved = savedPostIds.includes(post.id);
    const accion = isSaved ? 'quitar' : 'guardar';
    if (isSaved) {
      setSavedPostIds(prev => prev.filter(id => id !== post.id));
      showAlert('success', '¡Eliminado con éxito!', 'Ya no aparecerá en tu sección de guardados.');
    } else {
      setSavedPostIds(prev => [...prev, post.id]);
      showAlert('success', '¡Guardado con éxito!', 'Consultalo en la sección de guardados.');
    }
    try { await toggleGuardadoAPI(token, post.id, accion); } catch (e) { console.error(e); }
  };

  const handleSendRequest = async (authorId) => {
    try {
      await enviarSolicitudAmistadAPI(token, authorId);
      setSentRequests((prev) => [...prev, authorId]);
      showAlert('success', '¡Solicitud enviada con éxito!', 'Se ha notificado al usuario.');
    } catch (e) { showAlert('error', 'Error al enviar solicitud.', 'Ya existe una solicitud pendiente o ocurrió un error. Inténtelo de nuevo más tarde.');}
  };
  // --- REPORTAR (REDIRECCIÓN A PÁGINA) ---
  const handleReportPost = (postId) => {
    navigate(`/reportar/${postId}`);
  };

  // --- AGREGAR POST (OPTIMISTA) ---
  const handleAddPost = async (datosDelModal) => {
    try {
      const datosParaAPI = {
        titulo: datosDelModal.titulo,
        descripcion: datosDelModal.description,
        tipo_publicacion: datosDelModal.tipo_publicacion || 'foto',
        foto: datosDelModal.fotos,
        privacidad: datosDelModal.privacidad,
        id_itinerario: datosDelModal.id_itinerario
      };

      const nueva = await crearPublicacionAPI(token, datosParaAPI);
      const nuevoId = nueva.publicacion?.id_publicacion || nueva.id_publicacion;

      let nuevoPostParaFeed;

      // Intentamos obtener datos completos del backend
      if (nuevoId) {
        try {
          const comp = await obtenerUnicaPublicacionAPI(token, nuevoId);
          // Helpers para asegurar datos
          const authorName = getFullName(comp.turista?.usuario?.perfil_usuario?.[0] || user);
          const authorAvatar = getAvatarUrl(comp.turista?.usuario?.perfil_usuario?.[0]?.foto || user.foto, authorName);
          const authorUsername = perfilAutor.nombre_usuario || 'usuario';
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
          nuevoPostParaFeed = {
            id: comp.id_publicacion,
            title: comp.titulo,
            description: comp.descripcion,
            fecha_publicacion: comp.fecha_publicacion,
            images: Array.isArray(comp.foto) ? comp.foto : [],
            likes: 0,
            comments: 0,
            isFriend: false, // Por defecto false, pero el filtro 'isMe' la salvará
            privacidad: comp.privacidad, // IMPORTANTE para el filtro
            status: 'published',
            id_itinerario: comp.id_itinerario,
            itinerario_titulo: itTitulo, 
            itinerario_autor: itAutor,   
            author: {
              id: currentUserId, // Usamos el ID seguro del usuario actual
              name: authorName,
              avatar: authorAvatar,
              username: authorUsername
            }
          };
        } catch (e) { console.warn("Fallo carga inmediata, usando local"); }
      }

      // Fallback Local
      if (!nuevoPostParaFeed) {
        const myName = getFullName(user);
        const myAvatar = getAvatarUrl(user.foto, myName);
        const myUsername = user.nombre_usuario || 'usuario';

        nuevoPostParaFeed = {
          id: nuevoId || Date.now(),
          title: datosDelModal.titulo,
          description: datosDelModal.description,
          fecha_publicacion: new Date().toISOString(),
          images: datosDelModal.fotos || [],
          likes: 0,
          comments: 0,
          isFriend: false,
          privacidad: datosDelModal.privacidad, // IMPORTANTE para el filtro
          status: 'published',
          id_itinerario: datosDelModal.id_itinerario,
          author: {
            id: currentUserId, // Usamos el ID seguro
            name: myName,
            avatar: myAvatar,
            username: myUsername
          }
        };
      }

      setTravelPosts(prev => [nuevoPostParaFeed, ...prev]);
      setIsNewPubModalOpen(false);
      showAlert('success', '¡Publicación creada con éxito!', 'Tu publicación ya está en el feed principal');

    } catch (e) {
      console.error(e);
      showAlert('error', 'Error al crear publicación.', 'No se pudo crear la publicación. Intentelo de nuevo más tarde.');
    }
  };

  const handleOpenNewPubModal = () => setIsNewPubModalOpen(true);
  const handleCloseNewPubModal = () => setIsNewPubModalOpen(false);
  const handleViewProfile = (author, isFriend) => { setSelectedProfile({ ...author, isFriend }); setIsProfileModalOpen(true); };
  const handleCloseProfileModal = () => { setIsProfileModalOpen(false); setSelectedProfile(null); };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="w-full max-w-[1400px] mx-auto p-3 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-4 md:gap-6">

          <main className="space-y-4 md:space-y-6 w-full min-w-0">
            <section>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h5 className="text-lg font-bold text-gray-900 flex items-center gap-1">
                  <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                  Sugerencias de Itinerarios
                </h5>
                {recControls && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={recControls.prev}
                      disabled={recControls.currentPage === 0}
                      className={`${recControls.BUTTON_BASE_CLASSES} ${recControls.currentPage === 0 ? recControls.DISABLED_BTN_CLASSES : recControls.ACTIVE_BTN_CLASSES}`}
                      aria-label="Anterior"
                    >
                      <ChevronLeft className="h-3 w-4" />
                    </button>
                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: recControls.totalPages }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => recControls.goTo(index)}
                          className={`transition-all duration-300 rounded-full ${
                            recControls.currentPage === index
                              ? 'w-8 h-2 bg-emerald-600'
                              : 'w-2 h-2 bg-emerald-200 hover:bg-emerald-300'
                          }`}
                          aria-label={`Ir a página ${index + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={recControls.next}
                      disabled={recControls.currentPage === recControls.totalPages - 1}
                      className={`${recControls.BUTTON_BASE_CLASSES} ${recControls.currentPage === recControls.totalPages - 1 ? recControls.DISABLED_BTN_CLASSES : recControls.ACTIVE_BTN_CLASSES}`}
                      aria-label="Siguiente"
                    >
                      <ChevronRight className="h-3 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <RecommendationsSection onControlsReady={setRecControls} hideHeaderControls />
            </section>

            <h5 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              Publicaciones Recientes
            </h5>

            {/* FILTROS */}
            <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm w-fit mb-4">
              <button onClick={() => setFeedFilter('all')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${feedFilter === 'all' ? 'bg-emerald-100 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                <Globe size={16} /> Todos
              </button>
              <div className="w-px h-5 bg-gray-200"></div>
              <button onClick={() => setFeedFilter('friends')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${feedFilter === 'friends' ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                <Users size={16} /> Solo Amigos
              </button>
            </div>

            {loading ? (
              <div className="text-center py-10">Cargando publicaciones...</div>
            ) : (
              <FeedSection
                travelPosts={filteredPosts}
                sentRequests={sentRequests}
                onLike={handleLike}
                onSendRequest={handleSendRequest}
                onViewProfile={handleViewProfile}
                reportedPostIds={reportedPostIds}
                likedPostIds={likedPostIds}
                onCommentClick={setPostParaDetalle}
                savedPostIds={savedPostIds}
                onToggleSave={handleToggleSave}
                onViewItinerary={setViewingItineraryId}
                onReport={handleReportPost}
              />
            )}


          </main>

{/* --- SECCIÓN DE ACCIONES RESPONSIVA --- */}
          <div className="relative">
            {/* VISTA ESCRITORIO: Se mantiene igual a la derecha */}
            <aside className="hidden lg:block space-y-6 lg:sticky lg:top-24 lg:h-fit">
              <NewPublication onOpenModal={handleOpenNewPubModal} />
              <NewItinerario />
            </aside>

            {/* VISTA MÓVIL: Botones flotantes circulares (Solo iconos) */}
            <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 lg:hidden z-[999]">
              
              {/* Botón Itinerario (Pequeño / Negro) */}
              <button 
                onClick={() => navigate('/gestionaritinerario')} 
                className="w-12 h-12 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-2 border-white"
                title="Nuevo Itinerario"
              >
                <MapPlus size={20} />
              </button>

              {/* Botón Publicar (Principal / Esmeralda) */}
              <button 
                onClick={handleOpenNewPubModal}
                className="w-14 h-14 bg-emerald-400 text-emerald-900 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-2 border-white"
                title="Nueva Publicación"
              >
                <Plus size={28} />
              </button>
              
            </div>
          </div>
          {/* --- FIN SECCIÓN ACCIONES --- */}

        </div>
      </div>

      {/* MODALES */}
      {isNewPubModalOpen && <NewPublicationModal onClose={handleCloseNewPubModal} onAddPost={handleAddPost} showToast={showAlert} />}
      {isProfileModalOpen && <ProfileModal user={selectedProfile} onClose={handleCloseProfileModal} onSendRequest={handleSendRequest} isRequestAlreadySent={sentRequests.includes(selectedProfile?.id)} />}
      {postParaDetalle && <PublicationDetailModal post={postParaDetalle} onClose={() => setPostParaDetalle(null)} allowDelete={false} onSendRequest={handleSendRequest} />}
      {viewingItineraryId && <ItineraryViewerModal idItinerario={viewingItineraryId} onClose={() => setViewingItineraryId(null)} />}
    </div>
  );
};

export default Home;