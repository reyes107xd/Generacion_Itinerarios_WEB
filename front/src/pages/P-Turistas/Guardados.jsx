import { useState, useEffect } from 'react';
import { BookmarkX, Image as ImageIcon, Map as MapIcon, Calendar, Clock, User, ArrowRight } from "lucide-react"; 
import usePageTitle from '../../Extras/nombre';
import { useAuth } from '../../context/authContext'; 
import { useAlert } from '../../context/alertContext';
import { obtenerColeccionGuardadosAPI, toggleGuardadoAPI } from '../../api/a-guardado'; 
import { enviarSolicitudAmistadAPI, obtenerAmigosAPI } from '../../api/friends'; 
import PublicationDetailModal from '../../components/common/PublicationDetailModal';
import ItineraryViewerModal from '../../components/common/ItineraryViewerModal';

// --- HELPERS ---
const getAvatarUrl = (foto, nombre) => {
  if (foto && foto.trim() !== '') return foto;
  const nombreSafe = nombre || 'Usuario';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreSafe)}&background=10b981&color=fff&bold=true`;
};

const buildFullName = (nombre, ap) => {
    const n = nombre || 'Usuario';
    const a = ap || '';
    return `${n} ${a}`.trim();
};

// --- COMPONENTES DE TARJETA ---

const SavedPostCard = ({ post, onRemove, onClickImage }) => {
  // Formatear fecha igual que en itinerarios
  const fecha = new Date(post.fecha_publicacion).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <article 
        className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col h-full overflow-hidden group cursor-pointer"
        onClick={() => onClickImage(post)}
    >
      {/* Imagen Header */}
      <div className="relative h-40 sm:h-48 bg-gray-100 overflow-hidden flex-shrink-0">
        <img 
            src={post.images[0] || 'https://via.placeholder.com/300?text=Sin+Imagen'} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 sm:gap-1.5 shadow-sm">
            <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Publicación
        </div>
      </div>
      
      {/* Contenido */}
      <div className="p-3 sm:p-4 lg:p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1.5 sm:mb-2 line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {post.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2 flex-grow leading-relaxed">
            {post.description}
        </p>
        
        {/* Fecha de Publicación */}
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-medium text-gray-500 mb-3 sm:mb-5 bg-gray-50 p-2 sm:p-2.5 rounded-lg border border-gray-100">
            <span className="flex items-center gap-1 sm:gap-1.5">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500"/> 
                Publicado el {fecha}
            </span>
        </div>

        {/* Footer Autor */}
        <div className="flex items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-50 mt-auto">
          <img src={post.author.avatar} alt={post.author.name} className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border border-gray-100 shadow-sm" />
          <div className="flex flex-col overflow-hidden">
             <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{post.author.name}</span>
             <span className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">@{post.author.username}</span>
          </div>
        </div>
      </div>
      
      {/* Botón Eliminar */}
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(post.id); }} 
        className="w-full py-2 sm:py-2.5 lg:py-3 bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 border-t border-gray-100 flex-shrink-0"
      >
        <BookmarkX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Quitar de guardados
      </button>
    </article>
  );
};

const SavedItineraryCard = ({ itinerario, onRemove, onClickOpen }) => {
  // Configuración de formato de fecha
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  
  // Formatear Inicio
  const inicio = new Date(itinerario.fecha_inicio).toLocaleDateString('es-MX', options);
  
  // Formatear Fin (si existe)
  const fin = itinerario.fecha_termino 
    ? new Date(itinerario.fecha_termino).toLocaleDateString('es-MX', options)
    : null;

  // Crear string de rango
  const textoRangoFechas = fin ? `${inicio} - ${fin}` : inicio;
  
  // Avatar del creador
  const avatarUrl = getAvatarUrl(itinerario.creador.foto, itinerario.creador.nombre);

  return (
    <article 
        className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-emerald-100/60 flex flex-col h-full overflow-hidden group cursor-pointer relative"
        onClick={() => onClickOpen(itinerario.id)}
    >
      {/* Header Gradiente */}
      <div className="h-40 sm:h-48 bg-gradient-to-br from-emerald-500 to-teal-600 p-4 sm:p-5 lg:p-6 text-white flex flex-col justify-between relative overflow-hidden flex-shrink-0">
          <MapIcon className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8 text-white/10 w-32 h-32 sm:w-40 sm:h-40 transform rotate-12" />
          
          <div className="flex justify-between items-start z-10">
             <div className="bg-white/20 backdrop-blur-md text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold flex items-center gap-1 sm:gap-1.5 border border-white/10">
                <MapIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5"/> Itinerario
             </div>
          </div>
          <h3 className="font-bold text-lg sm:text-xl leading-tight line-clamp-2 z-10 tracking-tight">{itinerario.titulo}</h3>
      </div>
      
      <div className="p-3 sm:p-4 lg:p-5 flex flex-col flex-grow">
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2 flex-grow leading-relaxed">
            {itinerario.descripcion || <span className="italic text-gray-400">Sin descripción disponible.</span>}
        </p>
        
        {/* RANGO DE FECHAS (Sin etiqueta de estado) */}
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-medium text-gray-500 mb-3 sm:mb-5 bg-gray-50 p-2 sm:p-2.5 rounded-lg border border-gray-100">
            <span className="flex items-center gap-1 sm:gap-1.5">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500"/> 
                {textoRangoFechas}
            </span>
        </div>

        {/* Footer Autor con FOTO y USERNAME */}
        <div className="flex items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-50 mt-auto">
          <img src={avatarUrl} alt={itinerario.creador.nombre} className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border border-gray-100 shadow-sm" />
          <div className="flex flex-col overflow-hidden">
             <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{itinerario.creador.nombre}</span>
             <span className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">@{itinerario.creador.username}</span>
          </div>
        </div>
      </div>
      
      {/* Botón Eliminar */}
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(itinerario.id); }} 
        className="w-full py-2 sm:py-2.5 lg:py-3 bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 border-t border-gray-100 flex-shrink-0"
      >
        <BookmarkX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Quitar de guardados
      </button>
    </article>
  );
};

// --- PÁGINA PRINCIPAL ---

const Guardados = () => {
  const { token, user } = useAuth();
  const { showAlert } = useAlert();
  usePageTitle('Guardados - Tlamatini');
  
  const [activeTab, setActiveTab] = useState('publicaciones'); 
  const [guardados, setGuardados] = useState({ publicaciones: [], itinerarios: [] });
  const [loading, setLoading] = useState(true);
  
  const [selectedPost, setSelectedPost] = useState(null); 
  const [selectedItineraryId, setSelectedItineraryId] = useState(null); 

  useEffect(() => {
    const cargarColeccion = async () => {
      if (!token) return;
      try {
        setLoading(true);
        
        const [dataGuardados, amigosData] = await Promise.all([
            obtenerColeccionGuardadosAPI(token),
            obtenerAmigosAPI(token).catch(() => []) 
        ]);

        const idsAmigos = new Set(amigosData.map(a => String(a.id)));
        const miIdUsuario = String(user?.id_usuario || user?.id);

        const pubs = [];
        const itins = [];

        dataGuardados.forEach((item) => {
            // === PUBLICACIONES ===
            if (item.publicacion) {
                const p = item.publicacion;
                
                const autorUsuario = p.autor || {}; 
                const perfilArray = autorUsuario.perfil_usuario || [];
                const perfilData = Array.isArray(perfilArray) ? perfilArray[0] : (perfilArray || {});

                const nombre = perfilData.nombre || 'Usuario';
                const apellido = perfilData.ap_p || '';
                const fullName = buildFullName(nombre, apellido);
                const avatar = getAvatarUrl(perfilData.foto, fullName);
                const username = perfilData.nombre_usuario || 'usuario';
                
                const idTurista = p.id_turista;
                const idUsuarioAutor = autorUsuario.id_usuario;

                const esAmigo = idsAmigos.has(String(idTurista));
                const soyYo = String(idUsuarioAutor) === miIdUsuario;

                const likesCount = (p.reaccion && p.reaccion[0]) ? p.reaccion[0].count : 0;
                const commentsCount = (p.comentario && p.comentario[0]) ? p.comentario[0].count : 0;

                const itData = Array.isArray(p.itinerario) ? p.itinerario[0] : p.itinerario;
                let nombreCreadorItinerario = 'Anónimo';
                let tituloItinerario = itData?.titulo;

                if (itData) {
                    const creadorUser = itData.creador || {};
                    const creadorUserFinal = Array.isArray(creadorUser) ? creadorUser[0] : creadorUser;
                    
                    const cPerfilArr = creadorUserFinal?.perfil_usuario;
                    const cPerfil = Array.isArray(cPerfilArr) ? cPerfilArr[0] : cPerfilArr;

                    if (cPerfil) {
                       nombreCreadorItinerario = buildFullName(cPerfil.nombre, cPerfil.ap_p);
                    }
                }

                pubs.push({
                    id: p.id_publicacion,
                    title: p.titulo,
                    description: p.descripcion,
                    fecha_publicacion: p.fecha_publicacion,
                    images: Array.isArray(p.foto) ? p.foto : [],
                    likes: likesCount,
                    comments: commentsCount,
                    id_itinerario: p.id_itinerario,
                    itinerario_titulo: tituloItinerario,
                    itinerario_autor: nombreCreadorItinerario,
                    isFriend: esAmigo, 
                    privacidad: p.privacidad,
                    _isMe: soyYo, 
                    author: { 
                        id: idTurista, 
                        id_usuario: idUsuarioAutor,
                        name: fullName, 
                        username: username, 
                        avatar: avatar 
                    }
                });
            } 
            // === ITINERARIOS DIRECTOS ===
            else if (item.itinerario_guardado) {
                const it = item.itinerario_guardado;
                
                const creadorUser = it.creador || {}; 
                const creadorPerfil = (creadorUser.perfil_usuario && creadorUser.perfil_usuario[0]) 
                                      ? creadorUser.perfil_usuario[0] 
                                      : creadorUser; 
                
                const n = creadorPerfil.nombre || 'Anónimo';
                const a = creadorPerfil.ap_p || '';
                const nombreCreador = buildFullName(n, a);
                const fotoCreador = creadorPerfil.foto;
                const usernameCreador = creadorPerfil.nombre_usuario || 'usuario';

                itins.push({
                    id: it.id_itinerario,
                    titulo: it.titulo,
                    descripcion: it.descripcion,
                    fecha_inicio: it.fecha_inicio,
                    fecha_termino: it.fecha_termino,
                    creador: { 
                        nombre: nombreCreador,
                        foto: fotoCreador,
                        username: usernameCreador
                    }
                });
            }
        });

        setGuardados({ publicaciones: pubs, itinerarios: itins });

      } catch (error) {
        console.error("Error colección:", error);
        showAlert('error', 'Error al cargar guardados', 'No se pudieron cargar tus elementos guardados.');
      } finally {
        setLoading(false);
      }
    };
    cargarColeccion();
  }, [token, user]);

  // --- MANEJO DE ELIMINACIÓN CON ALERTAS ESPECÍFICAS ---
  const handleRemove = async (id, tipo) => {
    try {
      await toggleGuardadoAPI(token, id, 'quitar', tipo);
      
      const mensajeExito = tipo === 'publicacion' 
        ? '¡Publicación eliminada con éxito!' 
        : '¡Itinerario eliminado con éxito!';

      if (tipo === 'publicacion') {
          setGuardados(prev => ({ ...prev, publicaciones: prev.publicaciones.filter(p => p.id !== id) }));
      } else {
          setGuardados(prev => ({ ...prev, itinerarios: prev.itinerarios.filter(i => i.id !== id) }));
      }
      
      showAlert('success', mensajeExito);
    } catch (error) {
      showAlert('error', 'Error al eliminar guardado', 'No se pudo eliminar el elemento de tus guardados. Inténtalo de nuevo más tarde.');
    }
  };

  const handleSendRequest = async (authorId) => {
     try { await enviarSolicitudAmistadAPI(token, authorId); showAlert('success', '¡Solicitud enviada con éxito!'); } catch(e) {}
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="h-10 w-10 bg-emerald-200 rounded-full mb-3"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
    </div>
  );

  const listaMostrar = activeTab === 'publicaciones' ? guardados.publicaciones : guardados.itinerarios;

  return (
    <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Mis Guardados</h1>
                    <p className="text-gray-500 mt-0.5 sm:mt-1 text-xs sm:text-sm">Colección de tus publicaciones e itinerarios guardados.</p>
                </div>
                
                <div className="bg-white p-1 sm:p-1.5 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 flex w-full md:w-auto">
                    <button 
                        onClick={() => setActiveTab('publicaciones')}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-bold transition-all flex-1 md:flex-initial justify-center ${activeTab === 'publicaciones' ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <ImageIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> 
                        <span className="hidden sm:inline">Publicaciones</span>
                        <span className="sm:hidden">Publicaciones</span>
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${activeTab === 'publicaciones' ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>{guardados.publicaciones.length}</span>
                    </button>
                    <div className="w-px bg-gray-100 my-1 mx-0.5 sm:mx-1"></div>
                    <button 
                        onClick={() => setActiveTab('itinerarios')}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-bold transition-all flex-1 md:flex-initial justify-center ${activeTab === 'itinerarios' ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <MapIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> Itinerarios 
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${activeTab === 'itinerarios' ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>{guardados.itinerarios.length}</span>
                    </button>
                </div>
            </div>

            {listaMostrar.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 bg-white rounded-2xl sm:rounded-3xl border border-dashed border-gray-300 text-gray-400">
                    <div className="bg-gray-50 p-4 sm:p-5 rounded-full mb-3 sm:mb-4 ring-4 sm:ring-8 ring-gray-50/50">
                        <BookmarkX className="w-10 h-10 sm:w-12 sm:h-12 opacity-40 text-gray-500" />
                    </div>
                    <p className="font-semibold text-base sm:text-lg text-gray-600">No tienes {activeTab} guardados.</p>
                    <p className="text-xs sm:text-sm opacity-70 mt-1 max-w-xs text-center px-4">Explora el feed y guarda lo que te inspire para verlo aquí.</p>
                    <a href="/home" className="mt-4 sm:mt-6 text-emerald-600 font-bold text-xs sm:text-sm flex items-center gap-1 hover:underline">
                        Ir al Feed <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 animate-fade-in pb-6 sm:pb-8 lg:pb-10">
                {activeTab === 'publicaciones' ? (
                    listaMostrar.map((post) => (
                        <SavedPostCard key={post.id} post={post} onRemove={(id) => handleRemove(id, 'publicacion')} onClickImage={setSelectedPost} />
                    ))
                ) : (
                    listaMostrar.map((itinerario) => (
                        <SavedItineraryCard key={itinerario.id} itinerario={itinerario} onRemove={(id) => handleRemove(id, 'itinerario')} onClickOpen={setSelectedItineraryId} />
                    ))
                )}
                </div>
            )}

            {selectedPost && (
                <PublicationDetailModal 
                post={selectedPost} 
                onClose={() => setSelectedPost(null)} 
                onSendRequest={handleSendRequest} 
                allowDelete={false} 
                hideFriendButton={selectedPost._isMe} 
                onViewItinerary={(id) => { setSelectedPost(null); setSelectedItineraryId(id); }} 
                />
            )}

            {selectedItineraryId && (
                <ItineraryViewerModal 
                    idItinerario={selectedItineraryId}
                    onClose={() => setSelectedItineraryId(null)}
                />
            )}
        </div>
    </div>
  );
};

export default Guardados;