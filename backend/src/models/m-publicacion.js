// En: src/models/m-publicacion.js
import { supabase } from '../config/cf-con-db.js';

export const mCrearPublicacion = async (datos, idTurista) => {
  const { titulo, descripcion, tipo_publicacion, foto, id_itinerario, privacidad } = datos;

  const publicacionData = {
    id_turista: idTurista,
    titulo: titulo,
    descripcion: descripcion,
    tipo_publicacion: tipo_publicacion,
    foto: foto, //Lo cambie a string de arrays
    id_itinerario: id_itinerario,
    estatus: 'publicado',
    privacidad: privacidad || 'public' // Nuevo campo para privacidad
  };

  const { data, error } = await supabase
    .from('publicacion')
    .insert(publicacionData)
    .select()
    .single();

  if (error) {
    console.error('Error al crear publicacion:', error.message);
    throw error;
  }
  return data;
};

export const mObtenerPublicaciones = async () => {
  try {
    const { data, error } = await supabase
      .from('publicacion')
      .select(`
        id_publicacion,
        titulo,
        descripcion,
        tipo_publicacion,
        foto, 
        id_itinerario,
        fecha_publicacion,
        privacidad, 
        id_turista,
        usuario (
          perfil_usuario (
            nombre,
            ap_p,
            foto,
            nombre_usuario
          )
        ),
        itinerario (
  id_itinerario,
  titulo,
  
  creador:usuario (
    perfil_usuario ( nombre, ap_p )
  )
),
        reaccion ( count ),
        comentario ( count )
      `)
      .order('fecha_publicacion', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Error al obtener publicaciones:', error.message);
    throw error;
  }
};

export const mObtenerPublicacionPorId = async (id_publicacion) => {
  try {
    const { data, error } = await supabase
      .from('publicacion')
      .select(`
        id_publicacion,
        id_turista,
        titulo,
        descripcion,
        tipo_publicacion,
        foto,
        id_itinerario,
        fecha_publicacion,
        privacidad,
        usuario (
          perfil_usuario (
            nombre,
            ap_p,
            foto,
            nombre_usuario
          )
        ),
        reaccion ( count ),
        comentario ( count ),
        itinerario (
          id_itinerario,
          titulo,
          creador:usuario (
            perfil_usuario ( nombre, ap_p )
          )
        )
      `)
      .eq('id_publicacion', id_publicacion)
      .single();

    if (error) throw error;
    if (!data) return NULL; //404
    return data;

  } catch (error) {
    console.error('Error al obtener publicacion por ID:', error.message);
    throw error;
  }
};

export const mEliminarPublicacion = async (id_publicacion) => {
  try {
    // 1. ACTUALIZAR Reportes asociados (en lugar de eliminarlos)
    // Establecemos id_publicacion_reportada a NULL para mantener el historial del reporte
    const { error: errorReportes } = await supabase
      .from('reporte')
      .update({
        id_publicacion_reportada: null,
      })
      .eq('id_publicacion_reportada', id_publicacion);
    if (errorReportes) throw errorReportes;

    // 2. Eliminar Reacciones (Likes) asociadas
    const { error: errorReacciones } = await supabase
      .from('reaccion')
      .delete()
      .eq('id_publicacion', id_publicacion);

    if (errorReacciones) throw errorReacciones;

    const { error: errorComentarios } = await supabase
      .from('comentario')
      .delete()
      .eq('id_publicacion', id_publicacion);
    if (errorComentarios) throw errorComentarios;

    // 3. Eliminar la Publicación
    const { error } = await supabase
      .from('publicacion')
      .delete()
      .eq('id_publicacion', id_publicacion);

    if (error) throw error;
    return true;

  } catch (error) {
    console.error('Error al eliminar publicación en el modelo:', error.message);
    throw new Error('Error en la base de datos al eliminar la publicación');
  }
};

export const mActualizarPublicacion = async (id_publicacion, datos) => {
  // Solo permitimos actualizar el título y la descripción
  const { titulo, descripcion } = datos;

  try {
    const { data, error } = await supabase
      .from('publicacion')
      .update({
        titulo: titulo,
        descripcion: descripcion
      })
      .eq('id_publicacion', id_publicacion)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al actualizar publicación en el modelo:', error.message);
    throw new Error('Error en la base de datos al actualizar la publicación');
  }
};

export const mContarPublicacionesPorUsuario = async (idTurista) => {
  try {
    console.log("--> CONTANDO posts para ID Turista:", idTurista);
    const { count, error } = await supabase
      .from('publicacion')
      .select('*', { count: 'exact', head: true }) // 'head: true' solo cuenta, no baja datos
      .eq('id_turista', idTurista);
    console.log("--> RESULTADO Conteo:", count, "Error:", error);

    if (error) throw error;
    return count;
  } catch (error) {
    console.error('Error contando publicaciones:', error.message);
    return 0; // Si falla, devolvemos 0 para no romper nada
  }
};

export const mObtenerPublicacionesPorTurista = async (idTurista) => {
  try {
    const { data, error } = await supabase
      .from('publicacion')
      .select(`
        id_publicacion,
        id_turista,
        titulo,
        descripcion,
        tipo_publicacion,
        foto,
        fecha_publicacion,
        privacidad,
        id_itinerario,
        usuario (
          perfil_usuario (
            nombre,
            ap_p,
            foto,
            nombre_usuario
          )
        ),
        reaccion ( count ),
        itinerario (
          id_itinerario,
          titulo,
          creador:usuario (
            perfil_usuario ( nombre, ap_p )
          )
        )
      `)
      .eq('id_turista', idTurista)
      .order('fecha_publicacion', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener mis publicaciones:', error.message);
    throw error;
  }
};