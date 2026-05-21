import { useState } from 'react'; 
import { Heart, Flag, MessageCircle, Bookmark, Map, UserX } from 'lucide-react'; // Importar UserX
import { useAuth } from '../context/authContext'; 
import ImageLightbox from './common/ImageLightbox'; 

// --- HELPER PARA AVATAR SEGURO ---
const getAvatarUrl = (foto, nombre) => {
  if (foto && foto.trim() !== '') return foto;
  const nombreSafe = nombre || 'Usuario';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreSafe)}&background=10b981&color=fff&bold=true`;
};

const FeedCard = ({
  post,
  onLike,
  onViewProfile,
  onCommentClick, 
  reportedPostIds = [],
  likedPostIds = [],
  savedPostIds = [],
  onToggleSave,
  onViewItinerary,
  onReport,
  onCancelRequest, // ✅ Nueva prop para cancelar solicitud
  isCancellingRequest = false // ✅ Nueva prop para mostrar estado de carga/cancelación
}) => {
  const { user } = useAuth();
  const currentUserId = user?.id || user?.id_usuario;
  
  // Diseño base más limpio y con transición de sombra
  const cardBase = "bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300";
  
  const isLiked = likedPostIds.includes(post.id);
  const isReported = reportedPostIds.includes(post.id);
  const isSaved = savedPostIds.includes(post.id);
  const isOwnPost = currentUserId && (String(currentUserId) === String(post.author.id));

  // Asumimos que post.isFriend puede ser 'none', 'sent', 'received', 'friends'
  // Si la amistad es 'sent', mostramos la opción de cancelar.
  const isRequestSent = post.isFriend === 'sent'; 
  const isFriend = post.isFriend === 'friends' || post.isFriend === 'accepted';
  const isCancelling = isCancellingRequest; // Usamos la prop de estado

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);

  const openLightbox = (index) => {
    setInitialImageIndex(index);
    setLightboxOpen(true);
  };

  const authorName = post.author.name || 'Anónimo';
  const username = post.author.username || `user${post.author.id}`;
  const authorAvatar = getAvatarUrl(post.author.avatar, authorName);

  return (
    <>
      <article className={cardBase}>
        {/* --- HEADER --- */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar con Ring y Hover */}
            {/* 💡 onViewProfile debe recibir el estado de amistad para el modal: post.isFriend */}
            <div className="relative group cursor-pointer" onClick={() => !isOwnPost && onViewProfile(post.author, post.isFriend)}>
              <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-md"></div>
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-11 h-11 rounded-full object-cover border-2 border-white ring-2 ring-transparent group-hover:ring-emerald-200 transition-all shadow-sm relative z-10"
              />
            </div>
            
            <div className="flex flex-col">
              <span 
                className="font-bold text-gray-900 leading-tight hover:text-emerald-700 cursor-pointer transition-colors"
                onClick={() => !isOwnPost && onViewProfile(post.author, post.isFriend)}
              >
                {authorName}
              </span>
              <span className="text-emerald-600 text-sm font-medium bg-emerald-50 px-1 py-0.5 inline-block rounded-full truncate max-w-full mt-1">@{username} </span>
              <span className="text-gray-600 text-sm font-medium  inline-block rounded-full truncate max-w-full">{new Date(post.fecha_publicacion).toLocaleDateString()}</span>              

              {post.status === 'pending' && (
                <span className="text-[10px] uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold w-fit mt-1">
                  Revisión
                </span>
              )}

              {/* ✅ Botón de Cancelar Solicitud dentro del Feed Card (opcional, pero útil) */}
              {isRequestSent && onCancelRequest && (
                 <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Evita que se abra el modal de perfil
                      onCancelRequest(post.author.id);
                    }} 
                    disabled={isCancelling}
                    className={`mt-1 flex items-center gap-1 text-[10px] text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-2 py-1 rounded-full font-medium transition w-fit ${isCancelling ? 'opacity-50 cursor-not-allowed' : ''}`} 
                    title="Cancelar solicitud enviada"
                  >
                    {isCancelling ? (
                      'Cancelando...' 
                    ) : (
                      <>
                        <UserX size={14} /> <span>Solicitud Enviada</span>
                      </>
                    )}
                 </button>
              )}

            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Menú de opciones / Reporte */}
            {/* ... resto del código del botón Reportar ... */}
            <div className="relative">
                {isReported ? (
                  <div className="p-2 text-red-400" title="Reportado">
                    <Flag size={18} fill="currentColor" />
                  </div>
                ) : (
                  <button
                    onClick={() => onReport && onReport(post.id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Reportar"
                  >
                    <Flag size={18} />
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* --- CONTENIDO --- */}
        {/* ... resto del contenido ... */}
        <div className="mb-4 pl-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">{post.title}</h3>
            <p className="text-gray-600 text-[15px] leading-relaxed whitespace-pre-wrap">{post.description}</p>
        </div>

        {/* --- ITINERARIO VINCULADO (DISEÑO PREMIUM) --- */}
        {/* ... resto del código del itinerario ... */}
        {post.id_itinerario && (
           <div 
             onClick={() => onViewItinerary && onViewItinerary(post.id_itinerario)}
             className="mb-5 group relative overflow-hidden rounded-xl border border-emerald-100/50 bg-gradient-to-br from-emerald-50/50 to-white p-4 cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all duration-300"
           >
              {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-100/50 rounded-full blur-2xl transition-transform group-hover:scale-150"></div>
              
              <div className="relative flex items-center justify-between z-10">
                 <div className="flex items-center gap-4">
                     <div className="bg-white p-2.5 rounded-xl shadow-sm border border-emerald-100 text-emerald-600 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                         <Map size={22} strokeWidth={1.5} /> 
                     </div>
                     <div className="flex flex-col">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Itinerario Recomendado</span>
                        <span className="font-bold text-gray-800 text-sm md:text-base line-clamp-1">{post.itinerario_titulo || 'Ver detalles'}</span>
                        <span className="text-xs text-gray-500">Por {post.itinerario_autor}</span>
                     </div>
                 </div>
                 
                 <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-emerald-100 text-emerald-600 shadow-sm group-hover:translate-x-1 transition-transform">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                 </div>
              </div>
           </div>
        )}


        {/* --- IMÁGENES (CON EFECTO ZOOM) --- */}
        {/* ... resto del código de imágenes ... */}
        {post.images && post.images.length > 0 && (
          <div className={`grid gap-2 mb-5 rounded-2xl overflow-hidden border border-gray-100 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            
            {/* Imagen Principal */}
            <div className={`relative overflow-hidden cursor-pointer group h-full min-h-[200px] md:min-h-[250px] ${post.images.length === 2 ? 'row-span-2' : ''}`}  onClick={() => openLightbox(0)}>
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10"></div>
                 <img
                    src={post.images[0]}
                    alt={post.title}
                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                 />
            </div>

            {/* Imágenes Secundarias */}
            {post.images.length > 1 && (
               <div className="flex flex-col gap-2 h-full">
                  {post.images.slice(1, 3).map((img, idx) => (
                      <div key={idx} className="relative overflow-hidden cursor-pointer group h-full" onClick={() => openLightbox(idx + 1)}>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10"></div>
                        <img
                            src={img}
                            alt={`Imagen ${idx + 2}`}
                            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                        />
                         {/* Overlay para "+X fotos" si hubiera más de 3 (opcional) */}
                         {idx === 1 && post.images.length > 3 && (
                             <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center text-white font-bold text-lg">
                                +{post.images.length - 3}
                             </div>
                         )}
                      </div>
                  ))}
               </div>
            )}
          </div>
        )}

        {/* --- ACTIONS FOOTER --- */}
        {/* ... resto del código de actions ... */}
        <div className="flex items-center justify-between pt-2">
          
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button
              onClick={() => onLike(post)}
              className="group flex items-center gap-1.5 focus:outline-none"
            >
              <div className={`p-2 rounded-full transition-all duration-300 ${isLiked ? 'bg-red-50 text-red-500' : 'bg-transparent text-gray-500 group-hover:bg-gray-50 group-hover:text-red-500'}`}>
                 <Heart 
                    size={22} 
                    className={`transition-transform duration-300 ${isLiked ? 'fill-current scale-110' : 'group-hover:scale-110'}`} 
                 />
            </div>
              <span className={`text-sm font-semibold transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500'}`}>
                {post.likes}
              </span>
            </button>

            {/* Comment Button */}
            <button
              onClick={() => onCommentClick && onCommentClick(post)}
              className="group flex items-center gap-1.5 focus:outline-none"
            >
              <div className="p-2 rounded-full bg-transparent text-gray-500 transition-all duration-300 group-hover:bg-emerald-50 group-hover:text-emerald-500">
                  <MessageCircle size={22} className="group-hover:-rotate-6 transition-transform" />
              </div>
              <span className="text-sm font-semibold text-gray-500 group-hover:text-emerald-500 transition-colors">
                {post.comments > 0 ? post.comments : ''}
              </span>
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={() => onToggleSave && onToggleSave(post)}
            className={`p-2 rounded-full transition-all duration-300 focus:outline-none ${
              isSaved 
                ? 'text-emerald-600 bg-emerald-50' 
                : 'text-gray-400 hover:text-emerald-600 hover:bg-gray-50'
            }`}
            title={isSaved ? "Guardado" : "Guardar"}
          >
            <Bookmark size={22} className={`transition-transform duration-300 ${isSaved ? 'fill-current' : 'group-hover:scale-110'}`} />
          </button>

        </div>
      </article>

      {/* Lightbox */}
      {lightboxOpen && (
        <ImageLightbox 
          images={post.images} 
          initialIndex={initialImageIndex} 
          onClose={() => setLightboxOpen(false)} 
        />
      )}
    </>
  );
};

export default FeedCard;