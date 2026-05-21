import { API_URL } from './a-config.js';

// Obtener el Feed
export const obtenerFeedAPI = async (token) => {
  const headers = {};
  
  // Si hay token, lo adjuntamos. Así el Backend sabe quién pide el feed.
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/publicaciones`, {
    method: 'GET',
    headers: headers
  });

  if (!response.ok) throw new Error('Error al cargar el feed');
  return response.json();
};

// Dar/Quitar Like
export const toggleLikeAPI = async (token, idPublicacion, accion) => {
  const response = await fetch(`${API_URL}/reacciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ id_publicacion: idPublicacion, accion })
  });
  
  if (!response.ok) throw new Error('Error al actualizar like');
  return response.json();
};

export const obtenerMisLikesAPI = async (token) => {
  const response = await fetch(`${API_URL}/reacciones/mis-likes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Error fetching likes');
  return response.json();
};

export const crearPublicacionAPI = async (token, datosPublicacion) => {
  const response = await fetch(`${API_URL}/publicaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(datosPublicacion)
  });

  if (!response.ok) {
    // Intentamos leer el mensaje de error del backend
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al crear la publicación');
  }

  return response.json(); // Devuelve la publicación creada
};

export const obtenerMisPublicacionesAPI = async (token) => {
  const response = await fetch(`${API_URL}/publicaciones/mis-publicaciones`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Error al cargar perfil');
  return response.json();
};

// 2. Eliminar post
export const eliminarPublicacionAPI = async (token, idPublicacion) => {
  const response = await fetch(`${API_URL}/publicaciones/${idPublicacion}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Error al eliminar');
  return true;
};

export const obtenerFavoritosAPI = async (token) => {
  const response = await fetch(`${API_URL}/reacciones/listado-completo`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Error al cargar favoritos');
  return response.json();
};

export const obtenerConteoPublicacionesAPI = async (token, idUsuario) => {
  const response = await fetch(`${API_URL}/publicaciones/conteo/${idUsuario}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) return 0;
  const data = await response.json();
  return data.cantidad;
};

export const obtenerUnicaPublicacionAPI = async (token, idPublicacion) => {
  const response = await fetch(`${API_URL}/publicaciones/${idPublicacion}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Error al obtener la publicación creada');
  return response.json();
};