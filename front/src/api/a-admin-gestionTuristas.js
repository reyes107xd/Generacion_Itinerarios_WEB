import { API_URL as BASE_API } from './a-config';

const API_URL = `${BASE_API}/admin/turistas`;

/**
 * Obtener todos los turistas (solo administradores)
 */
export const obtenerTuristas = async (token, pagina = 1, limite = 10, filtros = {}) => {
  // Construir la URL base con página y límite
  let url = `${API_URL}?pagina=${pagina}&limite=${limite}`;
  
  // Agregar filtros si existen
  const params = new URLSearchParams();
  
  if (filtros.estado && filtros.estado !== 'todos') {
    params.append('estado', filtros.estado);
  }
  
  if (filtros.verificacion && filtros.verificacion !== 'todos') {
    params.append('emailVerificado', filtros.verificacion === 'verificado');
  }
  
  if (filtros.busqueda) {
    params.append('busqueda', filtros.busqueda);
  }
  
  const queryString = params.toString();
  if (queryString) {
    url += `&${queryString}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensajeReal = data.error || data.message || 'Error al obtener turistas';
    throw new Error(mensajeReal);
  }
  
  return response.json();
};

/**
 * Bloquear un turista (solo administradores)
 */
export const bloquearTurista = async (id, duracion, motivo = '', token) => {
  if (!id) {
    throw new Error('ID del turista no proporcionado');
  }

  const response = await fetch(`${API_URL}/${id}/bloquear`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ 
      duracion,
      motivo: motivo || `Usuario bloqueado por el administrador. Duración: ${duracion}`
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensaje = data.error || data.message || 'Error al bloquear el turista';
    throw new Error(mensaje);
  }

  return response.json();
};

/**
 * Desbloquear un turista (solo administradores)
 */
export const desbloquearTurista = async (id, token) => {
  if (!id) {
    throw new Error('ID del turista no proporcionado');
  }

  const response = await fetch(`${API_URL}/${id}/desbloquear`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensaje = data.error || data.message || 'Error al desbloquear turista';
    throw new Error(mensaje);
  }

  return response.json();
};

/**
 * Obtener estadísticas de turistas (solo administradores)
 */
export const obtenerEstadisticasTuristas = async (token) => {
  const response = await fetch(`${API_URL}/estadisticas`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensaje = data.error || data.message || 'Error al obtener estadísticas';
    throw new Error(mensaje);
  }

  return response.json();
};