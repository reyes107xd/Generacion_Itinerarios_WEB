// src/api/a-guardado.js
import { API_URL } from './a-config';

// 1. GUARDAR O QUITAR (Soporta Publicaciones e Itinerarios)
export const toggleGuardadoAPI = async (token, idObjeto, accion, tipo = 'publicacion') => {
  const response = await fetch(`${API_URL}/guardados`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    // Enviamos la estructura que espera el nuevo controlador
    body: JSON.stringify({ 
        id_objeto: idObjeto, 
        tipo: tipo, 
        accion: accion 
    })
  });

  if (!response.ok) {
      throw new Error('Error al actualizar guardado');
  }
  
  return response.json();
};

export const obtenerIdsGuardadosAPI = async (token) => {
  const response = await fetch(`${API_URL}/guardados/ids`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) return []; 
  return response.json();
};

export const obtenerColeccionGuardadosAPI = async (token) => {
  const response = await fetch(`${API_URL}/guardados/coleccion`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Error al obtener colección');
  return response.json();
};