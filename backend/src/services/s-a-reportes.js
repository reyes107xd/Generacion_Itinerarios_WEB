// src/services/reporte.service.js
import { 
  ErrorReporteNoEncontrado, 
  ErrorEstatusInvalido,
  ErrorOperacionReporteNoPermitida 
} from "../utils/u-errores-dominio.js";
import { Reporte } from "../models/m-a-reportes.js";

/**
 * Obtener reportes paginados con filtros
 */
export const obtenerReportesPaginados = async (pagina = 1, limite = 10, filtros = {}) => {
  const inicio = (pagina - 1) * limite;
  
  // Pasar los filtros al modelo
  const resultado = await Reporte.obtenerReportesPaginados(inicio, limite, filtros);
  
  const totalPaginas = Math.ceil(resultado.total / limite);

  return {
    reportes: resultado.reportes,
    paginaActual: pagina,
    totalPaginas,
    totalReportes: resultado.total
  };
};

/**
 * Obtener un reporte por ID
 */
export const obtenerReportePorId = async (idReporte) => {
  // Validar que el ID sea un número válido
  if (!idReporte || isNaN(idReporte)) {
    throw new ErrorReporteNoEncontrado('ID de reporte no válido');
  }

  const reporte = await Reporte.obtenerPorId(parseInt(idReporte));
  return reporte;
};

/**
 * Actualizar estatus de un reporte
 */
export const actualizarEstatusReporte = async (idReporte, estatus, idAdmin) => {
  if (!idReporte || isNaN(idReporte)) {
    throw new ErrorReporteNoEncontrado('ID de reporte no válido');
  }

  const estatusValidos = ['pendiente', 'en_revision', 'resuelto', 'rechazado'];
  if (!estatus || !estatusValidos.includes(estatus)) {
    throw new ErrorEstatusInvalido(
      `Estatus no válido. Permitidos: ${estatusValidos.join(', ')}`
    );
  }

  const idReporteNum = parseInt(idReporte);

  // 1. Obtener reporte actual
  const reporteActual = await Reporte.obtenerPorId(idReporteNum);
  
  // CORRECCIÓN AQUÍ: Usar 'estatus' en minúsculas
  if (reporteActual.estatus === 'resuelto' && estatus === 'pendiente') {
    throw new ErrorOperacionReporteNoPermitida(
      'No se puede reabrir un reporte ya resuelto'
    );
  }

  // 2. Actualizar
  const reporteActualizado = await Reporte.actualizarEstatus(
    idReporteNum, 
    estatus, 
    idAdmin
  );

  return reporteActualizado;
};

/**
 * Eliminar un reporte
 */
export const eliminarReporte = async (idReporte) => {
  if (!idReporte || isNaN(idReporte)) {
    throw new ErrorReporteNoEncontrado('ID de reporte no válido');
  }

  const idReporteNum = parseInt(idReporte);
  const reporteActual = await Reporte.obtenerPorId(idReporteNum);

  // CORRECCIÓN AQUÍ: Usar 'estatus' en minúsculas
  if (reporteActual.estatus === 'en_revision') {
    throw new ErrorOperacionReporteNoPermitida(
      'No se puede eliminar un reporte mientras está en revisión'
    );
  }

  await Reporte.eliminar(idReporteNum);
  return true;
};