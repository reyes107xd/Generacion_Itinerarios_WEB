import { 
    mCrearComentario, 
    mObtenerComentariosPorPublicacion, 
    mEliminarComentario,
    mObtenerComentarioPorId
} from '../models/m-comentario.js';
import { ValidacionError, ErrorOperacionNoPermitida, ErrorUsuarioNoEncontrado } from '../utils/u-errores-dominio.js';

export const sCrearComentario = async (idTurista, datos) => {
    const { id_publicacion, contenido } = datos;

    if (!contenido || contenido.trim().length === 0) {
        throw new ValidacionError('El comentario no puede estar vacío.');
    }
    if (!id_publicacion) {
        throw new ValidacionError('Falta el ID de la publicación.');
    }

    // CORRECCIÓN AQUÍ: Mapeamos idTurista (parametro) a id_turista (propiedad)
    const nuevoComentario = await mCrearComentario({
        id_publicacion,
        id_turista: idTurista, // <--- ¡ESTA ERA LA FALLA!
        contenido
    });

    return nuevoComentario;
};

export const sObtenerComentarios = async (idPublicacion) => {
    const comentariosRaw = await mObtenerComentariosPorPublicacion(idPublicacion);

    // Aplanamos la estructura
    return comentariosRaw.map(c => {
        // CORRECCIÓN AQUÍ: Ahora viene dentro de 'usuario', no 'turista'
        const perfil = c.usuario?.perfil_usuario[0] || {};
        delete c.usuario;
        
        return {
            ...c,
            autor: {
                id: c.id_turista,
                nombre: `${perfil.nombre || ''} ${perfil.ap_p || ''}`.trim(),
                nombre_usuario: perfil.nombre_usuario,
                avatar: perfil.foto
            }
        };
    });
};

export const sEliminarComentario = async (idComentario, idUsuarioSolicitante, rolUsuario) => {
    const comentario = await mObtenerComentarioPorId(idComentario);
    if (!comentario) throw new ErrorUsuarioNoEncontrado('Comentario no encontrado');

    // Si el usuario es admin, puede eliminar cualquier comentario
    if (rolUsuario === 'administrador') {
        console.log(`Admin (ID: ${idUsuarioSolicitante}) eliminando comentario ID: ${idComentario}`);
        await mEliminarComentario(idComentario);
        return { 
            message: 'Comentario eliminado exitosamente por administrador',
            eliminadoPorAdmin: true 
        };
    }

    // Si no es admin, verificamos que sea el dueño
    if (comentario.id_turista !== idUsuarioSolicitante) {
        throw new ErrorOperacionNoPermitida('No puedes eliminar un comentario que no es tuyo.');
    }

    // El usuario es el dueño, procedemos con la eliminación
    console.log(`Usuario (ID: ${idUsuarioSolicitante}) eliminando su propio comentario ID: ${idComentario}`);
    await mEliminarComentario(idComentario);
    return { message: 'Comentario eliminado' };
};