import { API_URL as BASE_API } from './a-config'; // Importamos

// Construimos la ruta específica para este archivo
const API_URL = `${BASE_API}/admin/dashboard`;

/**
 * Obtener estadísticas principales del dashboard
 */
export const obtenerEstadisticasDashboard = async (token) => {
  const response = await fetch(`${API_URL}/estadisticas`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensajeReal = data.error || data.message || 'Error al obtener estadísticas del dashboard';
    throw new Error(mensajeReal);
  }
  
  return response.json();
};

/**
 * Obtener métricas en tiempo real para el dashboard
 */
export const obtenerMetricasTiempoReal = async (token) => {
  const response = await fetch(`${API_URL}/metricas-tiempo-real`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensajeReal = data.error || data.message || 'Error al obtener métricas en tiempo real';
    throw new Error(mensajeReal);
  }
  
  return response.json();
};

/**
 * Obtener datos para gráfica de registro de usuarios
 */
export const obtenerDatosRegistroUsuarios = async (token, periodo = '30dias') => {
  const response = await fetch(`${API_URL}/grafica-registro-usuarios?periodo=${periodo}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensajeReal = data.error || data.message || 'Error al obtener datos de registro de usuarios';
    throw new Error(mensajeReal);
  }
  
  return response.json();
};

/**
 * Obtener datos para gráfica de distribución de reportes
 */
export const obtenerDistribucionReportes = async (token) => {
  const response = await fetch(`${API_URL}/distribucion-reportes`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const mensajeReal = data.error || data.message || 'Error al obtener distribución de reportes';
    throw new Error(mensajeReal);
  }
  
  return response.json();
};