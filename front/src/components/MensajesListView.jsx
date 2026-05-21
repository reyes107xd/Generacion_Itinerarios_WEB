import { useState, useRef, useEffect } from 'react';
import {Trash2, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/authContext';

const getConversations = (messages, myId) => {
  const conversations = new Map();
  if (!Array.isArray(messages)) return [];

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.fecha_envio) - new Date(b.fecha_envio)
  );

  for (const msg of sortedMessages) {
    const amISender = String(msg.id_emisor) === String(myId);
    const otherUserId = amISender ? msg.id_receptor : msg.id_emisor;
    const rawUserData = amISender ? msg.receptor : msg.emisor; 

    let profile = rawUserData?.perfil_usuario;
    if (Array.isArray(profile)) profile = profile[0];
    if (!profile) profile = {};

    const conversationData = {
      user: {
        id: otherUserId,
        name: profile.nombre || 'Usuario', 
        avatar: profile.foto || 'https://i.pravatar.cc/150?img=default',
      },
      lastMessage: msg.contenido, 
      time: msg.fecha_envio 
        ? new Date(msg.fecha_envio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        : '',
      rawDate: new Date(msg.fecha_envio)
    };
    conversations.set(otherUserId, conversationData);
  }
  return Array.from(conversations.values()).sort((a, b) => b.rawDate - a.rawDate);
};

const ConversationItem = ({ convo, onOpenChat, onDeleteChat }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMenuToggle = (e) => {
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div
          /* CAMBIO CRÍTICO: Añadimos z-index condicional para que la fila activa suba de nivel */
          className={`w-full flex items-center p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all group relative cursor-pointer mb-2 ${isMenuOpen ? 'z-50' : 'z-0'}`}
          onClick={() => onOpenChat(convo.user)}
        >
          {/* Avatar y Textos (se mantienen igual) */}
          <div className="relative mr-2 sm:mr-3 flex-shrink-0">
            <img src={convo.user.avatar} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
          </div>
          
          <div className="grow overflow-hidden text-left pr-8">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 truncate text-xs sm:text-sm">{convo.user.name}</h3>
              <span className="text-xs text-gray-400">{convo.time}</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{convo.lastMessage}</p>
          </div>

          {/* --- MENÚ DESPLEGABLE MEJORADO --- */}
          <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2" ref={menuRef}>
            <button 
                onClick={handleMenuToggle}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100" 
            >
                <MoreVertical size={20} />
            </button>
            
            {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] animate-fade-in-down origin-top-right overflow-hidden">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            onDeleteChat(convo.user.id);
                        }}
                        className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-semibold"
                    >
                        <Trash2 size={18} />
                        Eliminar chat
                    </button>
                </div>
            )}
          </div>
        </div>
    );
};


// COMPONENTE PRINCIPAL
const MensajesListView = ({ allMessages = [], onOpenChat, onDeleteChat }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || user?.id_usuario;
  
  const conversations = getConversations(allMessages, currentUserId);

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-gray-400">
        <p className="text-xs sm:text-sm">No tienes mensajes aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 sm:space-y-2 pb-2 sm:pb-4">
      {conversations.map((convo) => (
        <ConversationItem 
            key={convo.user.id}
            convo={convo}
            onOpenChat={onOpenChat}
            onDeleteChat={onDeleteChat}
        />
      ))}
    </div>
  );
};

export default MensajesListView;