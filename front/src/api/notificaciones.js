import { API_URL } from './a-config';

export const obtenerNotificacionesAPI = async (token) => {
  try {
    const response = await fetch(`${API_URL}/notificaciones`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Error al obtener notificaciones.');
    return await response.json(); 
  } catch (error) {
    console.error(error);
    return { list: [], unreadCount: 0 };
  }
};



export const marcarLeidaAPI = async (token, idNotificacion) => {
  try {
    const response = await fetch(`${API_URL}/notificaciones/${idNotificacion}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const eliminarTodasNotificacionesAPI = async (token) => {
  try {
    const response = await fetch(`${API_URL}/notificaciones/clear`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
};