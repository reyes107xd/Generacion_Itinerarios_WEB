import {
  obtenerNotificacionesAdminS,
  marcarNotificacionComoLeidaS,
  eliminarNotificacionS
} from "../services/s-a-notificaciones.js";

/**
 * @desc    Obtener notificaciones de admin con filtros
 * @route   GET /api/admin/notificaciones
 */
export const obtenerNotificacionesAdmin = async (req, res) => {
  try {
    const {
      pagina = 1,
      limite = 10,
      tipo,
      leida,
      busqueda
    } = req.query;

    const filtros = { tipo, leida, busqueda };

    const resultado = await obtenerNotificacionesAdminS(
      parseInt(pagina),
      parseInt(limite),
      filtros
    );
    
    res.status(200).json({
      success: true,
      data: resultado.notificaciones,
      paginacion: {
        paginaActual: parseInt(pagina),
        totalPaginas: resultado.totalPaginas,
        totalNotificaciones: resultado.total,
        limite: parseInt(limite)
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al obtener notificaciones.' });
  }
};

/**
 * @desc    Marcar notificación como leída
 * @route   PATCH /api/admin/notificaciones/:id/marcar-leida
 */
export const marcarNotificacionComoLeida = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notificacionActualizada = await marcarNotificacionComoLeidaS(parseInt(id));
    
    res.status(200).json({
      success: true,
      data: notificacionActualizada,
      message: 'Notificación leída con éxito.'
    });
  } catch (error) {
    manejarError(error, res);
  }
};

/**
 * @desc    Eliminar notificación
 * @route   DELETE /api/admin/notificaciones/:id
 */
export const eliminarNotificacion = async (req, res) => {
  try {
    const { id } = req.params;
    
    await eliminarNotificacionS(parseInt(id));
    
    res.status(200).json({
      success: true,
      message: 'Notificación eliminada con éxito.'
    });
  } catch (error) {
    manejarError(error, res);
  }
};