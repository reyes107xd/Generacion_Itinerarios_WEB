// src/services/s-itinerario.js
import Itinerario from '../models/m-itinerario.js';
import PreferenciasService from '../services/s-preferencias.js';
import { ValidacionError, RecursoNoEncontradoError, DatabaseError } from '../utils/u-errores-dominio.js';
import { generarPDF } from '../utils/u-pdf.js';
import { supabase } from '../config/cf-con-db.js'; // ← ¡IMPORTAR SUPABASE!
import { mContarItinerarios } from '../models/m-itinerario.js';

export const crearItinerario = async (payload) => {
  console.log('Datos recibidos para crear itinerario:', payload);

  try {
    // Validaciones
    if (!payload.titulo || !payload.descripcion) {
      throw new ValidacionError('El título y la descripción son obligatorios.');
    }
    if (!payload.usuarioId) {
      throw new ValidacionError('No se pudo identificar al usuario.');
    }
    if (payload.fecha_inicio > payload.fecha_termino) {
      throw new ValidacionError('La fecha de inicio no puede ser mayor que la fecha de fin.');
    }

    // Primero, crear el itinerario base en la tabla 'itinerario'
    const nuevoItinerario = await Itinerario.crear({
      usuarioId: payload.usuarioId,
      titulo: payload.titulo,
      descripcion: payload.descripcion,
      fecha_inicio: payload.fecha_inicio,
      fecha_termino: payload.fecha_termino,
      privacidad: payload.privacidad,
      estatus: 'borrador'
    });

    // Luego, insertar los lugares por día CON SU ESTADO
    if (payload.dias && Array.isArray(payload.dias)) {
      const filasAInsertar = [];

      payload.dias.forEach((diaObj) => {
        const numeroDia = diaObj.dia;
        const estadoDelDia = diaObj.estado || 'CDMX';

        if (diaObj.lugares && Array.isArray(diaObj.lugares)) {
          diaObj.lugares.forEach((lugar, indexLugar) => {
            filasAInsertar.push({
              id_itinerario: nuevoItinerario.id_itinerario,
              id_lugar: lugar.id || lugar.id_lugar,
              dia: numeroDia,
              orden_visita: indexLugar + 1,
              estado: estadoDelDia // ← ESTADO DEL DÍA
            });
          });
        }
      });

      // Insertar todos los lugares a la vez
      if (filasAInsertar.length > 0) {
        const { error: insertError } = await supabase
          .from('lugar_itinerario')
          .insert(filasAInsertar);

        if (insertError) {
          console.error('Error insertando lugares:', insertError);
          throw new DatabaseError('Error al guardar los lugares del itinerario.');
        }
      }
    }

    // Calcular categoría dominante
    await Itinerario.calcularCategoriaDominante(nuevoItinerario.id_itinerario);

    return nuevoItinerario;

  } catch (error) {
    console.error('Error al crear itinerario (servicio):', error);
    if (error.original) {
      console.error('Error original de Supabase:', error.original);
    }
    throw error;
  }
};


export const obtenerItinerarios = async () => {
  return await Itinerario.obtenerTodos();
};

export const obtenerItinerariosPorUsuario = async (usuarioId) => {
  return await Itinerario.obtenerPorUsuario(usuarioId);
};

export const obtenerItinerarioPorId = async (id) => {
  const itinerario = await Itinerario.obtenerPorId(id);
  if (!itinerario) throw new RecursoNoEncontradoError('El itinerario solicitado no existe.');
  return itinerario;
};

export const eliminarItinerario = async (id) => {
  const existe = await Itinerario.obtenerPorId(id);
  if (!existe) throw new RecursoNoEncontradoError('No se puede eliminar un itinerario inexistente.');
  await Itinerario.eliminar(id);
  return true;
};

export const exportarItinerarioPDF = async (id) => {
  const itinerario = await Itinerario.obtenerPorId(id);
  if (!itinerario) throw new RecursoNoEncontradoError('No se encontró el itinerario para exportar.');
  return await generarPDF(itinerario);
};

export const actualizarItinerario = async (id, campos) => {
  const existe = await Itinerario.obtenerPorId(id);
  if (!existe) throw new RecursoNoEncontradoError('No se puede actualizar un itinerario inexistente.');

  const actualizado = await Itinerario.actualizar(id, campos);

  await Itinerario.calcularCategoriaDominante(id);

  return actualizado;
};

// Guardado de lugares
export const guardarLugaresPorDia = async (id_itinerario, lugares) => {
  for (const lugar of lugares) {
    await Itinerario.agregarLugar(
      id_itinerario,
      lugar.id_lugar,
      lugar.orden_visita ?? 1,
      lugar.dia,
      lugar.estado
    );
  }
};

// Obtener lugares en formato plano
export const obtenerLugaresPorItinerarioId = async (id_itinerario) => {
  const itinerario = await Itinerario.obtenerPorId(id_itinerario);
  if (!itinerario) return [];

  return itinerario.dailyPlan
    ? itinerario.dailyPlan.flatMap(d => d.lugares.map(l => ({ ...l, dia: d.day,  estado: l.estado || 'Desconocido'})))
    : [];
};

/* ---------------------------------------------------------
   🔥 NUEVO: Obtener sugerencias de itinerarios públicos 
      según preferencias del usuario
--------------------------------------------------------- */
export const obtenerSugerenciasItinerarios = async (id_usuario) => {
  const preferencias = await PreferenciasService.getPreferencias(id_usuario);

  if (!preferencias || preferencias.length === 0) {
    return [];
  }

  const itinerarios = await Itinerario.buscarPorCategoriasDominantes(preferencias);
  return itinerarios;
};

export const sContarItinerarios = async (idUsuario) => {
  return await mContarItinerarios(idUsuario);
};