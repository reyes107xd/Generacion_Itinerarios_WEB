import * as notificationService from '../services/s-notification.js';

// Obtener notificaciones
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id; 

        if (!userId) {
            return res.status(400).json({ message: 'Usuario no encontrado.' });
        }

        const { list, unreadCount } = await notificationService.getNotifications(userId);
        
        res.status(200).json({ list, unreadCount });
    } catch (error) {
        console.error('Error en getNotifications:', error);
        res.status(500).json({ message: 'Error al obtener notificaciones.' });
    }
};

// Marcar como leída
export const markAsRead = async (req, res) => {
    try {
        const { id: notificationId } = req.params;
        const userId = req.user.id;
        
        const notification = await notificationService.markAsRead(notificationId, userId);
        
        if (!notification) {
             return res.status(404).json({ message: 'Notificación no encontrada.' });
        }
        res.status(200).json({ message: 'Notificación leída con éxito.', notification });
    } catch (error) {
        console.error('Error en markAsRead:', error);
        res.status(500).json({ message: 'Error al marcar como leída.' });
    }
};

// Eliminar todas las notificaciones
export const deleteAll = async (req, res) => {
    try {
        const userId = req.user.id;
        
        await notificationService.deleteAllNotifications(userId);
    
        res.status(200).json({ message: 'Notificaciones eliminadas con éxito.' });
    } catch (error) {
        console.error('Error en deleteAll:', error);
        res.status(500).json({ message: 'Error al eliminar notificaciones.' });
    }
};