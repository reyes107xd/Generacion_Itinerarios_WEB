import { supabase } from '../config/cf-con-db.js';
import { ErrorReporteNoEncontrado } from '../utils/u-errores-dominio.js';

export class Reporte {
  
  /**
   * Obtener reportes paginados con información relacionada
   */
  static async obtenerReportesPaginados(inicio, limite, filtros = {}) {
    let query = supabase
      .from('reporte')
      .select(`
        *,
        turista_reporta:id_turista_reporta (
          id_turista,
          usuario:usuario!turista_id_turista_fkey (
             id_usuario,
             correo,
             perfil_usuario ( nombre, ap_p, ap_m, nombre_usuario )
          )
        ),
        admin_asignado:id_admin_asignado (
          id_administrador,
          usuario:usuario!administrador_id_administrador_fkey (
             id_usuario,
             correo,
             perfil_usuario ( nombre, ap_p, ap_m )
          )
        ),
        publicacion_reportada:id_publicacion_reportada (
          id_publicacion,
          titulo,
          tipo_publicacion
        ),
        itinerario_reportado:id_itinerario_reportado (
          id_itinerario,
          titulo
        )
      `, { count: 'exact' });

    // --- Filtros ---
    if (filtros.estatus) query = query.eq('estatus', filtros.estatus);
    if (filtros.tipo) query = query.eq('tipo_reporte', filtros.tipo);
    if (filtros.fecha) {
      const hoy = new Date();
      switch (filtros.fecha) {
        case 'antiguos': query = query.order('fecha_reporte', { ascending: true }); break;
        case 'hoy':
          const inicioDia = new Date(hoy.setHours(0, 0, 0, 0)).toISOString();
          const finDia = new Date(hoy.setHours(23, 59, 59, 999)).toISOString();
          query = query.gte('fecha_reporte', inicioDia).lte('fecha_reporte', finDia);
          break;
        case 'semana':
          const inicioSemana = new Date(hoy.setDate(hoy.getDate() - 7)).toISOString();
          query = query.gte('fecha_reporte', inicioSemana);
          break;
        case 'mes':
          const inicioMes = new Date(hoy.setMonth(hoy.getMonth() - 1)).toISOString();
          query = query.gte('fecha_reporte', inicioMes);
          break;
        default: query = query.order('fecha_reporte', { ascending: false });
      }
    } else {
      query = query.order('fecha_reporte', { ascending: false });
    }

    const { data: reportes, error, count } = await query.range(inicio, inicio + limite - 1);

    if (error) {
      console.error('DB Error obtenerReportesPaginados:', error.message);
      throw new Error('Error al obtener reportes');
    }

    return { reportes: reportes || [], total: count || 0 };
  }

