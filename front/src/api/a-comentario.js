import { API_URL } from './a-config'; 

// Obtener comentarios de una publicación
export const obtenerComentariosAPI = async (token, idPublicacion) => {
  const response = await fetch(`${API_URL}/comentarios/${idPublicacion}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Error al cargar comentarios');
  return response.json();
};

// Crear un nuevo comentario
export const crearComentarioAPI = async (token, idPublicacion, contenido) => {
  const response = await fetch(`${API_URL}/comentarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ id_publicacion: idPublicacion, contenido })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al enviar comentario');
  }
  return response.json();
};

// Eliminar comentario
export const eliminarComentarioAPI = async (token, idComentario) => {
  const response = await fetch(`${API_URL}/comentarios/${idComentario}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Error al eliminar comentario');
  return response.json();
};

// Obtener un comentario por ID
export const obtenerComentarioPorIdAPI = async (token, idComentario) => {
  try {
    // CORREGIDO: Usamos la variable importada API_URL (que ya incluye /api)
    // Nota: verifica si la ruta backend es /api/admin/comentarios o /api/comentarios
    const response = await fetch(
      `${API_URL}/admin/comentarios/${idComentario}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Error al obtener comentario');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en obtenerComentarioPorIdAPI:', error);
    throw error;
  }
};