// s-a-notificaciones.js

import { DatabaseError } from "../utils/u-errores-dominio.js";
import { Notificacion } from "../models/m-a-notificaciones.js";

/**
 * Obtener notificaciones de admin con filtros y paginación
 */
export const obtenerNotificacionesAdminS = async (pagina = 1, limite = 10, filtros = {}) => {
  try {
    const resultado = await Notificacion.obtenerNotificacionesAdminM(
      pagina,
      limite,
      filtros
    );

    return resultado;

  } catch (error) {
    console.error('Error en obtenerNotificacionesAdminS:', error);
    throw new DatabaseError('Error al obtener notificaciones');
  }
};

/**
 * Marcar notificación como leída
 */
export const marcarNotificacionComoLeidaS = async (idNotificacion) => {
  try {
    // Verificar que la notificación existe y es para admin
    const notificacion = await Notificacion.buscarPorIdM(idNotificacion);
    
    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }

    if (!notificacion.para_admin) {
      throw new Error('No autorizado para modificar esta notificación');
    }

    // Marcar como leída
    const notificacionActualizada = await Notificacion.marcarComoLeidaM(idNotificacion);
    
    return notificacionActualizada;

  } catch (error) {
    console.error('Error en marcarNotificacionComoLeidaS:', error);
    
    if (error.message.includes('No autorizado') || error.message.includes('no encontrada')) {
      throw error;
    }
    
    throw new DatabaseError('Error al marcar notificación como leída');
  }
};

/**
 * Eliminar notificación
 */
export const eliminarNotificacionS = async (idNotificacion) => {
  try {
    // Verificar que la notificación existe y es para admin
    const notificacion = await Notificacion.buscarPorIdM(idNotificacion);
    
    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }

    if (!notificacion.para_admin) {
      throw new Error('No autorizado para eliminar esta notificación');
    }

    // Eliminar notificación
    await Notificacion.eliminarM(idNotificacion);
    
    return { success: true };

  } catch (error) {
    console.error('Error en eliminarNotificacionS:', error);
    
    if (error.message.includes('No autorizado') || error.message.includes('no encontrada')) {
      throw error;
    }
    
    throw new DatabaseError('Error al eliminar notificación');
  }
};