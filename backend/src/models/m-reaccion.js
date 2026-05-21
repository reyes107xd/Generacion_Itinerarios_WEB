import { supabase } from '../config/cf-con-db.js';

export const mDarLike = async (idPublicacion, idTurista) => {
  try {
    const { data, error } = await supabase
      .from('reaccion')
      .insert({
        id_publicacion: idPublicacion,
        id_turista: idTurista
      })
      .select()
      .single();

    if (error && error.code === '23505') {
      return { message: 'Ya habías dado like a esta publicación.' };
    }

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Error en mDarLike:', error.message);
    throw error;
  }
};

export const mQuitarLike = async (idPublicacion, idTurista) => {
  try {
    const { error } = await supabase
      .from('reaccion')
      .delete()
      .match({ 
        id_publicacion: idPublicacion, 
        id_turista: idTurista 
      });

    if (error) throw error;
    return true;

  } catch (error) {
    console.error('Error en mQuitarLike:', error.message);
    throw error;
  }
};

export const mContarLikes = async (idPublicacion) => {
  try {
    const { count, error } = await supabase
      .from('reaccion')
      .select('*', { count: 'exact', head: true }) 
      .eq('id_publicacion', idPublicacion);

    if (error) throw error;
    return count;

  } catch (error) {
    console.error('Error en mContarLikes:', error.message);
    throw error;
  }
};

export const mObtenerIdsLikesPorTurista = async (idTurista) => {
  try {
    const { data, error } = await supabase
      .from('reaccion')
      .select('id_publicacion')
      .eq('id_turista', idTurista);

    if (error) throw error;
    // Devuelve un array simple
    return data.map(r => r.id_publicacion);
  } catch (error) {
    console.error('Error en mObtenerIdsLikesPorTurista:', error.message);
    throw error;
  }
};

export const mObtenerPublicacionesConLikePorTurista = async (idTurista) => {
  try {
    const { data, error } = await supabase
      .from('reaccion')
      .select(`
        publicacion (
          id_publicacion,
          titulo,
          descripcion,
          tipo_publicacion,
          foto,
          id_itinerario,
            usuario (
              perfil_usuario (
                nombre,
                ap_p,
                foto,
                nombre_usuario
              )
            )
          ),
          reaccion ( count )
        )
      `)
      .eq('id_turista', idTurista);

    if (error) throw error;

    return data.map(item => item.publicacion).filter(p => p !== null);

  } catch (error) {
    console.error('Error al obtener favoritos completos:', error.message);
    throw error;
  }
};