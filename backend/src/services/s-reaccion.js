import { mDarLike, mQuitarLike, mContarLikes,
  mObtenerIdsLikesPorTurista,mObtenerPublicacionesConLikePorTurista } from '../models/m-reaccion.js';
import { ValidacionError } from '../utils/u-errores-dominio.js';
import { supabase } from '../config/cf-con-db.js';
import { createNotification } from './s-notification.js';

export const sDarLike = async (idPublicacion, idTurista, nombreQuienDaLike) => {
  if (!idPublicacion) throw new ValidacionError('Se requiere el ID de la publicación.');
  
  await mDarLike(idPublicacion, idTurista);
  
  // Obtener información del autor de la publicación para notificarle
  const { data: publicacion, error } = await supabase
    .from('publicacion')
    .select(`
      id_turista,
      titulo,
      usuario (
          perfil_usuario (nombre, ap_p)
        )
      )
    `)
    .eq('id_publicacion', idPublicacion)
    .single();

  if (!error && publicacion && publicacion.id_turista !== idTurista) {
    // Solo notificar si no es el propio autor quien da like
    const nombreCompleto = nombreQuienDaLike || 'Alguien';
    
    await createNotification(publicacion.id_turista, {
      tipo: 'like',
      titulo: 'Le gustó tu publicación',
      mensaje: `A ${nombreCompleto} le gustó tu publicación "${publicacion.titulo || 'tu post'}"`,
      enlace: `/publicacion/${idPublicacion}`
    });
  }
  
  // Devolver el nuevo conteo para actualizar el frontend inmediatamente
  const nuevoConteo = await mContarLikes(idPublicacion);
  return { message: 'Like agregado', conteo: nuevoConteo };
};

export const sQuitarLike = async (idPublicacion, idTurista) => {
  if (!idPublicacion) throw new ValidacionError('Se requiere el ID de la publicación.');

  await mQuitarLike(idPublicacion, idTurista);

  // Devolver el nuevo conteo
  const nuevoConteo = await mContarLikes(idPublicacion);
  return { message: 'Like eliminado', conteo: nuevoConteo };
};

export const sObtenerMisLikes = async (idTurista) => {
  return await mObtenerIdsLikesPorTurista(idTurista);
};

export const sObtenerFavoritosCompletos = async (idTurista) => {
  const publicaciones = await mObtenerPublicacionesConLikePorTurista(idTurista);
  
  return publicaciones.map(pub => {
    const autorPerfil = pub.turista?.usuario?.perfil_usuario[0] || {};
    delete pub.turista;
    
    return {
      ...pub,
      likes: pub.reaccion?.[0]?.count || 0,
      autor: {
        nombre: `${autorPerfil.nombre || ''} ${autorPerfil.ap_p || ''}`.trim(),
        foto: autorPerfil.foto,
        nombre_usuario: autorPerfil.nombre_usuario
      }
    };
  });
};