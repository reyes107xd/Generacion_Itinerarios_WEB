import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './authContext';
import { obtenerNotificacionesAPI, marcarLeidaAPI } from '../api/notificaciones'; 
// Eliminamos showAlert para mensajes de chat, se mantiene para otras si luego se desea.

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket();
  const { token, user } = useAuth();
  
  const [notifications, setNotifications] = useState([]); // Forma normalizada
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. CARGA INICIAL DEL HISTORIAL (Base de Datos)
  useEffect(() => {
    const fetchHistory = async () => {
      if (token && user) {
        const data = await obtenerNotificacionesAPI(token);
        if (data && data.list) {
          const normalized = data.list.map(n => ({
            id: n.id_notificacion,
            type: n.tipo,
            title: n.titulo,
            content: n.mensaje || n.titulo,
            time: n.fecha_creacion,
            read: !!n.leida,
            link: n.enlace || null
          }));
          setNotifications(normalized);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    };
    fetchHistory();
  }, [token, user]);

  // 2. ESCUCHAR EVENTOS EN VIVO (Sockets)
  useEffect(() => {
    if (!socket) return;

    // A) Notificación guardada en BD (Likes, Sistema, etc.) viene normalizada desde backend
    const handleDbNotification = (newNotif) => {
      const normalized = {
        id: newNotif.id_notificacion || newNotif.id,
        type: newNotif.tipo || newNotif.type,
        title: newNotif.titulo || newNotif.title,
        content: newNotif.mensaje || newNotif.content || newNotif.titulo,
        time: newNotif.fecha_creacion || new Date().toISOString(),
        read: !!newNotif.leida,
        link: newNotif.enlace || null
      };
      setNotifications(prev => [normalized, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // B) Eventos específicos (Chat, Amistad) que quizás no se guardan en la tabla 'notificacion'
    // pero quieres mostrar en la UI
    const handleFriendRequest = (request) => {
      const notifVisual = {
        id: `temp-${Date.now()}`,
        type: 'friend_request',
        title: 'Nueva Solicitud',
        content: `${request.name} quiere ser tu amigo.`,
        time: new Date().toISOString(),
        read: false,
        link: null
      };
      setNotifications(prev => [notifVisual, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    const handleNewMessage = (msg) => {
      // Evitar notificación si es eco del emisor o si yo envié el mensaje
      const currentId = user?.id || user?.id_usuario;
      if (String(msg.senderId) === String(currentId)) return;

      // Evitar notificaciones duplicadas del mismo remitente
      const hasRecentNotif = notifications.some(n => 
        n.type === 'message' && 
        n.link === `/mensajes/${msg.senderId}` && 
        !n.read &&
        (new Date().getTime() - new Date(n.time).getTime()) < 60000 // Dentro del último minuto
      );
      
      if (hasRecentNotif) return;

      // Crear notificación silenciosa de mensaje con nombre del remitente
      const senderName = msg.senderName || 'Alguien';
      const notifVisual = {
        id: `msg-${msg.senderId}-${Date.now()}`,
        type: 'message',
        title: `Mensaje de ${senderName}`,
        content: msg.text || 'Nuevo mensaje',
        time: msg.timestamp || new Date().toISOString(),
        read: false,
        link: `/mensajes/${msg.senderId}`,
        senderId: msg.senderId // Guardar el ID del remitente
      };
      setNotifications(prev => [notifVisual, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Suscripciones
    socket.on('new_notification', handleDbNotification);
    socket.on('new_friend_request', handleFriendRequest);
    socket.on('receive_message', handleNewMessage);

    return () => {
      socket.off('new_notification', handleDbNotification);
      socket.off('new_friend_request', handleFriendRequest);
      socket.off('receive_message', handleNewMessage);
    };
  }, [socket, user]);

  // 3. FUNCIONES AUXILIARES
  const markOneAsRead = async (id) => {
    // Solo actualizar si es una notificación persistente
    if (!String(id).startsWith('temp-') && !String(id).startsWith('msg-')) {
      try { 
        const success = await marcarLeidaAPI(token, id);
        if (success) {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('Error marcando notificación como leída:', error);
      }
    } else {
      // Para notificaciones temporales, solo actualizar estado local
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    // Actualizar estado local inmediatamente para mejor UX
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    
    // Actualizar en backend solo las notificaciones persistentes
    const persistentNotifications = notifications.filter(
      n => !String(n.id).startsWith('temp-') && !String(n.id).startsWith('msg-')
    );
    
    // Llamar al API para cada notificación persistente
    try {
      await Promise.all(
        persistentNotifications.map(n => marcarLeidaAPI(token, n.id))
      );
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
    }
  };

  const clearNotifications = async () => {
    // Importar la función API
    const { eliminarTodasNotificacionesAPI } = await import('../api/notificaciones');
    
    try {
      const success = await eliminarTodasNotificacionesAPI(token);
      if (success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error al eliminar notificaciones:', error);
    }
  };

  // Función para marcar mensajes de un usuario como leídos cuando se abre el chat
  const markMessagesAsReadFromUser = (userId) => {
    setNotifications(prev => prev.map(n => 
      n.type === 'message' && n.senderId === userId 
        ? { ...n, read: true } 
        : n
    ));
    // Recalcular unreadCount
    setUnreadCount(prev => {
      const messagesToMark = notifications.filter(n => 
        n.type === 'message' && n.senderId === userId && !n.read
      ).length;
      return Math.max(0, prev - messagesToMark);
    });
  };

  // Conteo específico de mensajes no leídos
  const messageUnreadCount = useMemo(() => notifications.filter(n => !n.read && n.type === 'message').length, [notifications]);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        messageUnreadCount,
        markOneAsRead,
        markAllAsRead,
        markMessagesAsReadFromUser,
        clearNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};