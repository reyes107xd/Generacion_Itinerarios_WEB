import { sCrearReporte, sObtenerMisReportes } from '../services/s-reporte.js';
import { ValidacionError } from '../utils/u-errores-dominio.js';

const ERROR_MAP = { [ValidacionError.name]: 400 };

export const cCrearReporte = async (req, res) => {
  try {
    const idTurista = req.user.id; 
    const datos = req.body; 

    const resultado = await sCrearReporte(idTurista, datos);
    res.status(201).json(resultado);

  } catch (error) {
    console.error('Error en cCrearReporte:', error);
    const statusCode = ERROR_MAP[error.name] || 500;
    res.status(statusCode).json({ message: error.message || 'Error al procesar solicitud.' });
  }
};

export const cObtenerMisReportes = async (req, res) => {
  try {
    const idTurista = req.user.id;
    const listaIds = await sObtenerMisReportes(idTurista);
    res.status(200).json(listaIds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener reportes.' });
  }
};