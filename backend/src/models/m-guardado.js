import { supabase } from '../config/cf-con-db.js';

// Guardar (Insertar o Quitar)
export const mToggleGuardado = async ({ id_turista, id_publicacion, id_itinerario_guardado }, accion) => {
  const datosOperacion = { id_turista };
  if (id_publicacion) datosOperacion.id_publicacion = id_publicacion;
  if (id_itinerario_guardado) datosOperacion.id_itinerario_guardado = id_itinerario_guardado;

  try {
    if (accion === 'guardar') {
      const { data: existente } = await supabase
        .from('guardado')
        .select('id_guardado')
        .match(datosOperacion)
        .maybeSingle();

      if (existente) return { message: 'Ya estaba guardado' };

      const { error } = await supabase.from('guardado').insert(datosOperacion);
      if (error) throw error;
      return { message: 'Guardado exitosamente' };

    } else {
      const { error } = await supabase.from('guardado').delete().match(datosOperacion);
      if (error) throw error;
      return { message: 'Eliminado de guardados' };
    }
  } catch (error) {
    console.error("Error en mToggleGuardado:", error.message);
    throw error;
  }
};

// Obtener IDs
export const mObtenerIdsGuardados = async (idTurista) => {
  try {
    const { data, error } = await supabase
      .from('guardado')
      .select('id_publicacion, id_itinerario_guardado')
      .eq('id_turista', idTurista);

    if (error) throw error;

    const ids = [];
    data.forEach(row => {
      if (row.id_publicacion) ids.push(row.id_publicacion);
      if (row.id_itinerario_guardado) ids.push(row.id_itinerario_guardado);
    });
    return ids;
  } catch (error) {
    console.error('Error obteniendo IDs guardados:', error.message);
    return [];
  }
};

// Obtener Lista Completa (CORREGIDO: RELACIÓN USUARIO)
export const mObtenerListaGuardados = async (idTurista) => {
  try {
    const { data, error } = await supabase
      .from('guardado')
      .select(`
        fecha_guardado,
        id_publicacion,
        id_itinerario_guardado,
        
        publicacion (
          id_publicacion, 
          titulo, 
          descripcion, 
          tipo_publicacion, 
          foto, 
          id_itinerario, 
          fecha_publicacion, 
          privacidad,
          id_turista,
          
          
          autor:usuario ( 
            id_usuario, 
            perfil_usuario ( nombre, ap_p, foto, nombre_usuario ) 
          ),
          
          reaccion ( count ),
          comentario ( count ),

          
          itinerario (
            titulo,
            creador:usuario ( 
               perfil_usuario ( nombre, ap_p ) 
            )
          )
        ),
        
        
        itinerario_guardado:itinerario (
           id_itinerario, titulo, descripcion, fecha_inicio, fecha_termino,
           creador:usuario ( perfil_usuario ( nombre, ap_p, foto, nombre_usuario ) )
        )
      `)
      .eq('id_turista', idTurista)
      .order('fecha_guardado', { ascending: false });

    if (error) throw error;
    
    // Filtrar nulos
    return data.filter(item => item.publicacion !== null || item.itinerario_guardado !== null);

  } catch (error) {
    console.error('Error obteniendo lista de guardados:', error.message);
    throw error;
  }
};