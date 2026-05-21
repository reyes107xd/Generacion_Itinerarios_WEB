import { supabase } from '../config/cf-con-db.js';
import { DatabaseError } from '../utils/u-errores-dominio.js';

export class Notificacion {
  
  static async obtenerNotificacionesAdminM(pagina = 1, limite = 10, filtros = {}) {
    try {
      const offset = (pagina - 1) * limite;
      
      // Construir query base
      let query = supabase
        .from('notificacion')
        .select('*')
        .eq('para_admin', true)
        .order('fecha_creacion', { ascending: false })
        .range(offset, offset + limite - 1);

      // Aplicar filtros dinámicamente
      if (filtros.tipo && filtros.tipo !== 'todos') {
        query = query.eq('tipo', filtros.tipo);
      }

      if (filtros.leida === 'leidas') {
        query = query.eq('leida', true);
      } else if (filtros.leida === 'noLeidas') {
        query = query.eq('leida', false);
      }

      if (filtros.busqueda && filtros.busqueda.trim() !== '') {
        const busqueda = `%${filtros.busqueda.trim()}%`;
        query = query.or(`titulo.ilike.${busqueda},mensaje.ilike.${busqueda}`);
      }

      const { data: notificaciones, error } = await query;

      if (error) throw error;

      // Obtener total para paginación
      const { count, error: countError } = await supabase
        .from('notificacion')
        .select('*', { count: 'exact', head: true })
        .eq('para_admin', true);

      if (countError) throw countError;

      return {
        notificaciones: notificaciones || [],
        total: count || 0,
        totalPaginas: Math.ceil((count || 0) / limite)
      };

    } catch (error) {
      console.error('Error en obtenerNotificacionesAdminM:', error);
      throw new DatabaseError('Error al obtener notificaciones');
    }
  }

  /**
   * Buscar notificación por ID
   */
  static async buscarPorIdM(idNotificacion) {
    try {
      const { data, error } = await supabase
        .from('notificacion')
        .select('*')
        .eq('id_notificacion', idNotificacion)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en buscarPorIdM:', error);
      throw new DatabaseError('Error al buscar notificación por ID');
    }
  }

  /**
   * Marcar notificación como leída
   */
  static async marcarComoLeidaM(idNotificacion) {
    try {
      const { data, error } = await supabase
        .from('notificacion')
        .update({ leida: true })
        .eq('id_notificacion', idNotificacion)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en marcarComoLeidaM:', error);
      throw new DatabaseError('Error al marcar notificación como leída');
    }
  }

  /**
   * Eliminar notificación
   */
  static async eliminarM(idNotificacion) {
    try {
      const { error } = await supabase
        .from('notificacion')
        .delete()
        .eq('id_notificacion', idNotificacion);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error en eliminarM:', error);
      throw new DatabaseError('Error al eliminar notificación');
    }
  }
}