import { API_URL as BASE_API } from './a-config';

const API_URL = `${BASE_API}/admin`;

/**
 * Obtener notificaciones de admin
 */
export const obtenerNotificacionesAdmin = async (token, pagina = 1, limite = 10, filtros = {}) => {
  try {
    // Construir query params
    const queryParams = new URLSearchParams({
      pagina: pagina.toString(),
      limite: limite.toString(),
      ...filtros
    });
    // Filtrar parámetros vacíos
    Array.from(queryParams.entries()).forEach(([key, value]) => {
      if (value === 'todos' || value === '' || value === null || value === undefined) {
        queryParams.delete(key);
      }
    });

    const response = await fetch(`${API_URL}/notificaciones?${queryParams}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const mensajeReal = data.error ||
      data.message || 'Error al obtener notificaciones';
      throw new Error(mensajeReal);
    }
    
    return response.json();
  } catch (error) {
    console.error("Error en obtenerNotificacionesAdmin:", error);
    throw error;
  }
};

/**
 * Marcar notificación como leída
 */
export const marcarNotificacionComoLeida = async (idNotificacion, token) => {
  try {
    const response = await fetch(`${API_URL}/notificaciones/${idNotificacion}/marcar-leida`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const mensajeReal = data.error ||
      data.message || 'Error al marcar notificación como leída';
      throw new Error(mensajeReal);
    }
    
    return response.json();
  } catch (error) {
    console.error("Error en marcarNotificacionComoLeida:", error);
    throw error;
  }
};

/**
 * Eliminar notificación
 */
export const eliminarNotificacion = async (idNotificacion, token) => {
  try {
    const response = await fetch(`${API_URL}/notificaciones/${idNotificacion}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const mensajeReal = data.error ||
      data.message || 'Error al eliminar notificación';
      throw new Error(mensajeReal);
    }
    
    return response.json();
  } catch (error) {
    console.error("Error en eliminarNotificacion:", error);
    throw error;
  }
};