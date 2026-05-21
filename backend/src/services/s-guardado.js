// src/services/s-guardado.js
import { 
  mToggleGuardado,
  mObtenerIdsGuardados, 
  mObtenerListaGuardados 
} from '../models/m-guardado.js';

export const sToggleGuardar = async (idTurista, idObjeto, accion, tipo = 'publicacion') => {
  
  // 1. Mapear el tipo a la columna correcta de la BD
  const datosBD = {
    id_turista: idTurista,
    id_publicacion: tipo === 'publicacion' ? idObjeto : null,
    id_itinerario_guardado: tipo === 'itinerario' ? idObjeto : null
  };

  // Validación de seguridad
  if (!datosBD.id_publicacion && !datosBD.id_itinerario_guardado) {
      throw new ValidacionError('Tipo de objeto a guardar no válido');
  }

  // 2. Llamar al modelo GENÉRICO
  const resultado = await mToggleGuardado(datosBD, accion);
  return resultado;
};

export const sObtenerIdsGuardados = async (idTurista) => {
  return await mObtenerIdsGuardados(idTurista);
};

export const sObtenerColeccionGuardados = async (idTurista) => {
  const publicaciones = await mObtenerListaGuardados(idTurista);

  // Adaptamos los datos igual que en el Feed
  return publicaciones.map(pub => {
    const autorPerfil = pub.turista?.usuario?.perfil_usuario[0] || {};
    delete pub.turista;

    const conteoLikes = pub.reaccion?.[0]?.count || 0;
    const conteoComentarios = pub.comentario?.[0]?.count || 0;

    return {
      ...pub,
      likes: conteoLikes,
      commentsCount: conteoComentarios,
      autor: {
        id: pub.id_turista,
        nombre: `${autorPerfil.nombre || ''} ${autorPerfil.ap_p || ''}`.trim(),
        foto: autorPerfil.foto,
        nombre_usuario: autorPerfil.nombre_usuario
      }
    };
  });
};