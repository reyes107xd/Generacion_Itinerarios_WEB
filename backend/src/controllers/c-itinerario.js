import {
  crearItinerario,
  obtenerItinerarios,
  obtenerItinerariosPorUsuario,
  obtenerItinerarioPorId,
  eliminarItinerario,
  exportarItinerarioPDF,
  obtenerLugaresPorItinerarioId,
  actualizarItinerario,
  obtenerSugerenciasItinerarios,
  sContarItinerarios
} from '../services/s-itinerario.js';

import { RecursoNoEncontradoError } from '../utils/u-errores-dominio.js';
import { ERROR_MAP } from '../utils/u-errores-map.js';

export const crearItinerarioController = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { titulo, descripcion, privacidad, fecha_inicio, fecha_termino, dias } = req.body;

    if (!titulo || !descripcion || !fecha_inicio || !fecha_termino) {
      throw new ValidacionError('Formulario incompleto.');
    }

    const nuevoItinerario = await crearItinerario({
      usuarioId,
      titulo,
      descripcion,
      privacidad,
      fecha_inicio,
      fecha_termino,
      dias: dias 
    });

    return res.status(201).json({
      message: 'Itinerario creado con éxito.',
      itinerario: nuevoItinerario
    });
  } catch (err) {
    console.error('Error al crear itinerario:', err);
    const status = ERROR_MAP[err.name] || 500;
    return res.status(status).json({ error: err.message || 'Error al crear itinerario.' });
  }
};

export const obtenerItinerariosController = async (req, res) => {
  try {
    const lista = await obtenerItinerarios();
    return res.status(200).json({ message: 'Itinerarios obtenidos con éxito.', data: lista || [] });
  } catch (error) {
    console.error('Error al obtener itinerarios:', error);
    res.status(500).json({ error: 'Error al obtener itinerarios.' });
  }
};

export const obtenerItinerariosDelUsuarioController = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const itinerarios = await obtenerItinerariosPorUsuario(usuarioId);
    return res.status(200).json(itinerarios || []);
  } catch (err) {
    console.error('Error al obtener itinerarios de:', err);
    const status = ERROR_MAP[err.name] || 500;
    return res.status(status).json({ error: err.message || 'Error al obtener itinerarios.' });
  }
};

export const obtenerItinerarioPorIdController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'ID de itinerario no proporcionado.' });
    }

    const itinerario = await obtenerItinerarioPorId(id);
    if (!itinerario) throw new RecursoNoEncontradoError('Itinerario no encontrado.');

    const lugares = await obtenerLugaresPorItinerarioId(id);
    itinerario.lugares = lugares || [];

    return res.status(200).json(itinerario);
  } catch (error) {
    console.error('Error al obtener itinerario:', error);
    const status = ERROR_MAP[error.name] || 500;
    return res.status(status).json({ error: error.message || 'Error al obtener itinerario.' });
  }
};

export const eliminarItinerarioController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'ID de itinerario no proporcionado.' });
    }

    await eliminarItinerario(id);
    return res.status(200).json({ message: 'Itinerario eliminado con éxito.' });

  } catch (error) {
    console.error('Error al eliminar itinerario:', error);
    const status = ERROR_MAP[error.name] || 500;
    return res.status(status).json({ error: error.message || 'Error al eliminar itinerario.' });
  }
};

export const exportarItinerarioPDFController = async (req, res) => {
  try {
    const { id } = req.params;
    const pdfBuffer = await exportarItinerarioPDF(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=itinerario_${id}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error al exportar PDF:', error);
    res.status(500).json({ error: 'Error al exportar PDF.' });
  }
};

export const actualizarItinerarioController = async (req, res) => {
  try {
    const { id } = req.params;
    const campos = req.body;

    const actualizado = await actualizarItinerario(id, campos);
    return res.status(200).json({
      message: 'Itinerario actualizado con éxito.',
      itinerario: actualizado
    });

  } catch (error) {
    console.error("Error al actualizar itinerario:", error);
    const status = ERROR_MAP[error.name] || 500;
    return res.status(status).json({ error: error.message || "Error al actualizar itinerario." });
  }
};

export const obtenerSugerenciasController = async (req, res) => {
  try {
    const idUsuario = req.user.id;
    const sugerencias = await obtenerSugerenciasItinerarios(idUsuario);
    return res.status(200).json(sugerencias || []);
  } catch (error) {
    console.error("Error al obtener sugerencias:", error);
    const status = ERROR_MAP[error.name] || 500;
    return res.status(status).json({ error: error.message || "Error al obtener sugerencias." });
  }
};

export const cContarItinerarios = async (req, res) => {
  try {
    const { id } = req.params; 
    const conteo = await sContarItinerarios(id);
    res.status(200).json(conteo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al contar itinerarios.' });
  }
};