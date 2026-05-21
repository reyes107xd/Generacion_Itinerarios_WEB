import { useState, useEffect } from 'react';
import { Check, X, User } from 'lucide-react';
import { useAlert } from '../../context/alertContext';
import { useSocket } from '../../context/SocketContext'; 
import { useAuth } from '../../context/authContext';
import ProfileModal from '../../components/common/ProfileModal';
import { obtenerSolicitudesPendientesAPI, responderSolicitudAPI } from '../../api/friends';

const SolicitudesGrid = () => {
  const [requests, setRequests] = useState([]);
  const { showAlert } = useAlert();
  const { socket } = useSocket();
  const { token } = useAuth();

  // ESTADO PARA EL MODAL
  const [selectedUser, setSelectedUser] = useState(null);

  // CARGA INICIAL
  useEffect(() => {
    const fetchRequests = async () => {
        try {
            const data = await obtenerSolicitudesPendientesAPI(token);
            setRequests(data);
        } catch (error) {
            console.error("Error al obtener solicitudes", error);
        }
    };
    if(token) fetchRequests();
  }, [token]);

  // SOCKETS
  useEffect(() => {
    if (!socket) return;
    const handleNewRequest = (newRequest) => {
      setRequests(prev => {
        if (prev.some(req => req.id === newRequest.id)) return prev;
        return [newRequest, ...prev];
      });
      showAlert('success', 'Nueva Solicitud', `${newRequest.name} quiere conectar contigo.`);
    };
    socket.on('new_friend_request', handleNewRequest);
    return () => socket.off('new_friend_request', handleNewRequest);
  }, [socket, showAlert]);

  // RESPONDER
  const handleRequest = async (e, idSolicitud, senderId, action) => {
    e.stopPropagation(); 
    try {
        await responderSolicitudAPI(token, idSolicitud, action);

        setRequests(prev => prev.filter(req => req.id !== senderId && req.id_solicitud !== idSolicitud));

        if (action === 'accept') {
            showAlert('success', '¡Solicitud aceptada con éxito!', 'Ahora son amigos.', 2000);
            if (socket) socket.emit('friend_request_response', { to: senderId, status: 'accepted' });
        } else {
            showAlert('success', '¡Solicitud rechazada con éxito!', 'Se ha eliminado la solicitud.', 2000);
        }

    } catch (error) {
        console.error(error);
        showAlert('error', 'Error al enviar solicitud.', 'Ya existe una solicitud pendiente o ocurrió un error. Inténtelo de nuevo más tarde.');
    }
  };

  // ABRIR MODAL
  const handleViewProfile = (req) => {
    setSelectedUser({
        id: req.id,
        nombre: req.name || req.nombre,
        nombre_usuario: req.handle || req.nombre_usuario,
        foto: req.avatar || req.foto
    });
  };

  if (requests.length === 0) {
    return (
        <div className="col-span-full py-10 text-center text-gray-500 ">
            <p>No tiene solicitudes pendientes.</p>
        </div>
    );
  }

  return (
      <>
        {/* Usamos el mismo grid gap y padding que en MisAmigosGrid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6 space-y-4 max-h-[58vh] overflow-y-auto pr-2 custom-scroll relative">
            {requests.map((req) => (
                <article 
                    key={req.id || req.id_solicitud} 
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group relative overflow-hidden"
                >
                    {/* Barra decorativa superior (Igual que MisAmigosGrid) */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

                    {/* Avatar (Clickable) */}
                    <div 
                        className="relative mb-4 cursor-pointer" 
                        onClick={() => handleViewProfile(req)}
                    >
                        <img 
                            src={req.avatar || req.foto || 'https://i.pravatar.cc/150?img=12'} 
                            onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = 'https://i.pravatar.cc/150?img=12'; 
                            }}
                            alt={req.name} 
                            className="w-20 h-20 rounded-full object-cover border-4 border-emerald-50 group-hover:border-emerald-100 transition-colors shadow-sm"
                        />
                    </div>

                    {/* Info (Clickable) - AQUI ESTÁ EL CAMBIO PARA VISUALIZAR COMPLETO */}
                    <div 
                        className="mb-6 w-full cursor-pointer px-2"
                        onClick={() => handleViewProfile(req)}
                    >
                        {/* Nombre: Permite salto de línea (leading-tight) */}
                        <h3 className="font-bold text-gray-900 text-lg mb-2 leading-tight break-words">
                            {req.name || req.nombre}
                        </h3>
                        
                        {/* Usuario: Break-all para cortar strings largos sin espacios */}
                        <div className="flex justify-center">
                            <p className="text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-1 rounded-full break-all">
                                @{req.handle || req.nombre_usuario}
                            </p>
                        </div>
                    </div>
                    
                    {/* BOTONES (Estilo idéntico a MisAmigosGrid) */}
                    <div className="flex w-full gap-3 mt-auto">
                        
                        {/* Botón Aceptar (Estilo verde como el de Mensaje) */}
                        <button 
                            onClick={(e) => handleRequest(e, req.id_solicitud, req.id, 'accept')} 
                            title="Aceptar solicitud"
                            className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-green-200 text-emerald-700 rounded-lg font-medium text-sm hover:bg-green-300 transition-colors"
                        >
                            <Check size={20} strokeWidth={2.5} />
                        </button>
                        <button 
                            onClick={(e) => handleRequest(e, req.id_solicitud, req.id, 'reject')} 
                            title="Rechazar solicitud"
                            className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-gray-50 text-gray-500 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-200 hover:text-gray-500 hover:border-gray-200 transition"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>

                    </div>
                </article>
            ))}
        </div>

        {/* MODAL */}
        {selectedUser && (
            <ProfileModal 
                user={selectedUser} 
                onClose={() => setSelectedUser(null)} 
            />
        )}
      </>
  );
};

export default SolicitudesGrid;