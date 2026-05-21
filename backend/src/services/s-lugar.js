// src/services/s-lugar.js

import { supabase } from '../config/cf-con-db.js';

/**
 * Obtiene lugares con ranking basado en puntaje y votaciones
 * Prioriza lugares con al menos 50 votaciones
 */

export const obtenerLugares = async (filtros = {}) => {
  try {
    const { estado, categoria, busqueda, limite = 50 } = filtros;
    
    // Construir query base
    let query = supabase
      .from('lugar')
      .select(`
        id_lugar,
        nombre,
        foto,
        ubicacion,
        latitud,
        longitud,
        estado,
        puntaje,
        votaciones,
        categoria,
        horario,
        identificador
      `)
      .eq('aprobado', true);
    
    // Aplicar filtros
    if (estado) {
    const estadoNormalizado = estado
        .replace(/cdmx/i, 'Ciudad de Mexico')
        .replace(/edomex/i, 'Estado de Mexico');
    query = query.eq('estado', estadoNormalizado);
    }


    const mapaCategorias = {
    'Parques': 'park',
    'Museos': 'museum',
    'Zoológicos': 'zoo',
    'Atracciones turísticas': 'tourist_attraction',
    'Atracciones turisticas': 'tourist_attraction' // sin tilde
    };


    const categoriaBD = mapaCategorias[categoria] || categoria;

    if (categoriaBD && categoriaBD !== '' && categoriaBD.toLowerCase() !== 'todas' && categoriaBD.toLowerCase() !== 'todos') {
    query = query.ilike('categoria', `%${categoriaBD}%`);
    }


    
    if (busqueda && busqueda !== '') {
      query = query.ilike('nombre', `%${busqueda}%`);
    }
    
    // Ejecutar query
    const { data, error } = await query.limit(parseInt(limite));
    
    if (error) throw error;
    
    // Calcular score y ordenar en JavaScript
    const lugaresConScore = data.map(lugar => ({
      ...lugar,
      score_calculado: lugar.votaciones >= 50 
        ? lugar.puntaje * 2 
        : lugar.puntaje * (lugar.votaciones / 50.0)
    }));
    
    // Ordenar por score, votaciones y puntaje
    lugaresConScore.sort((a, b) => {
      if (b.score_calculado !== a.score_calculado) {
        return b.score_calculado - a.score_calculado;
      }
      if (b.votaciones !== a.votaciones) {
        return b.votaciones - a.votaciones;
      }
      return b.puntaje - a.puntaje;
    });
    
    return lugaresConScore;
    
  } catch (error) {
    console.error('Error en obtenerLugares:', error);
    throw error;
  }
};

/**
 * Obtiene lugares destacados (mínimo 50 votaciones)
 */
export const obtenerLugaresDestacados = async (limite = 10) => {
  try {
    const { data, error } = await supabase
      .from('lugar')
      .select(`
        id_lugar,
        nombre,
        foto,
        ubicacion,
        latitud,
        longitud,
        estado,
        puntaje,
        votaciones,
        categoria
      `)
      .eq('aprobado', true)
      .gte('votaciones', 50)
      .order('puntaje', { ascending: false })
      .order('votaciones', { ascending: false })
      .limit(parseInt(limite));
    
    if (error) throw error;
    return data;
    
  } catch (error) {
    console.error('Error en obtenerLugaresDestacados:', error);
    throw error;
  }
};

/**
 * Obtiene un lugar específico por ID
 */
export const obtenerLugarPorId = async (idLugar) => {
  try {
    const { data, error } = await supabase
      .from('lugar')
      .select('*')
      .eq('id_lugar', idLugar)
      .eq('aprobado', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw error;
    }
    
    return data;
    
  } catch (error) {
    console.error('Error en obtenerLugarPorId:', error);
    throw error;
  }
};

/**
 * Obtiene todas las categorías disponibles
 */
export const obtenerCategorias = async () => {
  try {
    const { data, error } = await supabase
      .from('categoria')
      .select('id_categoria, nombre')
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    
    // Contar lugares por categoría (opcional)
    const categoriasConConteo = await Promise.all(
      data.map(async (cat) => {
        const { count } = await supabase
          .from('lugar_categoria')
          .select('id_lugar', { count: 'exact', head: true })
          .eq('id_categoria', cat.id_categoria);
        
        return {
          ...cat,
          cantidad_lugares: count || 0
        };
      })
    );
    
    return categoriasConConteo;
    
  } catch (error) {
    console.error('Error en obtenerCategorias:', error);
    throw error;
  }
};