import { sCrearComentario, sObtenerComentarios, sEliminarComentario } from '../services/s-comentario.js';
import { ValidacionError, ErrorOperacionNoPermitida } from '../utils/u-errores-dominio.js';

const ERROR_MAP = {
    [ValidacionError.name]: 400,
    [ErrorOperacionNoPermitida.name]: 403
};

export const cCrearComentario = async (req, res) => {
    try {
        const idTurista = req.user.id; 
        const datos = req.body; 

        const resultado = await sCrearComentario(idTurista, datos);
        res.status(201).json(resultado);
    } catch (error) {
        console.error(error);
        const status = ERROR_MAP[error.name] || 500;
        res.status(status).json({ message: error.message });
    }
};

export const cObtenerComentarios = async (req, res) => {
    try {
        const { idPublicacion } = req.params;
        const comentarios = await sObtenerComentarios(idPublicacion);
        res.status(200).json(comentarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener comentarios.' });
    }
};

export const cEliminarComentario = async (req, res) => {
    try {
        const { id } = req.params; 
        const idUsuario = req.user.id;
        const rolUsuario = req.user.rol; 

        if (!rolUsuario) {
            console.warn('Rol de usuario no disponible en req.user');
        }

        const resultado = await sEliminarComentario(id, idUsuario, rolUsuario);
        res.status(200).json(resultado);
    } catch (error) {
        console.error(error);
        const status = ERROR_MAP[error.name] || 500;
        res.status(status).json({ message: error.message });
    }
};