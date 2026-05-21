import { supabase } from '../config/cf-con-db.js';

export const mCrearComentario = async ({ id_publicacion, id_turista, contenido }) => {
  try {
    const { data, error } = await supabase
      .from('comentario')
      .insert({
        id_publicacion,
        id_turista, 
        contenido
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creando comentario:', error.message);
    throw error;
  }
};

export const mObtenerComentariosPorPublicacion = async (idPublicacion) => {
  try {
    const { data, error } = await supabase
      .from('comentario')
      .select(`
        id_comentario,
        contenido,
        fecha_comentario,
        id_turista,
        usuario (  
          perfil_usuario (
            nombre,
            ap_p,
            foto,
            nombre_usuario
          )
        )
      `)
      
      .eq('id_publicacion', idPublicacion)
      .order('fecha_comentario', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error obteniendo comentarios:', error.message);
    throw error;
  }
};

export const mEliminarComentario = async (idComentario) => {
  const { error } = await supabase
    .from('comentario')
    .delete()
    .eq('id_comentario', idComentario);

  if (error) throw error;
  return true;
};

export const mObtenerComentarioPorId = async (idComentario) => {
    const { data, error } = await supabase
        .from('comentario')
        .select('*')
        .eq('id_comentario', idComentario)
        .single();
    
    if (error) throw error;
    return data;
};