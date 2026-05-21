// Asegúrate de que esta importación trae el objeto 'supabase' desde tu archivo de conexión
import { supabase } from '../config/cf-con-db.js'; 

// Crear una nueva notificación en la DB
export const createNotificationDB = async ({ id_turista, tipo, titulo, mensaje, enlace }) => {
    // 1. Usar .from().insert({})
    const { data, error } = await supabase
        .from('notificacion')
        .insert({ 
            id_turista, 
            tipo, 
            titulo, 
            mensaje, 
            enlace 
        })
        .select('*') // Para obtener el registro recién insertado (equivalente a RETURNING *)
        .single(); // Para devolver un solo objeto en lugar de un array

    if (error) {
        console.error('Error al crear notificación en Supabase:', error);
        throw error;
    }
    
    // Supabase devuelve el objeto directamente en 'data'
    return data;
};

// Obtener el listado y el conteo de no leídas
export const getNotificationsByTuristaIdDB = async (id_turista) => {
    // 1. Obtener el listado de notificaciones (SELECT, WHERE, ORDER BY, LIMIT)
    const { data: list, error: listError } = await supabase
        .from('notificacion')
        .select('id_notificacion, tipo, titulo, mensaje, enlace, leida, fecha_creacion') 
        .eq('id_turista', id_turista) // WHERE id_turista = $1
        .order('fecha_creacion', { ascending: false }) // ORDER BY fecha_creacion DESC
        .limit(20); // LIMIT 20

    if (listError) {
        console.error('Error al obtener lista de notificaciones:', listError);
        throw listError;
    }

    // 2. Obtener el conteo de no leídas (SELECT COUNT(*))
    // Se usa el modificador { count: 'exact', head: true } para obtener solo el conteo sin datos.
    const { count: unreadCount, error: countError } = await supabase
        .from('notificacion')
        .select('*', { count: 'exact', head: true }) 
        .eq('id_turista', id_turista)
        .eq('leida', false);

    if (countError) {
        console.error('Error al obtener conteo de notificaciones no leídas:', countError);
        throw countError;
    }

    // Supabase devuelve la lista en 'list' y el conteo en 'unreadCount' (ya como número)
    return { 
        list: list, 
        unreadCount: unreadCount 
    };
};

// Marcar como leída (Comando)
export const markAsReadDB = async (id_notificacion, id_turista) => {
    // Usar .from().update({}).eq().select().single()
    const { data, error } = await supabase
        .from('notificacion')
        .update({ leida: true }) // SET leida = TRUE
        .eq('id_notificacion', id_notificacion) // WHERE id_notificacion = $1
        .eq('id_turista', id_turista) // AND id_turista = $2
        .select('*') // RETURNING *
        .single(); // Devuelve el objeto actualizado

    if (error) {
        console.error('Error al marcar notificación como leída:', error);
        throw error;
    }
    
    return data;
};

// Eliminar todas las notificaciones de un usuario
export const deleteAllNotificationsDB = async (id_turista) => {
    const { error } = await supabase
        .from('notificacion')
        .delete()
        .eq('id_turista', id_turista);

    if (error) {
        console.error('Error al eliminar notificaciones:', error);
        throw error;
    }
    
    return { success: true, message: 'Notificaciones eliminadas' };
};


export const mCrearNotificacion = async (datosNotificacion) => {
  try {
    const { data, error } = await supabase
      .from('notificacion')
      .insert(datosNotificacion)
      .select()
      .single();

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Error en mCrearNotificacion:', error.message);
    throw error;
  }
};