import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Users } from 'lucide-react';
import MensajesListView from '../../components/MensajesListView';
import MisAmigos from '../../components/perfil/MisAmigos'; 
import ChatModal from '../../components/common/ChatModal';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/authContext';
import { useNotifications } from '../../context/NotificationContext';
import { obtenerMisMensajesAPI, eliminarChatAPI } from '../../api/chat'; 
import { getPublicUserAPI } from '../../api/a-user';
import { useAlert } from '../../context/alertContext'; 

const Mensajes = () => {
  const { id: userIdFromUrl } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket(); 
  const { token } = useAuth();
  const { showAlert } = useAlert();
  const { markMessagesAsReadFromUser } = useNotifications();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chattingWithUser, setChattingWithUser] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('mensajes'); // 'mensajes' o 'amigos'

  const fetchInbox = async () => {
      if(token) {
          const data = await obtenerMisMensajesAPI(token);
          setAllMessages(data);
      }
  };

  useEffect(() => {
    fetchInbox();
  }, [token]);

  // Manejo de URL para abrir chat directo
  useEffect(() => {
    const openChatFromUrl = async () => {
        if (userIdFromUrl && token) {
             // Evitar recargar si ya es el mismo usuario
             if (chattingWithUser && String(chattingWithUser.id) === String(userIdFromUrl)) {
                 setIsChatOpen(true);
                 return;
             }
             try {
                 const userData = await getPublicUserAPI(userIdFromUrl);
                 const userObj = {
                     id: userData.id || userData.id_usuario,
                     nombre: userData.nombre,
                     avatar: userData.foto || userData.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
                 };
                 setChattingWithUser(userObj);
                 setIsChatOpen(true);
             } catch (error) {
                 console.error("Error usuario:", error);
             }
        }
    };
    openChatFromUrl();
  }, [userIdFromUrl, token]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (payload) => {
        console.log("Nuevo mensaje recibido en Inbox:", payload);
        fetchInbox(); // Refresca la lista
    };

    socket.on('receive_message', handleNewMessage);
    
    return () => {
        socket.off('receive_message', handleNewMessage);
    };
  }, [socket, token]);

  const handleOpenChat = (userTarget) => {
    setChattingWithUser(userTarget);
    setIsChatOpen(true);
    // Marcar mensajes de este usuario como leídos
    if (markMessagesAsReadFromUser) {
      markMessagesAsReadFromUser(userTarget.id);
    }
    // Actualizamos URL sin recargar
    window.history.pushState({}, '', `/mensajes/${userTarget.id}`);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setChattingWithUser(null);
    navigate('/mensajes');
    fetchInbox(); // Actualizar inbox al cerrar por si acaso
  };

  const handleDeleteConversation = async (otherUserId) => {
    try {
        await eliminarChatAPI(token, otherUserId);
        showAlert('success', '¡Chat eliminado con éxito!', 'La conversación ha sido eliminada.');
        fetchInbox(); 
    } catch (error) {
        showAlert('error', 'Error al eliminar el chat', 'No se pudo eliminar la conversación. Inténtalo de nuevo mas tarde.');
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 h-full">
            
            {/* COLUMNA IZQUIERDA: AMIGOS (4 columnas de 12) - Solo en Desktop */}
            <div className="hidden lg:flex lg:col-span-4 flex-col bg-white rounded-xl lg:rounded-2xl shadow-lg overflow-hidden h-full border border-gray-100">
                <div className="p-3 sm:p-4 lg:p-5 border-b border-gray-100 bg-gray-50/50">
                    {/* Título estandarizado H2 para Sidebar */}
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">Mis Amigos</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-3 custom-scroll">
                    {/* Usamos el modo compacto */}
                    <MisAmigos compactMode={true} />
                </div>
            </div>

            {/* COLUMNA DERECHA: BUZÓN Y AMIGOS CON TABS EN MOBILE (8 columnas de 12) */}
            <div className="col-span-1 lg:col-span-8 bg-white rounded-xl lg:rounded-2xl shadow-lg flex flex-col h-full overflow-hidden border border-gray-100">
                
                {/* TABS PARA MOBILE - Solo visible en móviles */}
                <div className="lg:hidden flex border-b border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setActiveTab('mensajes')}
                    className={`flex-1 py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'mensajes'
                        ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <MessageCircle size={18} />
                    Mensajes
                  </button>
                  <button
                    onClick={() => setActiveTab('amigos')}
                    className={`flex-1 py-3 px-4 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'amigos'
                        ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Users size={18} />
                    Amigos
                  </button>
                </div>

                {/* Título - Solo visible en Desktop */}
                <h1 className="hidden lg:block text-lg sm:text-xl font-bold text-gray-900 p-3 sm:p-4 lg:p-5 border-b border-gray-100 flex-shrink-0 bg-white">
                  Bandeja de Entrada
                </h1>
                
                {/* Contenido de MENSAJES */}
                <div className={`flex-grow overflow-y-auto custom-scroll p-2 sm:p-3 lg:p-4 ${activeTab === 'mensajes' ? 'block' : 'hidden lg:block'}`}>
                  <MensajesListView 
                    allMessages={allMessages}
                    onOpenChat={handleOpenChat}
                    onDeleteChat={handleDeleteConversation} 
                  />
                </div>

                {/* Contenido de AMIGOS - Solo visible en mobile cuando está activo */}
                <div className={`flex-grow overflow-y-auto custom-scroll p-2 sm:p-3 lg:hidden ${activeTab === 'amigos' ? 'block' : 'hidden'}`}>
                  <MisAmigos compactMode={true} />
                </div>
            </div>
        </div>
      </div>

      {isChatOpen && chattingWithUser && (
        <ChatModal
          user={chattingWithUser}
          onClose={handleCloseChat}
        />
      )}
    </>
  );
};

export default Mensajes;