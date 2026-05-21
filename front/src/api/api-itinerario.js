import { API_URL as BASE_API } from './a-config';
const API_URL = `${BASE_API}/itinerarios`;

// Obtener todos los itinerarios
export const obtenerItinerarios = async () => {
  const response = await fetch(`${API_URL}/listar`, { method: "GET" });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensajeReal = data.error || data.message || 'Error al obtener itinerarios';
    throw new Error(mensajeReal);
  }
  
  return response.json();
};

// Obtener sugerencia optimizada del itinerario
export const obtenerSugerenciaOptimizada = async (itinerario, token) => {
  try {
    // CORREGIDO: Usamos BASE_API para construir la ruta del optimizador
    const response = await fetch(`${BASE_API}/optimizador/optimizar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ itinerario }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const mensajeReal = errorBody.error || errorBody.message || 'Error al obtener sugerencia optimizada';
      throw new Error(mensajeReal);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    throw new Error(error.message || "Error de conexión con el servicio de optimización.");
  }
};

export const obtenerItinerariosUsuario = async (token) => {
  const response = await fetch(`${API_URL}/mis-itinerarios`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensaje = data.error || data.message || 'Error al obtener los itinerarios';
    throw new Error(mensaje);
  }

  return response.json();
};

export const crearItinerario = async (payload, token) => {
  try {
    const response = await fetch(`${API_URL}/crear`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const mensajeReal = errorBody.error || errorBody.message || 'Error al crear itinerario';
      throw new Error(mensajeReal);
    }

    return await response.json();

  } catch (error) {
    throw new Error(error.message || "Error de conexión con el servidor.");
  }
};

// Actualizar un itinerario existente
export const actualizarItinerario = async (id, data, token) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al actualizar itinerario");
  return response.json();
};

// Eliminar itinerario
export const eliminarItinerario = async (idItinerario, token) => {
  if (!idItinerario) {
    throw new Error('ID del itinerario no proporcionado');
  }

  const response = await fetch(`${API_URL}/eliminar/${idItinerario}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let errorMessage = 'Error al eliminar itinerario';
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

// Obtener un itinerario por su ID
export const obtenerItinerarioPorId = async (id, token) => {
  if (!id) {
    throw new Error('ID del itinerario no proporcionado');
  }

  const response = await fetch(`${API_URL}/listar/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensaje = data.error || data.message || 'Error al obtener el itinerario';
    throw new Error(mensaje);
  }
  
  return response.json();
};

export const obtenerItinerariosRecomendados = async (token) => {
  const response = await fetch(`${API_URL}/sugerencias`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensaje = data.error || data.message || 'Error al obtener recomendaciones de itinerarios';
    throw new Error(mensaje);
  }

  return response.json();
};

export const obtenerConteoItinerariosAPI = async (token, idUsuario) => {
  const response = await fetch(`${API_URL}/conteo/${idUsuario}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener conteo de itinerarios');
  }
  
  return response.json();
};