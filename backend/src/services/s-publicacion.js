// --------s-publicación.
import User from '../models/m-user.js';
import {
  mCrearPublicacion, mObtenerPublicaciones,
  mObtenerPublicacionPorId, mEliminarPublicacion,
  mActualizarPublicacion, mContarPublicacionesPorUsuario, mObtenerPublicacionesPorTurista
} from '../models/m-publicacion.js';
import { ErrorOperacionNoPermitida, ErrorUsuarioNoEncontrado, ValidacionError } from '../utils/u-errores-dominio.js';
import { mObtenerIdsMisAmigos } from '../models/m-amistad.js';
import Itinerario from '../models/m-itinerario.js';
import { supabase } from '../config/cf-con-db.js';

export const sCrearPublicacion = async (datos, idTurista) => {
  let { titulo, tipo_publicacion, foto, fotos, id_itinerario, privacidad, descripcion } = datos;

  if (!titulo || !tipo_publicacion) {
    throw new ValidacionError('El título y el tipo son obligatorios.');
  }

  let fotosFinal = [];
  if (Array.isArray(fotos)) fotosFinal = fotos;
  else if (Array.isArray(foto)) fotosFinal = foto;
  else if (foto) fotosFinal = [foto];

  if (privacidad && !['public', 'friends', 'private'].includes(privacidad)) {
    throw new ValidacionError('El tipo de privacidad no es válido.');
  }

  // --- VALIDACIÓN ESTRICTA ---
  // Eliminamos la condición "si es foto". Ahora es "siempre".
  if (fotosFinal.length === 0) {
    throw new ValidacionError('Debes incluir al menos una foto.');
  }

  // --- VALIDACIÓN DE ITINERARIO ---
  if (id_itinerario) {
    // 1. Buscamos el itinerario
    const itinerario = await Itinerario.obtenerPorId(id_itinerario);
    if (!itinerario) {
      // ASUMO que tienes definido RecursoNoEncontradoError en tu proyecto
      // throw new RecursoNoEncontradoError('El itinerario seleccionado no existe.');
      throw new Error('El itinerario seleccionado no existe.');
    }

    // 2. Validar Privacidad Cruzada (CORREGIDO)
    // Lógica: privacidad === true  -> PRIVADO
    //         privacidad === false -> PÚBLICO
    const isItinerarioPrivado = itinerario.privacidad === true || itinerario.id_privacidad === 1;

    const isPublicacionPublica = (!privacidad || privacidad === 'public');
    const isPublicacionAmigos = (privacidad === 'friends');

    // Regla: Si el itinerario es privado, NO se puede exponer en 'public' NI en 'friends'.
    if (isItinerarioPrivado && (isPublicacionPublica || isPublicacionAmigos)) {
      throw new ValidacionError(
        'No puedes compartir un itinerario PRIVADO en una publicación Pública o de Amigos. Cambia la visibilidad de la publicación a "Solo yo" o haz público tu itinerario.'
      );
    }

    // Forzamos el tipo a 'itinerario'
    tipo_publicacion = 'itinerario';
  }
  // --------------------------------

  return await mCrearPublicacion({
    titulo,
    descripcion,
    tipo_publicacion,
    foto: fotosFinal,
    id_itinerario: id_itinerario || null,
    privacidad
  }, idTurista);
};