  /**
   * Obtener un reporte por ID
   * CORRECCIÓN: Se eliminó 'foto' de itinerario_reportado
   */

static async obtenerPorId(idReporte) {
  try {
    // 1. Obtener reporte básico
    const { data: reporte, error: errorReporte } = await supabase
      .from('reporte')
      .select('*')
      .eq('id_reporte', idReporte)
      .single();

    if (errorReporte) throw errorReporte;

    // 2. Obtener turista que reporta
    if (reporte.id_turista_reporta) {
      const { data: turistaData, error: errorTurista } = await supabase
        .from('turista')
        .select(`
          id_turista,
          usuario (
            id_usuario,
            correo,
            perfil_usuario ( nombre, ap_p, ap_m, nombre_usuario, foto )
          )
        `)
        .eq('id_turista', reporte.id_turista_reporta)
        .single();

      if (!errorTurista) {
        reporte.turista_reporta = turistaData;
      }
    }

    // 3. Obtener publicación si existe
    if (reporte.id_publicacion_reportada) {
      const { data: publicacionData, error: errorPublicacion } = await supabase
        .from('publicacion')
        .select('*')
        .eq('id_publicacion', reporte.id_publicacion_reportada)
        .single();

      if (!errorPublicacion && publicacionData) {
        // Obtener autor de la publicación
        const { data: autorPublicacion } = await supabase
          .from('turista')
          .select(`
            id_turista,
            usuario (
              id_usuario,
              correo,
              perfil_usuario ( nombre_usuario, nombre, ap_p, ap_m, foto )
            )
          `)
          .eq('id_turista', publicacionData.id_turista)
          .single();

        if (autorPublicacion) {
          publicacionData.turista = autorPublicacion;
        }

        reporte.publicacion_reportada = publicacionData;
      }
    }

    // 4. Obtener comentario si existe
    if (reporte.id_comentario_reportado) {
      const { data: comentarioData, error: errorComentario } = await supabase
        .from('comentario')
        .select('*')
        .eq('id_comentario', reporte.id_comentario_reportado)
        .single();

      if (!errorComentario && comentarioData) {
        // Obtener autor del comentario
        const { data: autorComentario } = await supabase
          .from('turista')
          .select(`
            id_turista,
            usuario (
              id_usuario,
              correo,
              perfil_usuario ( nombre_usuario, nombre, ap_p, ap_m, foto )
            )
          `)
          .eq('id_turista', comentarioData.id_turista)
          .single();

        if (autorComentario) {
          comentarioData.turista = autorComentario;
        }

        // Obtener publicación del comentario si existe
        if (comentarioData.id_publicacion) {
          const { data: publicacionComentario } = await supabase
            .from('publicacion')
            .select('id_publicacion, titulo, descripcion, tipo_publicacion, foto, fecha_publicacion')
            .eq('id_publicacion', comentarioData.id_publicacion)
            .single();

          if (publicacionComentario) {
            comentarioData.publicacion = publicacionComentario;
          }
        }

        reporte.comentario_reportado = comentarioData;
      }
    }

    // 5. Obtener itinerario si existe (similar a publicación)
    if (reporte.id_itinerario_reportado) {
      const { data: itinerarioData, error: errorItinerario } = await supabase
        .from('itinerario')
        .select('*')
        .eq('id_itinerario', reporte.id_itinerario_reportado)
        .single();

      if (!errorItinerario && itinerarioData) {
        // Obtener autor del itinerario
        const { data: autorItinerario } = await supabase
          .from('turista')
          .select(`
            id_turista,
            usuario (
              id_usuario,
              correo,
              perfil_usuario ( nombre_usuario, nombre, ap_p, ap_m, foto )
            )
          `)
          .eq('id_turista', itinerarioData.id_turista)
          .single();

        if (autorItinerario) {
          itinerarioData.turista = autorItinerario;
        }

        reporte.itinerario_reportado = itinerarioData;
      }
    }

    return reporte;

  } catch (error) {
    console.error('DB Error obtenerPorId:', error.message);
    if (error.code === 'PGRST116') throw new ErrorReporteNoEncontrado();
    throw new Error('Error al obtener el detalle del reporte');
  }
}

  /**
   * Actualizar estatus
   */
  static async actualizarEstatus(idReporte, estatus, idAdmin) {
    const { error: updateError } = await supabase
      .from('reporte')
      .update({ estatus: estatus, id_admin_asignado: idAdmin })
      .eq('id_reporte', idReporte);

    if (updateError) {
      console.error('DB Error Update:', updateError.message);
      throw new Error('Error al actualizar estatus');
    }

    return await this.obtenerPorId(idReporte);
  }

  static async eliminar(idReporte) {
    const { error } = await supabase
      .from('reporte')
      .delete()
      .eq('id_reporte', idReporte);

    if (error) {
      console.error('DB Error Delete:', error.message);
      throw new Error('Error al eliminar');
    }
    return true;
  }

  static async existe(idReporte) {
    const { data, error } = await supabase
      .from('reporte')
      .select('id_reporte')
      .eq('id_reporte', idReporte)
      .single();
    if (error && error.code !== 'PGRST116') return false;
    return !!data;
  }
}