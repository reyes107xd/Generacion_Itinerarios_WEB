import { X, UserPlus, Check, UserCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // <--- IMPORT THIS
import { useAuth } from '../../context/authContext';
import { getFullName, generateAvatarUrl } from '../../utils/userHelpers'; 

// APIs...
import { obtenerConteoPublicacionesAPI } from '../../api/a-publicacion';
import { getPublicUserAPI } from '../../api/a-user';
import { obtenerConteoAmigosAPI, obtenerAmigosAPI } from '../../api/friends';
import { obtenerConteoItinerariosAPI } from '../../api/api-itinerario';

const ProfileModal = ({ user, onClose, onSendRequest, isRequestAlreadySent }) => {
  const { token, user: currentUser } = useAuth();
  
  const [fullProfile, setFullProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFriendConfirmed, setIsFriendConfirmed] = useState(user.isFriend || false);

  useEffect(() => {
    if (user?.id && token) {
      const fetchFullData = async () => {
        setLoading(true);
        try {
          const [userData, countPosts, countFriends, misAmigos, countItineraries] = await Promise.all([
             getPublicUserAPI(user.id),
             obtenerConteoPublicacionesAPI(token, user.id),
             obtenerConteoAmigosAPI(token, user.id),
             obtenerAmigosAPI(token),
             obtenerConteoItinerariosAPI(token, user.id)
          ]);

          console.log('Conteos recibidos:', { countPosts, countFriends, countItineraries });
          console.log('📊 ProfileModal - Datos completos del usuario:', userData);

          setFullProfile({
            ...userData,
            stats: {
              publicaciones: countPosts,
              amigos: countFriends,
              itinerarios: countItineraries || 0
            }
          });

          const sonAmigos = misAmigos.some(amigo => String(amigo.id) === String(user.id));
          setIsFriendConfirmed(sonAmigos);

        } catch (error) {
          console.error("Error cargando perfil:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchFullData();
    }
  }, [user, token]);

  if (!user) return null;

  // FUSIONAMOS DATOS
  const displayUser = fullProfile || user;

  const displayName = getFullName(displayUser);
  const displayAvatar = generateAvatarUrl(displayUser.foto || displayUser.avatar, displayName);
  
  // Debug final
  console.log('🎯 ProfileModal - Resultado final:', {
    displayName,
    displayAvatar,
    datosOriginales: {
      nombre: displayUser.nombre,
      ap_p: displayUser.ap_p,
      name: displayUser.name
    }
  });

  const publicacionesCount = fullProfile?.stats?.publicaciones || 0;
  const amigosCount = fullProfile?.stats?.amigos || 0;
  const isMe = String(currentUser?.id || currentUser?.id_usuario) === String(user.id);
  const itinerariosCount = fullProfile?.stats?.itinerarios || 0;

  // --- CONTENT WRAPPED IN A VARIABLE ---
  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1 bg-white/20 hover:bg-black/10 rounded-full transition text-gray-600 z-10"
        >
          <X size={20} />
        </button>

        <div className="h-32 bg-gradient-to-r from-emerald-400 to-cyan-500"></div>
        
        <div className="px-6 pb-6">
          <div className="relative -mt-12 mb-4 flex justify-between items-end">
            
            {/* AVATAR SEGURO */}
            <img 
              src={displayAvatar} 
              alt={displayName} 
              className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-md bg-white"
            />
            
            {/* BOTÓN DE ACCIÓN */}
            {!isMe && (
              <>
                {isFriendConfirmed ? (
                   <button disabled className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700 border border-green-200 cursor-default">
                     <UserCheck size={16} /> Amigos
                   </button>
                ) : (
                   <button
                     onClick={() => onSendRequest(user.id)}
                     disabled={isRequestAlreadySent}
                     className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${
                       isRequestAlreadySent ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md'
                     }`}
                   >
                     {isRequestAlreadySent ? <Check size={16} /> : <UserPlus size={16} />}
                     {isRequestAlreadySent ? 'Solicitud Enviada' : 'Agregar'}
                   </button>
                )}
              </>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900">{displayName}</h3>
            <p className="text-emerald-600 text-sm font-medium bg-emerald-50 inline-block px-3 py-0.5 rounded-full truncate max-w-full">@{displayUser.nombre_usuario || 'usuario'}</p>
            {displayUser.descripcion && <p className="text-gray-600 mt-2 text-sm leading-relaxed">{displayUser.descripcion}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 text-center">
            <div>
              <span className="block text-xl font-bold text-gray-900">{loading ? '-' : publicacionesCount}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Publicaciones</span>
            </div>
            <div>
              <span className="block text-xl font-bold text-gray-900">{loading ? '-' : amigosCount}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Amigos</span>
            </div>
            <div>
              <span className="block text-xl font-bold text-gray-900">{loading ? '-' : itinerariosCount}</span> 
              <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Itinerarios</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- RETURN PORTAL ---
  return createPortal(modalContent, document.body);
};

export default ProfileModal;