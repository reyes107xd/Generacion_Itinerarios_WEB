// src/models/m-a-dashboard.js
import { supabase } from '../config/cf-con-db.js';
import { DatabaseError } from '../utils/u-errores-dominio.js';

export class Dashboard {
  
  /**
   * Obtener métricas principales del dashboard
   */
  static async obtenerMetricasPrincipalesM() {
    try {
      // Obtener todas las métricas en paralelo
      const [
        totalUsuarios,
        usuariosActivos,
        totalPublicaciones,
        totalItinerarios,
        totalSitios,
        reportesPendientes
      ] = await Promise.all([
        // Total de usuarios
        this.contarUsuarios(),
        
        // Usuarios activos (últimos 30 días)
        this.contarUsuariosActivos(),
        
        // Total de publicaciones activas
        this.contarPublicacionesActivas(),
        
        // Total de itinerarios activos
        this.contarItinerariosActivos(),
        
        // Total de sitios turísticos aprobados
        this.contarSitiosAprobados(),
        
        // Reportes pendientes
        this.contarReportesPendientes()
      ]);

      return {
        totalUsuarios,
        usuariosActivos,
        totalPublicaciones,
        totalItinerarios,
        totalSitios,
        reportesPendientes
      };

    } catch (error) {
      console.error('Error en obtenerMetricasPrincipalesM:', error);
      throw new DatabaseError('Error al obtener métricas');
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  static async obtenerEstadisticasUsuariosM() {
    try {
      const [
        nuevosHoy,
        nuevosEstaSemana,
        tasaActividad
      ] = await Promise.all([
        // Nuevos usuarios hoy
        this.contarUsuariosNuevosHoy(),
        
        // Nuevos usuarios esta semana
        this.contarUsuariosNuevosEstaSemana(),
        
        // Tasa de actividad (simplificada)
        this.calcularTasaActividad()
      ]);

      return {
        nuevosHoy,
        nuevosEstaSemana,
        tasaActividad
      };

    } catch (error) {
      console.error('Error en obtenerEstadisticasUsuariosM:', error);
      throw new DatabaseError('Error al obtener estadísticas de usuarios');
    }
  }

  /**
   * Obtener métricas en tiempo real
   */
  static async obtenerMetricasTiempoRealM() {
    try {
      const [
        reportesPendientes,
        nuevosHoy
      ] = await Promise.all([
        this.contarReportesPendientes(),
        this.contarUsuariosNuevosHoy()
      ]);

      return {
        reportesPendientes,
        nuevosHoy
      };

    } catch (error) {
      console.error('Error en obtenerMetricasTiempoRealM:', error);
      throw new DatabaseError('Error al obtener métricas');
    }
  }

  /**
   * Obtener datos para gráfica de registro de usuarios
   */
 /**
 * Obtener datos para gráfica de registro de usuarios - CON DEBUG DETALLADO
 */
static async obtenerDatosRegistroUsuariosM(periodo = '30dias') {
  try {
    let fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 30); // Últimos 30 días
    fechaInicio.setHours(0, 0, 0, 0);
    
    const fechaFin = new Date();
    fechaFin.setHours(23, 59, 59, 999);

    // Obtener todos los usuarios en el rango con fechas completas
    const { data: usuarios, error } = await supabase
      .from('usuario')
      .select('fecha_creacion, id_usuario')
      .gte('fecha_creacion', fechaInicio.toISOString())
      .lte('fecha_creacion', fechaFin.toISOString())
      .order('fecha_creacion', { ascending: true });

    if (error) throw error;


    usuarios.forEach(usuario => {
      const fechaUTC = new Date(usuario.fecha_creacion);
      const fechaLocal = new Date(fechaUTC.getTime() - (fechaUTC.getTimezoneOffset() * 60000));
      
      
    });

    // Procesar datos corregidos por zona horaria
    const registrosPorFecha = [];
    const currentDate = new Date(fechaInicio);
    
    while (currentDate <= fechaFin) {
      const fechaLocalStr = currentDate.toLocaleDateString('es-MX');
      
      const cantidad = usuarios.filter(usuario => {
        const fechaUsuarioUTC = new Date(usuario.fecha_creacion);
        // Convertir UTC a local
        const fechaUsuarioLocal = new Date(fechaUsuarioUTC.getTime() - (fechaUsuarioUTC.getTimezoneOffset() * 60000));
        const fechaUsuarioStr = fechaUsuarioLocal.toLocaleDateString('es-MX');
        
        return fechaUsuarioStr === fechaLocalStr;
      }).length;

      registrosPorFecha.push({
        fecha: new Date(currentDate),
        cantidad
      });


      currentDate.setDate(currentDate.getDate() + 1);
    }

    const labels = registrosPorFecha.map(item => 
      item.fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    );
    const data = registrosPorFecha.map(item => item.cantidad);


    return { labels, data };

  } catch (error) {
    console.error('Error en obtenerDatosRegistroUsuariosM:', error);
    throw new DatabaseError('Error al obtener datos de registro de usuarios');
  }
}

  /**
   * Obtener distribución de reportes por estatus
   */
    static async obtenerDistribucionReportesM() {
    try {
      // Obtener todos los reportes primero
      const { data: reportes, error } = await supabase
        .from('reporte')
        .select('estatus');

      if (error) {
        console.error('Error en obtenerDistribucionReportesM:', error);
        throw new DatabaseError('Error al obtener distribución de reportes');
      }

      // Si no hay reportes, retornar datos vacíos
      if (!reportes || reportes.length === 0) {
        return {
          labels: ['Pendientes', 'Resueltos', 'Rechazados'],
          data: [0, 0, 0, 0]
        };
      }

      // Agrupar manualmente por estatus
      const conteo = {
        'pendiente': 0,
        'resuelto': 0,
        'rechazado': 0
      };
      
      // Contar reportes por estatus
      reportes.forEach(reporte => {
        if (conteo.hasOwnProperty(reporte.estatus)) {
          conteo[reporte.estatus]++;
        }
      });

      // Mapear los estatus a labels más legibles
      const labelsMap = {
        'pendiente': 'Pendientes',
        'resuelto': 'Resueltos',
        'rechazado': 'Rechazados'
      };

      const labels = [];
      const data = [];

      // Crear arrays para la gráfica
      Object.entries(conteo).forEach(([estatus, cantidad]) => {
        labels.push(labelsMap[estatus] || estatus);
        data.push(cantidad);
      });

      return {
        labels,
        data
      };

    } catch (error) {
      console.error('Error en obtenerDistribucionReportesM:', error);
      throw new DatabaseError('Error al obtener distribución de reportes');
    }
  }

  /**
   * Calcular tendencias (simplificado - datos de ejemplo)
   */
  static async calcularTendenciasM() {
    // En un sistema real, esto calcularía tendencias basadas en datos históricos
    // Por ahora retornamos datos de ejemplo
    return {
      usuarios: { tendencia: 'up', porcentaje: 12 },
      publicaciones: { tendencia: 'up', porcentaje: 8 },
      itinerarios: { tendencia: 'down', porcentaje: 3 },
      reportes: { tendencia: 'down', porcentaje: 5 }
    };
  }

  // ========== MÉTODOS AUXILIARES ==========

  /**
   * Contar total de usuarios
   */
  static async contarUsuarios() {
    const { count, error } = await supabase
      .from('usuario')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }

  /**
   * Contar usuarios activos (últimos 30 días)
   */
  static async contarUsuariosActivos() {
    const fechaLimite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const { count, error } = await supabase
      .from('usuario')
      .select('*', { count: 'exact', head: true })
      .gte('ultima_conexion', fechaLimite.toISOString());

    if (error) throw error;
    return count || 0;
  }

  /**
   * Contar publicaciones activas
   */
  static async contarPublicacionesActivas() {
    const { count, error } = await supabase
      .from('publicacion')
      .select('*', { count: 'exact', head: true })
      .eq('estatus', 'publicado');

    if (error) throw error;
    return count || 0;
  }

  /**
   * Contar itinerarios activos
   */
  static async contarItinerariosActivos() {
    const { count, error } = await supabase
      .from('itinerario')
      .select('*', { count: 'exact', head: true })

    if (error) throw error;
    return count || 0;
  }

  /**
   * Contar sitios aprobados
   */
  static async contarSitiosAprobados() {
    const { count, error } = await supabase
      .from('lugar')
      .select('*', { count: 'exact', head: true })


    if (error) throw error;
    return count || 0;
  }

  /**
   * Contar reportes pendientes
   */
  static async contarReportesPendientes() {
    const { count, error } = await supabase
      .from('reporte')
      .select('*', { count: 'exact', head: true })
      .eq('estatus', 'pendiente');

    if (error) throw error;
    return count || 0;
  }

  /**
   * Contar usuarios nuevos hoy
   */
    static async contarUsuariosNuevosHoy() {
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0, 0);
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);
    
