import { createNotificationDB, getNotificationsByTuristaIdDB, markAsReadDB, deleteAllNotificationsDB } from '../models/m-notification.js';

let ioInstance = null; 

// 1. Inicializar Socket.IO 
export const setIo = (io) => {
    ioInstance = io;
    console.log('Socket.io instance set in s-notification');
};

// 2. Función GENÉRICA para enviar cualquier evento por socket (usada por s-amistad, s-chat, etc.)
export const sendSocketNotification = (userId, event, data) => {
    if (ioInstance) {
        // El socket debe haberse unido a una sala con el ID del usuario en server.js
        ioInstance.to(userId.toString()).emit(event, data);
        console.log(`Socket enviado a usuario ${userId} | Evento: ${event}`);
    } else {
        console.warn(`Socket.io no inicializado. No se pudo enviar evento: ${event}`);
    }
};

// 3. Crear Notificación en BD y avisar por Socket (Para Likes, Comentarios, Sistema)
export const createNotification = async (id_turista, data) => {
    try {
        // A) Guardar en Base de Datos
        const newNotification = await createNotificationDB({ id_turista, ...data });
        
        // B) Disparar el POP-UP en tiempo real usando la función genérica
        // El frontend escucha 'new_notification' para las alertas generales
        sendSocketNotification(id_turista, 'new_notification', newNotification);
        
        return newNotification;
    } catch (error) {
        console.error("Error creando notificación:", error);
        throw error;
    }
};

// 4. Obtener listado de notificaciones
export const getNotifications = async (id_turista) => {
    return await getNotificationsByTuristaIdDB(id_turista);
};

// 5. Marcar como Leída 
export const markAsRead = async (id_notificacion, id_turista) => {
    return await markAsReadDB(id_notificacion, id_turista);
};

// 6. Eliminar todas las notificaciones de un usuario
export const deleteAllNotifications = async (id_turista) => {
    return await deleteAllNotificationsDB(id_turista);
};