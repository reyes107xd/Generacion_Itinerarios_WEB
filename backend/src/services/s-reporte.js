import { mCrearReporte, mObtenerIdsReportadosPorTurista } from '../models/m-reporte.js';
import { mCrearNotificacion } from '../models/m-notification.js'; // Importa el nuevo modelo
import { ValidacionError } from '../utils/u-errores-dominio.js';

export const sCrearReporte = async (idTurista, datos) => {
  const { tipo, id_objeto, motivo } = datos; 
  
  // Validaciones (código existente)
  if (!motivo || motivo.trim().length < 3) {
    throw new ValidacionError('Debes especificar un motivo claro para el reporte.');
  }

  if (!['publicacion', 'itinerario', 'comentario'].includes(tipo)) {
    throw new ValidacionError('Tipo de reporte inválido.');
  }

  // Construir el objeto para la BD
  const reporteParaBD = {
    id_turista_reporta: idTurista,
    tipo_reporte: tipo,
    motivo: motivo,
    estatus: 'pendiente',
    id_publicacion_reportada: tipo === 'publicacion' ? id_objeto : null,
    id_itinerario_reportado: tipo === 'itinerario' ? id_objeto : null,
    id_comentario_reportado: tipo === 'comentario' ? id_objeto : null
  };

  // Guardar reporte
  const nuevoReporte = await mCrearReporte(reporteParaBD);
  
  // CREAR NOTIFICACIÓN para los administradores
  try {
    const notificacionParaBD = {
      // id_turista: null, // Notificación para administradores, no para un turista específico
      tipo: 'nuevo_reporte',
      titulo: 'Hay un nuevo reporte!',
      mensaje: `Se ha creado un nuevo reporte de tipo "${tipo}" con motivo: ${motivo.substring(0, 50)}${motivo.length > 50 ? '...' : ''}`,
      enlace: `/admin/reportes/${nuevoReporte.id}`, // Ajusta esta ruta según tu frontend
      leida: false,
      para_admin: true // Esta bandera indica que es para administradores
    };

    await mCrearNotificacion(notificacionParaBD);
    console.log('Notificación creada exitosamente para el reporte:', nuevoReporte.id);
    
  } catch (errorNotificacion) {
    // No lanzamos error aquí para no afectar la creación del reporte
    // Solo registramos el error de la notificación
    console.error('Error al crear notificación:', errorNotificacion.message);
    // El reporte ya fue creado, así que continuamos
  }

  return { 
    message: 'Reporte enviado correctamente. Los administradores lo revisarán.', 
    reporte: nuevoReporte 
  };
};

export const sObtenerMisReportes = async (idTurista) => {
  return await mObtenerIdsReportadosPorTurista(idTurista);
};