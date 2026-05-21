import { API_URL } from './a-config';

export const enviarMensajeAPI = async (token, receptorId, contenido) => {
  try {
    const response = await fetch(`${API_URL}/chat/enviar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ receptor_id: receptorId, contenido })
    });

    if (!response.ok) {
      throw new Error('Error al enviar mensaje.');
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const obtenerHistorialAPI = async (token, otroUsuarioId) => {
  try {
    const response = await fetch(`${API_URL}/chat/historial/${otroUsuarioId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener mensajes');
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return []; 
  }
};

// --- Obtener Inbox ---
export const obtenerMisMensajesAPI = async (token) => {
  try {
    const response = await fetch(`${API_URL}/chat/mis-mensajes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Error al obtener mensajes');
    return await response.json();
  } catch (error) {
    console.error(error);
    return []; 
  }
};

export const eliminarChatAPI = async (token, otroUsuarioId) => {
  const response = await fetch(`${API_URL}/chat/eliminar/${otroUsuarioId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Error al eliminar chat');
  return await response.json();
};