import * as reporteService from "../services/s-a-reportes.js";
import { ERROR_MAP } from "../utils/u-errores-map.js";

const manejarError = (error, res) => {
  console.error('Error en controlador de reportes:', error);
  const statusCode = ERROR_MAP[error.name] || 500;
  
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Error al procesar solicitud.',
    error: error.name
  });
};

const limpiarParametro = (param) => {
  if (Array.isArray(param)) return param[0];
  return param;
};

export const listarReportes = async (req, res) => {
  try {
    const paginaRaw = limpiarParametro(req.query.pagina);
    const limiteRaw = limpiarParametro(req.query.limite);
    const { estatus, tipo, fecha } = req.query;

    const pagina = parseInt(paginaRaw) || 1;
    const limite = parseInt(limiteRaw) || 10;

    const resultado = await reporteService.obtenerReportesPaginados(
      pagina, 
      limite,
      { estatus, tipo, fecha }
    );

    res.status(200).json({
      success: true,
      data: resultado.reportes,
      paginacion: {
        paginaActual: resultado.paginaActual,
        totalPaginas: resultado.totalPaginas,
        totalReportes: resultado.totalReportes
      }
    });
  } catch (error) {
    manejarError(error, res);
  }
};

export const obtenerReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const reporte = await reporteService.obtenerReportePorId(id);
    res.status(200).json({ success: true, data: reporte });
  } catch (error) { manejarError(error, res); }
};

export const actualizarEstatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estatus } = req.body;
    const reporteActualizado = await reporteService.actualizarEstatusReporte(id, estatus, req.user.id);
    res.status(200).json({ success: true, message: 'Estatus actualizado con éxito.', data: reporteActualizado });
  } catch (error) { manejarError(error, res); }
};

export const eliminarReporte = async (req, res) => {
  try {
    const { id } = req.params;
    await reporteService.eliminarReporte(id);
    res.status(200).json({ success: true, message: 'Reporte eliminado con éxito.' });
  } catch (error) { manejarError(error, res); }
};