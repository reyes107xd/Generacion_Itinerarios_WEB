import { API_URL } from './a-config';

export const buscarUsuariosAPI = async (token, query) => {
  try {
    const response = await fetch(`${API_URL}/amistad/usuarios/buscar?q=${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Error al buscar usuarios');
    return await response.json();
  } catch (error) {
    console.error(error);
    return []; 
  }
};


export const cancelarSolicitudAmistadAPI = async(token,targetUserId) => {
  const response = await fetch (`${API_URL}/amistad/cancelar/${targetUserId}`, {
    method: 'DELETE', 
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
     }
    });
    if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.message || 'Error al cancelar solicitud de amistad.');
      }
      return await response.json();
};

export const enviarSolicitudAmistadAPI = async (token, targetUserId) => {
  const response = await fetch(`${API_URL}/amistad/solicitar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ destinatario_id: targetUserId })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al enviar solicitud');
  }
  return await response.json();
};



export const obtenerSolicitudesPendientesAPI = async (token) => {
  const response = await fetch(`${API_URL}/amistad/pendientes`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Error al obtener solicitudes');
  return await response.json();
};


export const responderSolicitudAPI = async (token, idSolicitud, accion) => {

  const response = await fetch(`${API_URL}/amistad/responder`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ 
      id_solicitud: idSolicitud, 
      estado: accion 
    })
  });

  if (!response.ok) throw new Error('Error al responder solicitud');
  return await response.json();
};

//obtener mis amigos
export const obtenerAmigosAPI = async (token) => {
  try {
    const response = await fetch(`${API_URL}/amistad/amigos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Error al obtener amigos');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return []; 
  }
};

//eliminar amigos
export const eliminarAmigoAPI = async (token, idAmigo) => {
  const response = await fetch(`${API_URL}/amistad/eliminar/${idAmigo}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Error al eliminar amigo');
  return await response.json();
};

export const obtenerConteoAmigosAPI = async (token, idUsuario) => {
  try {
    const response = await fetch(`${API_URL}/amistad/conteo/${idUsuario}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return 0;
    
    const data = await response.json();
    return data.cantidad; // Devuelve el número
  } catch (error) {
    console.error("Error contando amigos:", error);
    return 0;
  }
};

export const verificarAmistadAPI = async (token, idUsuario2) => {
  try {
    const response = await fetch(`${API_URL}/amistad/verificar/${idUsuario2}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al verificar amistad');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en verificarAmistadAPI:', error);
    return { 
      sonAmigos: false, 
      solicitudPendiente: false, 
      estado: 'none' 
    };
  }
};