import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/authContext';
import { enviarMensajeAPI, obtenerHistorialAPI } from '../../api/chat';

const ChatModal = ({ user: chatPartner, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false); 
  
  const { socket } = useSocket();
  const { user, token } = useAuth();
  const messagesEndRef = useRef(null);

  // Aseguramos obtener el ID correctamente, sea id o id_usuario
  const currentUserId = user?.id || user?.id_usuario;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. CARGAR HISTORIAL AL ABRIR
  useEffect(() => {
    if (!chatPartner?.id || !token || !currentUserId) return;

    setLoading(true);
    obtenerHistorialAPI(token, chatPartner.id)
      .then(data => {
        const formatted = data.map(m => ({
          id: m.id_mensaje,
          text: m.contenido,
          sender: String(m.id_emisor) === String(currentUserId) ? 'me' : 'other', 
          timestamp: m.fecha_envio
        }));
        setMessages(formatted);
        setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
      })
      .catch(err => console.error("Error al obtener chat:", err))
      .finally(() => setLoading(false)); 
  }, [chatPartner, token, currentUserId]);

  // 2. SOCKET: RECIBIR MENSAJES EN TIEMPO REAL (incluyendo eco para emisor)
  useEffect(() => {
    if (!socket || !currentUserId) return;

    // --- PARCHE DE SEGURIDAD ---
    // Forzamos el registro en la sala al abrir el chat para asegurar que recibimos eventos.
    // Esto soluciona el problema si el SocketContext falló al registrar el ID.
    console.log("🔌 ChatModal: Forzando registro de socket para usuario:", currentUserId);
    socket.emit('register_turista', currentUserId);
    // ---------------------------

    const handleReceiveMessage = (incomingMsg) => {
      console.log("📩 Socket msg recibido:", incomingMsg);
      
      const incomingSenderId = String(incomingMsg.senderId);
      const incomingReceiverId = String(incomingMsg.receiverId);
      const partnerId = String(chatPartner.id);
      const myId = String(currentUserId);

      // Verificamos si el mensaje es parte de ESTE chat (bidireccional)
      // Caso 1: Mensaje que YO envié (echo: true) hacia el partner
      // Caso 2: Mensaje que el partner me envió
      const esDelChat = 
        (incomingSenderId === myId && incomingReceiverId === partnerId) ||
        (incomingSenderId === partnerId && incomingReceiverId === myId);

      if (!esDelChat) {
        console.log("Mensaje ignorado (no es de este chat)");
        return;
      }

      console.log("Mensaje verificado. Actualizando chat...");
      
      setMessages(prev => {
        // Evitar duplicados
        if (prev.some(m => m.id === incomingMsg.id)) {
          console.log("⚠️ Mensaje duplicado, ignorando");
          return prev;
        }

        // Determinar quién es el emisor
        const sender = incomingSenderId === myId ? 'me' : 'other';

        // Si es un echo (mi propio mensaje confirmado), reemplazar el optimista
        if (incomingMsg.echo && sender === 'me') {
          console.log("🔄 Reemplazando mensaje optimista con ID real:", incomingMsg.id);
          // Buscar el mensaje optimista (sin idReal o con timestamp cercano)
          const indexOptimista = prev.findIndex(m => 
            m.sender === 'me' && 
            m.text === incomingMsg.text && 
            (!m.idReal || Math.abs(new Date(m.timestamp) - new Date(incomingMsg.timestamp)) < 5000)
          );
          
          if (indexOptimista !== -1) {
            // Reemplazar el optimista con el real
            const updated = [...prev];
            updated[indexOptimista] = {
              id: incomingMsg.id,
              text: incomingMsg.text,
              sender: 'me',
              timestamp: incomingMsg.timestamp,
              idReal: true
            };
            return updated;
          }
        }

        return [
          ...prev, 
          {
            id: incomingMsg.id || Date.now(),
            text: incomingMsg.text,
            sender,
            timestamp: incomingMsg.timestamp || new Date(),
            idReal: true
          }
        ];
      });
      
      setTimeout(scrollToBottom, 100);
    };

    socket.on('receive_message', handleReceiveMessage);
    
    return () => socket.off('receive_message', handleReceiveMessage);
  }, [socket, chatPartner, currentUserId]); // Agregamos currentUserId a dependencias

  // 3. ENVIAR MENSAJE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const textToSend = newMessage;
    setNewMessage(''); 

    // Optimismo: Agregamos mensaje localmente (se reemplazará con el echo del servidor)
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      text: textToSend, 
      sender: 'me', 
      timestamp: new Date(),
      idReal: false  // Marca para identificar mensajes optimistas
    }]);
    setTimeout(scrollToBottom, 50);

    try {
      await enviarMensajeAPI(token, chatPartner.id, textToSend);
    } catch (error) {
      console.error("Error enviando mensaje", error);
    }
  };

  if (!chatPartner) return null;
  const modalContent =(

    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[80vh] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white z-10 shadow-sm">
          <img 
            src={chatPartner.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
            onError={(e) => {e.target.onerror=null; e.target.src='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}}
            alt={chatPartner.name} 
            className="w-11 h-11 rounded-full object-cover border border-gray-200" 
          />
          <div>
            <h3 className="font-bold text-gray-900 leading-tight text-lg">
                {chatPartner.nombre || chatPartner.name || 'Usuario'}
            </h3>
          </div>
          <button onClick={onClose} className="ml-auto p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Cuerpo del Chat */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50 scrollbar-hide">
            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

            {loading ? (
                <div className="flex justify-center mt-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
            ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 animate-fade-in-up">
                    <p className="text-gray-900 font-medium">¡Saluda!</p>
                    <p className="text-sm mt-1">Inicia la conversación con <br/><b>{chatPartner.nombre || chatPartner.name}</b></p>
                </div>
            ) : (
                <div className="space-y-3">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`px-4 py-2.5 max-w-[75%] text-sm shadow-sm break-words ${
                                msg.sender === 'me' 
                                ? 'bg-emerald-600 text-white rounded-2xl rounded-br-none' 
                                : 'bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 z-10">
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 py-3 px-5 bg-gray-50 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
              autoFocus
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-emerald-200 active:scale-95"
            >
              <Send size={20} />
            </button>
        </form>
      </div>
    </div>
  );
  return createPortal(modalContent, document.body);
};

export default ChatModal;