    const { count, error } = await supabase
        .from('usuario')
        .select('*', { count: 'exact', head: true })
        .gte('fecha_creacion', inicioDia.toISOString())
        .lte('fecha_creacion', finDia.toISOString());

    if (error) {
        console.error('Error contarUsuariosNuevosHoy:', error);
        throw error;
    }
    return count || 0;
}

  /**
   * Contar usuarios nuevos esta semana
   */
  static async contarUsuariosNuevosEstaSemana() {
    const inicioSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const { count, error } = await supabase
      .from('usuario')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_creacion', inicioSemana.toISOString());

    if (error) throw error;
    return count || 0;
  }

  /**
   * Calcular tasa de actividad (simplificada)
   */
  static async calcularTasaActividad() {
    const totalUsuarios = await this.contarUsuarios();
    const usuariosActivos = await this.contarUsuariosActivos();
    
    if (totalUsuarios === 0) return 0;
    
    return Math.round((usuariosActivos / totalUsuarios) * 100);
  }

  /**
   * Agrupar registros por día
   */
  static agruparRegistrosPorDia(registros, fechaInicio, fechaFin) {
  if (!Array.isArray(registros)) {
    registros = [];
  }

  const registrosPorDia = [];
  const currentDate = new Date(fechaInicio);
  
  console.log('Agrupando registros desde:', fechaInicio, 'hasta:', fechaFin); // DEBUG
  console.log('Total registros a agrupar:', registros.length); // DEBUG
  
  // Crear array con todas las fechas en el rango
  while (currentDate <= fechaFin) {
    const fechaStr = currentDate.toISOString().split('T')[0];
    
    const cantidad = registros.filter(registro => {
      if (!registro || !registro.fecha_creacion) return false;
      
      try {
        const registroFecha = new Date(registro.fecha_creacion);
        const registroFechaStr = registroFecha.toISOString().split('T')[0];
        return registroFechaStr === fechaStr;
      } catch (e) {
        console.error('Error procesando fecha:', registro?.fecha_creacion, e);
        return false;
      }
    }).length;
    
    registrosPorDia.push({
      fecha: new Date(currentDate),
      cantidad
    });
    
    // DEBUG: Mostrar cada día procesado
    if (cantidad > 0) {
      console.log(`Día ${fechaStr}: ${cantidad} registros`);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log('Resultado final agrupación:', registrosPorDia); // DEBUG
  return registrosPorDia;
}
}