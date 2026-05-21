import { 
  sCrearPublicacion, 
  sObtenerPublicaciones, 
  sObtenerPublicacionPorId, 
  sEliminarPublicacion, 
  sActualizarPublicacion,
  sObtenerMisPublicaciones,
  sContarPublicacionesUsuario, 
  sObtenerPublicacionesPublicasUsuario
} from '../services/s-publicacion.js';

import { ValidacionError, ErrorUsuarioNoEncontrado, ErrorOperacionNoPermitida } from '../utils/u-errores-dominio.js';

const ERROR_MAP = { 
  [ValidacionError.name]: 400, 
  [ErrorUsuarioNoEncontrado.name]: 404, 
  [ErrorOperacionNoPermitida.name]: 403 
};

export const cObtenerPublicacionesPublicasUsuario = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    if (!idUsuario || isNaN(parseInt(idUsuario))) {
      return res.status(400).json({
        ok: false,
        message: 'ID de usuario inválido.',
        publicaciones: []
      });
    }

    const publicaciones = await sObtenerPublicacionesPublicasUsuario(idUsuario);
    
    return res.status(200).json({
      ok: true,
      // Estandarizado: Publicaciones encontradas con éxito.
      message: `Publicaciones encontradas con éxito.`,
      publicaciones: publicaciones
    });
    
  } catch (error) {
    console.error('Error en cObtenerPublicacionesPublicasUsuario:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener publicaciones.',
      publicaciones: []
    });
  }
};

export const cCrearPublicacion = async (req, res) => {
  try {
    const idTurista = req.user.id;
    if (!idTurista) {
      return res.status(401).json({ message: 'ID de usuario inválido.' });
    }

    const datosPublicacion = req.body;
    const nuevaPublicacion = await sCrearPublicacion(datosPublicacion, idTurista);

    res.status(201).json({
      message: "Publicación creada con éxito.",
      publicacion: nuevaPublicacion
    });
  } catch (error) {
    console.error('Error en cCrearPublicacion:', error);
    const statusCode = ERROR_MAP[error.name] || 500;
    
    if (statusCode === 400) {
      return res.status(statusCode).json({ message: 'Error al validar.', error: error.message });
    }

    res.status(500).json({ 
      message: "Error al crear publicación.",
      error: error.message
    });
  }
};

export const cObtenerPublicaciones = async (req, res) => {
  try {
    const idUsuario = req.user?.id || null;
    const feed = await sObtenerPublicaciones(idUsuario);
    res.status(200).json(feed);
  } catch (error) {
    console.error('Error en cObtenerPublicaciones:', error);
    res.status(500).json({ message: 'Error al obtener publicaciones.' });
  }
};

export const cObtenerPublicacionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const publicacion = await sObtenerPublicacionPorId(id);
    res.status(200).json(publicacion);
  } catch (error) {
    console.error('Error en cObtenerPublicacionPorId:', error);
    const statusCode = ERROR_MAP[error.name] || 500;
    res.status(statusCode).json({ message: error.message || 'Error al obtener publicación.' });
  }
};

export const cEliminarPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const idUsuario = req.user.id;
    const rolUsuario = req.user.rol;

    const resultado = await sEliminarPublicacion(id, idUsuario, rolUsuario);
    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en cEliminarPublicacion:', error);
    const statusCode = ERROR_MAP[error.name] || 500;
    res.status(statusCode).json({ message: error.message || 'Error al eliminar publicación.' });
  }
};

export const cActualizarPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const idUsuario = req.user.id;
    const datos = req.body;

    const publicacion = await sActualizarPublicacion(id, idUsuario, datos);
    res.status(200).json(publicacion);
  } catch (error) {
    console.error('Error en cActualizarPublicacion:', error);
    const statusCode = ERROR_MAP[error.name] || 500;
    res.status(statusCode).json({ message: error.message || 'Error al actualizar publicación.' });
  }
};

export const cContarPublicacionesUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await sContarPublicacionesUsuario(id);
    res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ cantidad: 0 });
  }
};

export const cObtenerMisPublicaciones = async (req, res) => {
  try {
    const idTurista = req.user.id;
    const misPosts = await sObtenerMisPublicaciones(idTurista);
    res.status(200).json(misPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener publicaciones.' });
  }
};