export const sObtenerPublicaciones = async (idUsuarioVisualizador) => {

  // A. Obtenemos las publicaciones (Query original)
  const publicaciones = await mObtenerPublicaciones();

  // B. Obtenemos la lista de amigos del usuario actual (Query nueva)
  let misAmigosIds = [];
  if (idUsuarioVisualizador) {
    misAmigosIds = await mObtenerIdsMisAmigos(idUsuarioVisualizador);
  }

  // C. Mapeamos y comparamos
  const feed = publicaciones.map(pub => {
    // Corregimos la anidación para ser más robustos
    // CÓDIGO CORREGIDO Y ROBUSTO
    const perfil = Array.isArray(pub.usuario?.perfil_usuario)
      ? pub.usuario.perfil_usuario[0]
      : pub.usuario?.perfil_usuario || {};
    delete pub.usuario; // Corregido: eliminamos el objeto usuario, no turista

    const conteoLikes = pub.reaccion?.[0]?.count || 0;
    const conteoComentarios = pub.comentario?.[0]?.count || 0;

    // ID del autor de este post
    const idAutor = pub.id_turista;

    // Mapeo del creador del itinerario (Si existe)
    const creadorItinerarioPerfil = pub.itinerario?.creador?.perfil_usuario?.[0] || pub.itinerario?.creador?.perfil_usuario || {};


    return {
      ...pub,
      likes: conteoLikes,
      commentsCount: conteoComentarios,

      // --- LÓGICA CORREGIDA ---
      // Es amigo si el ID del autor está en mi lista de amigos
      isFriend: misAmigosIds.includes(idAutor),
      // -----------------------

      autor: {
        id: idAutor, // Aseguramos que vaya el ID
        name: `${perfil.nombre || ''} ${perfil.ap_p || ''}`.trim(), // <--- CORREGIDO: NOMBRE COMPLETO
        avatar: perfil.foto, // <--- CORREGIDO: AGREGADO AVATAR
        username: perfil.nombre_usuario // <--- CORREGIDO: AGREGADO USERNAME
      },

      // Añadimos datos del itinerario para el frontend (FeedCard.jsx)
      itinerario_titulo: pub.itinerario?.titulo,
      itinerario_autor: `${creadorItinerarioPerfil.nombre || ''} ${creadorItinerarioPerfil.ap_p || ''}`.trim() || 'Desconocido',
    };
  });

  return feed;
};

export const sObtenerPublicacionPorId = async (id_publicacion) => {
  const pub = await mObtenerPublicacionPorId(id_publicacion);
  if (!pub) throw new ErrorUsuarioNoEncontrado('Publicación no encontrada.');

  // Corregimos la anidación para ser más robustos
  const perfil = pub.usuario?.perfil_usuario?.[0] || pub.usuario?.perfil_usuario || {};
  delete pub.usuario; // Corregido: eliminamos el objeto usuario, no turista

  const conteoLikes = pub.reaccion?.[0]?.count || 0;
  const conteoComentarios = pub.comentario?.[0]?.count || 0;

  const idAutor = pub.id_turista;
  const creadorItinerarioPerfil = pub.itinerario?.creador?.perfil_usuario?.[0] || pub.itinerario?.creador?.perfil_usuario || {};

  return {
    ...pub,
    likes: conteoLikes,
    commentsCount: conteoComentarios,

    autor: { // Usamos 'autor' en minúscula para evitar problemas de case
      id: idAutor,
      name: `${perfil.nombre || ''} ${perfil.ap_p || ''}`.trim(),
      avatar: perfil.foto,
      username: perfil.nombre_usuario
    },
    itinerario_titulo: pub.itinerario?.titulo,
    itinerario_autor: `${creadorItinerarioPerfil.nombre || ''} ${creadorItinerarioPerfil.ap_p || ''}`.trim() || 'Desconocido',
  };
};


// En tu servicio de publicaciones
export const sEliminarPublicacion = async (idPublicacion, idUsuario, rolUsuario) => {
  try {
    // Primero obtenemos la publicación para verificar el dueño
    const publicacion = await mObtenerPublicacionPorId(idPublicacion);

    if (!publicacion) {
      // ASUMO que tienes definido ErrorPublicacionNoEncontrada en tu proyecto
      // throw new ErrorPublicacionNoEncontrada(); 
      throw new Error('Publicación no encontrada.');
    }

    // Si el usuario es admin, puede eliminar cualquier publicación
    if (rolUsuario === 'administrador') {
      console.log('Eliminando publicación como administrador');
      const resultado = await mEliminarPublicacion(idPublicacion);
      return {
        message: 'Publicación eliminada exitosamente por administrador',
        publicacionEliminada: resultado
      };
    }

    // Si no es admin, verificamos que sea el dueño
    if (publicacion.id_turista !== idUsuario) {
      // ASUMO que tienes definido ErrorAutorizacion en tu proyecto
      // throw new ErrorAutorizacion('No tienes permisos para eliminar esta publicación');
      throw new Error('No tienes permisos para eliminar esta publicación');
    }

    // El usuario es el dueño, procedemos con la eliminación
    console.log('Eliminando publicación como dueño');
    const resultado = await mEliminarPublicacion(idPublicacion);
    return {
      message: 'Publicación eliminada exitosamente',
      publicacionEliminada: resultado
    };

  } catch (error) {
    console.error('Error en sEliminarPublicacion:', error);
    throw error;
  }
};

