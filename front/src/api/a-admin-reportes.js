import { API_URL as BASE_API } from './a-config';

const API_URL = `${BASE_API}/admin/reportes`;

export const obtenerReportes = async (token, pagina = 1, limite = 10, filtros = '') => {
  let url = `${API_URL}?pagina=${pagina}&limite=${limite}`;
  
  // Agregar filtros si existen
  if (filtros) {
    url += `&${filtros}`;
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
    const mensajeReal = data.error || data.message || 'Error al obtener reportes';
    throw new Error(mensajeReal);
  }
  
  return response.json();
};

/**
 * Obtener un reporte específico por ID (solo administradores)
 */
export const obtenerReportePorId = async (id, token) => {
  if (!id) {
    throw new Error('ID del reporte no proporcionado');
  }

  const response = await fetch(`${API_URL}/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensaje = data.error || data.message || 'Error al obtener  reporte';
    throw new Error(mensaje);
  }

  return response.json();
};

/**
 * Actualizar el estatus de un reporte (solo administradores)
 */
export const actualizarEstatusReporte = async (id, estatus, token) => {
  if (!id) {
    throw new Error('ID del reporte no proporcionado');
  }

  const response = await fetch(`${API_URL}/${id}/estatus`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ estatus }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensaje = data.error || data.message || 'Error al actualizar el estatus del reporte';
    throw new Error(mensaje);
  }

  return response.json();
};

/**
 * Eliminar un reporte (solo administradores)
 */
export const eliminarReporte = async (idReporte, token) => {
  if (!idReporte) {
    throw new Error('ID del reporte no proporcionado');
  }

  const response = await fetch(`${API_URL}/${idReporte}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let errorMessage = 'Error al eliminar reporte';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = `${response.status} - ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
};

/**
 * Obtener reportes del usuario actual
 */
export const obtenerMisReportes = async (token, pagina = 1, limite = 10) => {
  const response = await fetch(`${API_URL}/mis-reportes?pagina=${pagina}&limite=${limite}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensaje = data.error || data.message || 'Error al obtener mis reportes';
    throw new Error(mensaje);
  }

  return response.json();
};