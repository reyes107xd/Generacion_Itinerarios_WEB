import { useState, useEffect } from 'react';
import { UserPlus, Check, MessageCircle, UserX } from 'lucide-react'; // Importar UserX
import { useAlert } from '../../context/alertContext'; 
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom'; 
// Asegúrate de importar la nueva función
import { buscarUsuariosAPI, enviarSolicitudAmistadAPI, cancelarSolicitudAmistadAPI } from '../../api/friends'; 
import ProfileModal from '../../components/common/ProfileModal';

import { getFullName, generateAvatarUrl } from '../../utils/userHelpers';

const BuscarAmigosView = ({ searchTerm }) => {
  const { token, user } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate(); 

  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [sentRequestsStatus, setSentRequestsStatus] = useState({});

// En BuscarAmigosView.jsx - actualizar el useEffect
useEffect(() => {
  const searchUsers = async () => {
    setLoading(true);
    try {
      const data = await buscarUsuariosAPI(token, searchTerm || "");
      
      const filtered = data.filter(u => u.id !== user.id && u.id !== user.id_usuario);
      
      // ✅ CORREGIR: Transformar la estructura de datos anidada
      const usersWithAvatars = filtered.map(u => {
        console.log('🔍 Usuario crudo de la API:', u);
        
        // Extraer datos de la estructura anidada
        const usuarioNormalizado = {
          id: u.id_usuario,
          nombre: u.perfil_usuario?.nombre || 'Usuario',
          ap_p: u.perfil_usuario?.ap_p || '', 
          nombre_usuario: u.perfil_usuario?.nombre_usuario || 'usuario',
          foto: u.perfil_usuario?.foto || null,
          rol: u.rol,
          // Mantener otros campos que puedan venir
          ...u
        };
        
        console.log('✅ Usuario normalizado:', usuarioNormalizado);
        
        const fullName = getFullName(usuarioNormalizado);
        const avatarUrl = generateAvatarUrl(usuarioNormalizado.foto, fullName);
        
        return {
          ...usuarioNormalizado,
          fullName,
          avatarUrl
        };
      });
      
      setUsers(usersWithAvatars);
    } catch (error) {
      console.error("Error buscando usuarios", error);
    } finally {
      setLoading(false);
    }
  };

  const timeoutId = setTimeout(() => {
    searchUsers();
  }, 500);

  return () => clearTimeout(timeoutId);
}, [searchTerm, token, user]);

  // ENVIAR SOLICITUD
  const handleSendRequest = async (targetUserId) => {
    setSentRequestsStatus(prev => ({ ...prev, [targetUserId]: 'pending' }));
    
    try {
      await enviarSolicitudAmistadAPI(token, targetUserId);
      setSentRequestsStatus(prev => ({ ...prev, [targetUserId]: 'sent' }));
      showAlert('success', '¡Solicitud enviada con éxito!', 'Se ha notificado al usuario.');
      if (modalUser?.id === targetUserId) setModalUser(null);
    } catch (error) {
      console.error(error);
      setSentRequestsStatus(prev => ({ ...prev, [targetUserId]: 'error' }));
      showAlert('error', 'Error al enviar solicitud.', 'Ya existe una solicitud pendiente o ocurrió un error. Inténtelo de nuevo más tarde.');
    }
  };

  // CANCELAR SOLICITUD
  const handleCancelRequest = async (targetUserId) => {
    const previousStatus = sentRequestsStatus[targetUserId] || 'sent';
    setSentRequestsStatus(prev => ({ ...prev, [targetUserId]: 'cancelling' })); 
    
    try {
      await cancelarSolicitudAmistadAPI(token, targetUserId);
      setSentRequestsStatus(prev => ({ ...prev, [targetUserId]: 'none' }));
      showAlert('success', '¡Solicitud cancelada con éxito!', 'La solicitud de amistad ha sido cancelada.');
      if (modalUser?.id === targetUserId) setModalUser(null);
    } catch (error) {
      console.error(error);
      setSentRequestsStatus(prev => ({ ...prev, [targetUserId]: previousStatus }));
      showAlert('error', 'Error al cancelar solicitud', 'No se pudo cancelar la solicitud. Inténtelo de nuevo más tarde.');
    }
  };


  // IR A CHAT
  const handleMessage = (targetUser) => {
      navigate(`/mensajes/${targetUser.id}`);
  };

  return (
    <>
      {/* Scroll con max-h-[50vh] */}
      <section className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scroll relative">
        {loading && <div className="text-center text-gray-400 py-4">Buscando...</div>}
        
        {!loading && users.length === 0 && (
             <div className="text-center text-gray-400 py-4">No se encontraron usuarios.</div>
        )}

        {users.map((u) => {
          const requestStatus = sentRequestsStatus[u.id] || u.estado_amistad || 'none'; 
          const isFriend = requestStatus === 'friends' || requestStatus === 'accepted';
          const isRequestSent = requestStatus === 'sent' || requestStatus === 'pending';
          const isCancelling = requestStatus === 'cancelling';


          return (
            <article key={u.id} className="bg-white rounded-lg p-3 border border-gray-100 flex flex-row items-center hover:shadow-sm transition">
              <div className="flex-shrink-0">
                {/* ✅ Usar avatarUrl generado localmente */}
                <img 
                  src={u.avatarUrl} 
                  onError={(e) => {
                    e.target.onerror = null;
                    // Fallback local si falla
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'Usuario')}&background=1D7743&color=fff`;
                  }}
                  alt={u.fullName} 
                  className="w-12 h-12 rounded-full object-cover cursor-pointer border border-gray-100" 
                  onClick={() => setModalUser(u)} 
                />
              </div>
              
              <div className="grow ml-4 min-w-0">
                <h3 onClick={() => setModalUser(u)} className="font-semibold text-lg text-gray-900 cursor-pointer hover:text-emerald-600 truncate">
                  {u.fullName}
                </h3>
                <p className="text-sm text-gray-500 truncate">@{u.nombre_usuario}</p>
              </div>
            
             <div className="flex gap-2 ml-auto flex-shrink-0">
                {isFriend ? (
                    <button onClick={() => handleMessage(u)} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-full transition" title="Mensaje">
                        <MessageCircle size={20} />
                    </button>
                ) : (
                    <>
                        {isRequestSent ? (
                          // 💡 MODIFICACIÓN: Mostrar solo el botón de Cancelar (o un botón grande de Cancelar)
                          // Si es una solicitud enviada, damos la opción de Cancelar.
                          <button 
                              onClick={() => handleCancelRequest(u.id)} 
                              disabled={isCancelling}
                              // Damos un estilo de botón primario para indicar la acción
                              className={`flex items-center gap-1 text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-3 py-2 rounded-full font-medium transition ${isCancelling ? 'opacity-50 cursor-not-allowed' : ''}`} 
                              title="Cancelar solicitud"
                          >
                            {isCancelling ? (
                              'Cancelando...' 
                            ) : (
                              <>
                                <UserX size={16} /> <span className="hidden sm:inline">Cancelar</span>
                              </>
                            )}
                          </button>
                          
                        ) : (
                          // BOTÓN ENVIAR SOLICITUD (estado: none)
                          <button onClick={() => handleSendRequest(u.id)} className="text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-full transition" title="Añadir">
                            <UserPlus size={20} strokeWidth={2.5} />
                          </button>
                        )}
                    </>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {modalUser && (
          <ProfileModal
            user={modalUser}
            onClose={() => setModalUser(null)}
            onSendRequest={handleSendRequest}
            isRequestAlreadySent={['sent', 'pending', 'friends', 'accepted', 'cancelling'].includes(sentRequestsStatus[modalUser.id] || modalUser.estado_amistad)}
          />
      )}
    </>
  );
};

export default BuscarAmigosView;