import { supabase } from '../config/cf-con-db.js';
import { 
  ErrorUsuarioNoEncontrado, 
  ErrorOperacionNoPermitida 
} from '../utils/u-errores-dominio.js';

export class Turista {
  // Función auxiliar para obtener IDs de publicaciones de un usuario
  static async obtenerPublicacionesDelUsuario(idUsuario) {
    const { data: publicaciones } = await supabase
      .from('publicacion')
      .select('id_publicacion')
      .eq('id_turista', idUsuario);
    
    return publicaciones?.map(p => p.id_publicacion).join(',') || '';
  }

  // Función auxiliar para obtener IDs de itinerarios de un usuario
  static async obtenerItinerariosDelUsuario(idUsuario) {
    const { data: itinerarios } = await supabase
      .from('itinerario')
      .select('id_itinerario')
      .eq('id_turista', idUsuario);
    
    return itinerarios?.map(i => i.id_itinerario).join(',') || '';
  }
  
  /**
   * Obtener turistas paginados con información relacionada y filtros
   */


  static async obtenerTuristasPaginados(inicio, limite, filtros = {}) {
    try {
        // PASO 1: Primero obtener los IDs que coinciden con la búsqueda
        let idsCoincidentes = null;
        
        if (filtros.busqueda) {
            const busqueda = `%${filtros.busqueda.trim()}%`;
            
            const { data: resultadosBusqueda, error: errorBusqueda } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('rol', 'turista')
                .or(`correo.ilike.${busqueda}`);
            
            if (errorBusqueda) throw errorBusqueda;
            
            // También buscar en perfiles_usuario
            const { data: perfilesCoincidentes, error: errorPerfiles } = await supabase
                .from('perfil_usuario')
                .select('id_usuario')
                .or(`nombre_usuario.ilike.${busqueda},nombre.ilike.${busqueda},ap_p.ilike.${busqueda},ap_m.ilike.${busqueda}`);
            
            if (errorPerfiles) throw errorPerfiles;
            
            // Combinar todos los IDs
            const idsPorCorreo = resultadosBusqueda?.map(u => u.id_usuario) || [];
            const idsPorPerfil = perfilesCoincidentes?.map(p => p.id_usuario) || [];
            
            idsCoincidentes = [...new Set([...idsPorCorreo, ...idsPorPerfil])];
        }

        // PASO 2: Construir la consulta principal
        let query = supabase
            .from('usuario')
            .select(`
                id_usuario,
                correo,
                esta_verificado,
                fecha_creacion,
                ultima_conexion,
                estado,
                perfil_usuario!inner (
                    nombre,
                    ap_p,
                    ap_m,
                    nombre_usuario,
                    telefono,
                    fecha_nac,
                    genero,
                    foto,
                    descripcion
                ),
                turista!inner (
                    id_turista
                ),
                usuario_bloqueado (
                    fecha_bloqueo,
                    fecha_desbloqueo,
                    duracion,
                    motivo
                )
            `, { count: 'exact' })
            .eq('rol', 'turista');

        // Aplicar filtro de búsqueda por IDs
        if (filtros.busqueda && idsCoincidentes && idsCoincidentes.length > 0) {
            query = query.in('id_usuario', idsCoincidentes);
        } else if (filtros.busqueda && (!idsCoincidentes || idsCoincidentes.length === 0)) {
            // Si hay búsqueda pero no hay resultados, devolver array vacío
            return {
                turistas: [],
                total: 0
            };
        }

        // Aplicar otros filtros
        if (filtros.estado && filtros.estado !== 'todos') {
            query = query.eq('estado', filtros.estado);
        }

        if (filtros.emailVerificado !== undefined) {
          query = query.eq('esta_verificado', filtros.emailVerificado);
        }
        // Ordenar y paginar
        query = query.order('fecha_creacion', { ascending: false });
        const { data: usuarios, error, count } = await query.range(inicio, inicio + limite - 1);

        if (error) throw error;

        // PASO 3: Obtener estadísticas de actividad (tu código existente)
        const turistasConEstadisticas = await Promise.all(
            usuarios.map(async (usuario) => {
                // ... (mantén tu código existente para las estadísticas)
                const perfil = Array.isArray(usuario.perfil_usuario) 
                    ? usuario.perfil_usuario[0] 
                    : usuario.perfil_usuario;

                // Obtener conteo de itinerarios
                const { count: itinerariosCount } = await supabase
                    .from('itinerario')
                    .select('*', { count: 'exact', head: true })
                    .eq('id_turista', usuario.id_usuario);

                // ... resto de tu código para estadísticas
                // Obtener conteo de reportes recibidos - CORREGIDO: usando this.
                const publicacionesIds = await this.obtenerPublicacionesDelUsuario(usuario.id_usuario);
                const itinerariosIds = await this.obtenerItinerariosDelUsuario(usuario.id_usuario);
                
                let reportesRecibidosCount = 0;
                if (publicacionesIds || itinerariosIds) {
                  const { count } = await supabase
                    .from('reporte')
                    .select('*', { count: 'exact', head: true })
                    .or(`id_publicacion_reportada.in.(${publicacionesIds}),id_itinerario_reportado.in.(${itinerariosIds})`);
                  reportesRecibidosCount = count || 0;
                }

                // Obtener conteo de reportes hechos
                const { count: reportesHechosCount } = await supabase
                  .from('reporte')
                  .select('*', { count: 'exact', head: true })
                  .eq('id_turista_reporta', usuario.id_usuario);

                return {
                    id_usuario: usuario.id_usuario,
                    correo: usuario.correo,
                    esta_verificado: usuario.esta_verificado,
                    fecha_creacion: usuario.fecha_creacion,
                    ultima_conexion: usuario.ultima_conexion,
                    estado: usuario.estado,
                    nombre: perfil?.nombre || '',
                    ap_p: perfil?.ap_p || '',
                    ap_m: perfil?.ap_m || '',
                    nombre_usuario: perfil?.nombre_usuario || '',
                    telefono: perfil?.telefono || '',
                    fecha_nac: perfil?.fecha_nac || '',
                    genero: perfil?.genero || '',
                    foto: perfil?.foto || '',
                    descripcion: perfil?.descripcion || '',
                    esta_bloqueado: usuario.estado === 'bloqueado',
                    bloqueo_info: Array.isArray(usuario.usuario_bloqueado) 
                        ? usuario.usuario_bloqueado[0] 
                        : usuario.usuario_bloqueado,
                    itinerarios_creados: itinerariosCount || 0,
                    reportes_recibidos: reportesRecibidosCount || 0,
                    reportes_hechos: reportesHechosCount || 0
                };
            })
        );

        return {
            turistas: turistasConEstadisticas,
            total: count || 0
        };

    } catch (error) {
        console.error('Error en obtenerTuristasPaginados:', error);
        throw new Error('Error al obtener turistas de la base de datos');
    }
}