export const sActualizarPublicacion = async (id_publicacion, idUsuarioAutenticado, datos) => {
  // Obtenemos la publicación para la autorización
  const publicacion = await mObtenerPublicacionPorId(id_publicacion);

  if (!publicacion) {
    throw new ErrorUsuarioNoEncontrado('Publicación no encontrada.');
  }

  // Autorizacion
  if (publicacion.id_turista !== idUsuarioAutenticado) {
    throw new ErrorOperacionNoPermitida('No tienes permiso para editar esta publicación.');
  }

  // Validar los datos
  const { titulo, descripcion } = datos;
  if (!titulo && !descripcion) {
    throw new ValidacionError('Debes proporcionar al menos un título o descripción para actualizar.');
  }

  // Si todo está bien, actualizamos
  const publicacionActualizada = await mActualizarPublicacion(id_publicacion, { titulo, descripcion });

  return publicacionActualizada;
};

export const sContarPublicacionesUsuario = async (idUsuario) => {
  const cantidad = await mContarPublicacionesPorUsuario(idUsuario);
  return { cantidad }; // Devuelve { cantidad: 5 }
};

export const sObtenerMisPublicaciones = async (idTurista) => {
  const publicaciones = await mObtenerPublicacionesPorTurista(idTurista);

  // Adaptamos igual que el feed (pero sin autor, porque soy yo)
  return publicaciones.map(pub => ({
    ...pub,
    likes: pub.reaccion?.[0]?.count || 0
  }));
};

// FUNCIÓN CORREGIDA Y UNIFICADA CON LÓGICA ROBUSTA 
export const sObtenerPublicacionesPublicasUsuario = async (idUsuario) => {
  try {
    const idTurista = Number(idUsuario);

    // Usamos el modelo optimizado (ya trae el JOIN con usuario)
    const publicaciones = await mObtenerPublicacionesPorTurista(idTurista);

    if (!publicaciones || publicaciones.length === 0) {
      return [];
    }

    // Filtramos solo las públicas
    const publicacionesPublicas = publicaciones.filter(p => p.privacidad === 'public');

    // Mapeamos para dar el formato correcto al Frontend
    const feed = publicacionesPublicas.map(pub => {

      //  LÓGICA DE EXTRACCIÓN ROBUSTA UNIFICADA 
      const perfil = Array.isArray(pub.usuario?.perfil_usuario)
        ? pub.usuario.perfil_usuario[0] // Caso: Viene como [ {perfil_data} ]
        : pub.usuario?.perfil_usuario || {}; // Caso: Viene como {perfil_data} o {}

      // Manejo de fotos (tu lógica existente)
      let fotosArray = [];
      if (pub.foto) {
        if (Array.isArray(pub.foto)) fotosArray = pub.foto;
        else if (typeof pub.foto === 'string') {
          fotosArray = [pub.foto];
        }
      }

      return {
        id_publicacion: pub.id_publicacion,
        titulo: pub.titulo,
        descripcion: pub.descripcion,
        foto: fotosArray,
        fecha_publicacion: pub.fecha_publicacion,
        likes: pub.reaccion?.[0]?.count || 0,
        commentsCount: 0,

        autor: {
          id: pub.id_turista,
          // Usamos 'perfil' que ya fue limpiado
          name: `${perfil.nombre || 'Usuario'} ${perfil.ap_p || ''}`.trim(),
          username: perfil.nombre_usuario || 'anonimo',
          avatar: perfil.foto || null
        },

        // Datos extra del itinerario si existen
        itinerario_titulo: pub.itinerario?.titulo
      };
    });

    return feed;

  } catch (error) {
    console.error('Error en sObtenerPublicacionesPublicasUsuario:', error);
    return [];
  }
};