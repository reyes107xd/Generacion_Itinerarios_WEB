import { API_URL } from './a-config.js';

export const enviarReporteAPI = async (token, datosReporte) => {
  // datosReporte espera: { tipo: 'publicacion', id_objeto: 123, motivo: '...' }
  
  const response = await fetch(`${API_URL}/reportes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(datosReporte)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al enviar el reporte');
  }

  return data;
};

export const obtenerMisReportesAPI = async (token) => {
  const response = await fetch(`${API_URL}/reportes/mis-reportes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Error fetching reports');
  return response.json(); // Devuelve array
};