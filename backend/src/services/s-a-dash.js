// src/services/s-a-dashboard.js
import { DatabaseError } from "../utils/u-errores-dominio.js";
import { Dashboard } from "../models/m-a-dash.js";

/**
 * Obtener estadísticas principales del dashboard
 */
export const obtenerEstadisticasPrincipalesS = async () => {
  try {
    // Obtener todas las métricas en paralelo para mejor performance
    const [
      metricasPrincipales,
      estadisticasUsuarios
    ] = await Promise.all([
      Dashboard.obtenerMetricasPrincipalesM(),
      Dashboard.obtenerEstadisticasUsuariosM()
    ]);

    // Calcular tendencias (en un sistema real, esto vendría de datos históricos)
    const tendencias = await Dashboard.calcularTendenciasM();

    return {
      metricasPrincipales,
      estadisticasUsuarios,
      tendencias
    };

  } catch (error) {
    console.error('Error en obtenerEstadisticasPrincipales:', error);
    throw new DatabaseError('Error al obtener estadísticas del dashboard');
  }
};

/**
 * Obtener métricas en tiempo real para actualización
 */
export const obtenerMetricasTiempoRealS = async () => {
  try {
    // Obtener solo las métricas que cambian frecuentemente
    const metricas = await Dashboard.obtenerMetricasTiempoRealM();
    return metricas;

  } catch (error) {
    console.error('Error en obtenerMetricasTiempoReal:', error);
    throw new DatabaseError('Error al obtener métricas en tiempo real');
  }
};

/**
 * Obtener datos para gráfica de registro de usuarios
 */
export const obtenerDatosRegistroUsuariosS = async (periodo = '30dias') => {
  try {
    // Validar período
    const periodosValidos = ['7dias', '30dias', '90dias'];
    if (!periodosValidos.includes(periodo)) {
      periodo = '30dias'; // Valor por defecto
    }

    const datos = await Dashboard.obtenerDatosRegistroUsuariosM(periodo);
    return datos;

  } catch (error) {
    console.error('Error en obtenerDatosRegistroUsuarios:', error);
    throw new DatabaseError('Error al obtener datos de registro de usuarios');
  }
};

/**
 * Obtener datos para gráfica de distribución de reportes
 */
export const obtenerDistribucionReportesS = async () => {
  try {
    const distribucion = await Dashboard.obtenerDistribucionReportesM();
    return distribucion;

  } catch (error) {
    console.error('Error en obtenerDistribucionReportes:', error);
    throw new DatabaseError('Error al obtener distribución de reportes');
  }
};