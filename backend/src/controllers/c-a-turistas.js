import * as turistaService from "../services/s-a-turistas.js";
import { ERROR_MAP } from "../utils/u-errores-map.js";

const manejarError = (error, res) => {
  console.error('Error en controlador de turistas:', error);

  const statusCode = ERROR_MAP[error.name];
  if (statusCode) {
    return res.status(statusCode).json({
      success: false,
      message: error.message,
      error: error.name
    });
  }

  res.status(500).json({
    success: false,
    message: 'Error al procesar solicitud.'
  });
};

/**
 * @desc    Obtener lista de turistas con filtros
 * @route   GET /api/admin/turistas
 */
export const obtenerTuristas = async (req, res) => {
  try {
    console.log('Parametros obtenidos:', req.query);
    const { 
      pagina = 1, 
      limite = 10, 
      estado, 
      emailVerificado, 
      busqueda 
    } = req.query;

    const resultado = await turistaService.obtenerTuristasPaginados(
      parseInt(pagina), 
      parseInt(limite),
      { estado, emailVerificado, busqueda }
    );
    console.log('Usuarios obtenidos con éxito:', resultado);

    res.status(200).json({
      success: true,
      data: resultado.turistas,
      paginacion: {
        paginaActual: resultado.paginaActual,
        totalPaginas: resultado.totalPaginas,
        totalTuristas: resultado.totalTuristas
      }
    });
  } catch (error) {
    manejarError(error, res);
  }
};

/**
 * @desc    Obtener estadísticas de turistas
 * @route   GET /api/admin/turistas/estadisticas
 */
export const obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await turistaService.obtenerEstadisticasTuristas();

    res.status(200).json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    manejarError(error, res);
  }
};

/**
 * @desc    Bloquear un turista
 * @route   POST /api/admin/turistas/:id/bloquear
 */
export const bloquearTurista = async (req, res) => {
  try {
    const { id } = req.params;
    const { duracion, motivo } = req.body;

    const turistaActualizado = await turistaService.bloquearTurista(
      id, 
      duracion, 
      motivo, 
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Turista bloqueado con éxito.',
      data: turistaActualizado
    });
  } catch (error) {
    manejarError(error, res);
  }
};

/**
 * @desc    Desbloquear un turista
 * @route   POST /api/admin/turistas/:id/desbloquear
 */
export const desbloquearTurista = async (req, res) => {
  try {
    const { id } = req.params;

    const turistaActualizado = await turistaService.desbloquearTurista(
      id, 
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Turista desbloqueado con éxito.',
      data: turistaActualizado
    });
  } catch (error) {
    manejarError(error, res);
  }
};