  /**
   * Obtener un turista por ID
   */
  static async obtenerPorId(idUsuario) {
    const { data: usuario, error } = await supabase
      .from('usuario')
      .select(`
        id_usuario,
        correo,
        esta_verificado,
        fecha_creacion,
        ultima_conexion,
        estado,
        rol,
        perfil_usuario (
          nombre,
          ap_p,
          ap_m,
          nombre_usuario,
          telefono,
          fecha_nac,
          genero,
          foto,
          descripcion
        ),
        turista (
          id_turista
        ),
        usuario_bloqueado (
          fecha_bloqueo,
          fecha_desbloqueo,
          duracion,
          motivo,
          id_admin_bloqueador
        )
      `)
      .eq('id_usuario', idUsuario)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ErrorUsuarioNoEncontrado();
      }
      console.error('Error en obtenerPorId:', error);
      throw new Error('Error al obtener el turista');
    }

    if (!usuario.turista) {
      throw new ErrorUsuarioNoEncontrado('El usuario no es un turista');
    }

    return {
      id_usuario: usuario.id_usuario,
      correo: usuario.correo,
      esta_verificado: usuario.esta_verificado,
      fecha_creacion: usuario.fecha_creacion,
      ultima_conexion: usuario.ultima_conexion,
      estado: usuario.estado,
      rol: usuario.rol,
      nombre: usuario.perfil_usuario?.nombre || '',
      ap_p: usuario.perfil_usuario?.ap_p || '',
      ap_m: usuario.perfil_usuario?.ap_m || '',
      nombre_usuario: usuario.perfil_usuario?.nombre_usuario || '',
      telefono: usuario.perfil_usuario?.telefono || '',
      fecha_nac: usuario.perfil_usuario?.fecha_nac || '',
      genero: usuario.perfil_usuario?.genero || '',
      foto: usuario.perfil_usuario?.foto || '',
      descripcion: usuario.perfil_usuario?.descripcion || '',
      bloqueo_info: usuario.usuario_bloqueado?.[0] || null
    };
  }

  /**
   * Obtener estadísticas de turistas
   */
  static async obtenerEstadisticas() {
    try {
      // Total de turistas
      const { count: total, error: errorTotal } = await supabase
        .from('usuario')
        .select('*', { count: 'exact', head: true })
        .eq('rol', 'turista');

      if (errorTotal) throw errorTotal;

      // Turistas activos
      const { count: activos, error: errorActivos } = await supabase
        .from('usuario')
        .select('*', { count: 'exact', head: true })
        .eq('rol', 'turista')
        .eq('estado', 'activo');

      if (errorActivos) throw errorActivos;

      // Turistas bloqueados
      const { count: bloqueados, error: errorBloqueados } = await supabase
        .from('usuario')
        .select('*', { count: 'exact', head: true })
        .eq('rol', 'turista')
        .eq('estado', 'bloqueado');

      if (errorBloqueados) throw errorBloqueados;

      // Turistas verificados
      const { count: verificados, error: errorVerificados } = await supabase
        .from('usuario')
        .select('*', { count: 'exact', head: true })
        .eq('rol', 'turista')
        .eq('esta_verificado', true);

      if (errorVerificados) throw errorVerificados;

      // Nuevos hoy
      const hoy = new Date().toISOString().split('T')[0];
      const { count: nuevosHoy, error: errorNuevosHoy } = await supabase
        .from('usuario')
        .select('*', { count: 'exact', head: true })
        .eq('rol', 'turista')
        .gte('fecha_creacion', `${hoy}T00:00:00`)
        .lte('fecha_creacion', `${hoy}T23:59:59`);

      if (errorNuevosHoy) throw errorNuevosHoy;

      return {
        total: total || 0,
        activos: activos || 0,
        bloqueados: bloqueados || 0,
        verificados: verificados || 0,
        nuevosHoy: nuevosHoy || 0
      };

    } catch (error) {
      console.error('Error en obtenerEstadisticas:', error);
      throw new Error('Error al obtener estadísticas de turistas');
    }
  }

  /**
   * Bloquear un turista
   */
  static async bloquear(idUsuario, duracion, motivo, idAdmin) {
    const client = await supabase;
    
    try {
      // Calcular fecha de desbloqueo
      let fechaDesbloqueo = null;
      const fechaBloqueo = new Date();

      switch (duracion) {
        case '3_dias':
          fechaDesbloqueo = new Date(fechaBloqueo);
          fechaDesbloqueo.setDate(fechaDesbloqueo.getDate() + 3);
          break;
        case '1_semana':
          fechaDesbloqueo = new Date(fechaBloqueo);
          fechaDesbloqueo.setDate(fechaDesbloqueo.getDate() + 7);
          break;
        case '1_mes':
          fechaDesbloqueo = new Date(fechaBloqueo);
          fechaDesbloqueo.setMonth(fechaDesbloqueo.getMonth() + 1);
          break;
        case '1_anio':
          fechaDesbloqueo = new Date(fechaBloqueo);
          fechaDesbloqueo.setFullYear(fechaDesbloqueo.getFullYear() + 1);
          break;
        case 'permanente':
          fechaDesbloqueo = null;
          break;
      }

      // Actualizar estado del usuario
      const { error: errorUsuario } = await supabase
        .from('usuario')
        .update({ estado: 'bloqueado' })
        .eq('id_usuario', idUsuario);

      if (errorUsuario) throw errorUsuario;

      // Insertar registro de bloqueo
      const { data: bloqueo, error: errorBloqueo } = await supabase
        .from('usuario_bloqueado')
        .insert({
          id_usuario: idUsuario,
          fecha_bloqueo: fechaBloqueo.toISOString(),
          fecha_desbloqueo: fechaDesbloqueo ? fechaDesbloqueo.toISOString() : null,
          duracion: duracion,
          motivo: motivo,
          id_admin_bloqueador: idAdmin,
          estado: 'activo'
        })
        .select()
        .single();

      if (errorBloqueo) throw errorBloqueo;

      // Obtener usuario actualizado
      const usuarioActualizado = await this.obtenerPorId(idUsuario);
      return usuarioActualizado;

    } catch (error) {
      console.error('Error en bloquear:', error);
      throw new Error('Error al bloquear el turista');
    }
  }

  /**
   * Desbloquear un turista
   */
  static async desbloquear(idUsuario, idAdmin) {
    try {
      // Actualizar estado del usuario
      const { error: errorUsuario } = await supabase
        .from('usuario')
        .update({ estado: 'activo' })
        .eq('id_usuario', idUsuario);

      if (errorUsuario) throw errorUsuario;

      // Actualizar registro de bloqueo
      const { error: errorBloqueo } = await supabase
        .from('usuario_bloqueado')
        .update({
          estado: 'levantado',
          fecha_desbloqueo: new Date().toISOString()
        })
        .eq('id_usuario', idUsuario)
        .eq('estado', 'activo');

      if (errorBloqueo) throw errorBloqueo;

      // Obtener usuario actualizado
      const usuarioActualizado = await this.obtenerPorId(idUsuario);
      return usuarioActualizado;

    } catch (error) {
      console.error('Error en desbloquear:', error);
      throw new Error('Error al desbloquear el turista');
    }
  }
}