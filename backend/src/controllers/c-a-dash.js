import { ERROR_MAP } from "../utils/u-errores-map.js";
import { obtenerEstadisticasPrincipalesS, obtenerMetricasTiempoRealS, obtenerDatosRegistroUsuariosS, obtenerDistribucionReportesS } from "../services/s-a-dash.js";

const manejarError = (error, res) => {
  console.error('Error en controlador de dashboard:', error);

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
 * @desc    Obtener estadísticas principales del dashboard
 * @route   GET /api/admin/dashboard/estadisticas
 */
export const obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await obtenerEstadisticasPrincipalesS();
    
    res.status(200).json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    manejarError(error, res);
  }
};

/**
 * @desc    Obtener métricas en tiempo real para actualización
 * @route   GET /api/admin/dashboard/metricas-tiempo-real
 */
export const obtenerMetricasTiempoReal = async (req, res) => {
  try {
    const metricas = await obtenerMetricasTiempoRealS();
    
    res.status(200).json({
      success: true,
      data: metricas
    });
  } catch (error) {
    manejarError(error, res);
  }
};

/**
 * @desc    Obtener datos para gráfica de registro de usuarios
 * @route   GET /api/admin/dashboard/grafica-registro-usuarios
 */
export const obtenerDatosRegistroUsuarios = async (req, res) => {
  try {
    const { periodo = '30dias' } = req.query;
    
    const datosGrafica = await obtenerDatosRegistroUsuariosS(periodo);
    
    res.status(200).json({
      success: true,
      data: datosGrafica
    });
  } catch (error) {
    manejarError(error, res);
  }
};

/**
 * @desc    Obtener datos para gráfica de distribución de reportes
 * @route   GET /api/admin/dashboard/distribucion-reportes
 */
export const obtenerDistribucionReportes = async (req, res) => {
  try {
    const distribucion = await obtenerDistribucionReportesS();
    
    res.status(200).json({
      success: true,
      data: distribucion
    });
  } catch (error) {
    manejarError(error, res);
  }
};