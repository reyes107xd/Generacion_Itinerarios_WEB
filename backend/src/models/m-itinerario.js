// src/models/m-itinerario.js
import { supabase } from '../config/cf-con-db.js';
import { DatabaseError } from '../utils/u-errores-dominio.js';

const Itinerario = {
  // =====================================================
  // CREAR ITINERARIO
  // =====================================================
  async crear({ usuarioId, privacidad, titulo, descripcion, fecha_inicio, fecha_termino, estatus = 'borrador' }) {
    const payload = {
      id_turista: usuarioId,
      titulo,
      descripcion,
      fecha_inicio,
      fecha_termino,
      privacidad,
      estatus
    };

    const { data, error } = await supabase
      .from('itinerario')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      const dbErr = new DatabaseError('No se pudo crear el itinerario.');
      dbErr.original = error;
      throw dbErr;
    }

    return data;
  },

  // =====================================================
  // OBTENER TODOS
  // =====================================================
  async obtenerTodos() {
    const { data, error } = await supabase
      .from('itinerario')
      .select(`
        *,
        usuario (
          perfil_usuario ( nombre, ap_p,foto, nombre_usuario )
        )
      `)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data;
  },

  // =====================================================
  // OBTENER POR USUARIO
  // =====================================================
  async obtenerPorUsuario(usuarioId) {
    const { data, error } = await supabase
      .from('itinerario')
      .select(`
        *,
        lugares: lugar_itinerario(
          orden_visita,
          dia,
          lugar: lugar (
            id_lugar,
            nombre,
            foto,
            ubicacion,
            latitud,
            longitud,
            categoria,
            estado
          )
        )
      `)
      .eq('id_turista', usuarioId)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;

    const itinerariosConLugares = data.map(itin => {
      const grouped = {};
      let totalLugares = 0;

      if (itin.lugares && Array.isArray(itin.lugares)) {
        itin.lugares.forEach(l => {
          if (!grouped[l.dia]) grouped[l.dia] = [];
          grouped[l.dia].push({ orden: l.orden_visita, ...l.lugar, estado: l.estado || l.lugar.estado });
          totalLugares++;
        });
      }

      const dailyPlan = Object.keys(grouped)
        .sort((a, b) => a - b)
        .map(dia => ({
          day: parseInt(dia),
          lugares: grouped[dia]
        }));

      return {
        ...itin,
        dailyPlan,
        totalLugares
      };
    });

    return itinerariosConLugares;
  },

  // =====================================================
  // OBTENER POR ID
  // =====================================================
  async obtenerPorId(id_itinerario) {
    const { data: itin, error: errItin } = await supabase
      .from('itinerario')
      .select('*')
      .eq('id_itinerario', id_itinerario)
      .maybeSingle();

    if (errItin) throw errItin;
    if (!itin) return null;

    const { data: lugares, error: errLugares } = await supabase
      .from('lugar_itinerario')
      .select(`
        orden_visita,
        dia,
        lugar: lugar (
          id_lugar,
          nombre,
          foto,
          ubicacion,
          latitud,
          longitud,
          categoria,
          estado
        )
      `)
      .eq('id_itinerario', id_itinerario)
      .order('orden_visita', { ascending: true });

    if (errLugares) throw errLugares;

    const grouped = {};
    lugares.forEach(l => {
      if (!grouped[l.dia]) grouped[l.dia] = [];
      grouped[l.dia].push({ orden: l.orden_visita, ...l.lugar, estado: l.estado || l.lugar.estado });
    });

    const dailyPlan = Object.keys(grouped)
      .sort((a, b) => a - b)
      .map(dia => ({
        day: parseInt(dia),
        lugares: grouped[dia]
      }));

    return { ...itin, dailyPlan };
  },

  // =====================================================
  // ACTUALIZAR ITINERARIO + LUGARES
  // =====================================================
  async actualizar(id_itinerario, campos) {
    const payload = {};

    const allowed = ['titulo', 'descripcion', 'fecha_inicio', 'fecha_termino', 'estatus', 'privacidad'];
    for (const k of allowed) {
      if (k in campos) payload[k] = campos[k];
    }

    if (Object.keys(payload).length > 0) {
      const { error } = await supabase
        .from('itinerario')
        .update(payload)
        .eq('id_itinerario', id_itinerario);

      if (error) throw error;
    }

    // Actualizar lugares (borrar y reinsertar)
    if (campos.dias && Array.isArray(campos.dias)) {

      const { error: deleteError } = await supabase
        .from('lugar_itinerario')
        .delete()
        .eq('id_itinerario', id_itinerario);

      if (deleteError) throw deleteError;

      const filasAInsertar = [];

      campos.dias.forEach((diaObj, indexDia) => {
        const numeroDia = diaObj.dia || (indexDia + 1);
        const estadoDelDia = diaObj.estado || 'CDMX'; // ← OBTENER ESTADO DEL DÍA

        if (diaObj.lugares && diaObj.lugares.length > 0) {
          diaObj.lugares.forEach((lugar, indexLugar) => {
            filasAInsertar.push({
              id_itinerario,
              id_lugar: lugar.id || lugar.id_lugar,
              dia: numeroDia,
              orden_visita: indexLugar + 1,
              estado: estadoDelDia // ← GUARDAR ESTADO EN CADA REGISTRO
            });
          });
        }
      });

      if (filasAInsertar.length > 0) {
        const { error: insertError } = await supabase
          .from('lugar_itinerario')
          .insert(filasAInsertar);

        if (insertError) throw insertError;
      }
    }

    return await this.obtenerPorId(id_itinerario);
  },

  // =====================================================
  // ELIMINAR
  // =====================================================
  async eliminar(id_itinerario) {
    try {
      // PRIMERO: Verificar si hay publicaciones asociadas
      const { data: publicaciones, error: errorBuscar } = await supabase
        .from('publicacion')
        .select('id_publicacion, foto')
        .eq('id_itinerario', id_itinerario);

      if (errorBuscar) {
        console.error('Error al buscar publicaciones:', errorBuscar);
        throw errorBuscar;
      }

      // Si hay publicaciones, actualizarlas
      if (publicaciones && publicaciones.length > 0) {
        // Actualizar cada publicación según tenga fotos o no
        for (const pub of publicaciones) {
          const nuevoTipo = pub.foto && Array.isArray(pub.foto) && pub.foto.length > 0 ? 'foto' : 'normal';

          const { error: errorActualizar } = await supabase
            .from('publicacion')
            .update({
              id_itinerario: null,
              tipo_publicacion: nuevoTipo
            })
            .eq('id_publicacion', pub.id_publicacion);

          if (errorActualizar) {
            console.error(`Error al actualizar publicación ${pub.id_publicacion}:`, errorActualizar);
            throw errorActualizar;
          }
        }
      }

      // SEGUNDO: Eliminar relaciones en lugar_itinerario
      const { error: errRel } = await supabase
        .from('lugar_itinerario')
        .delete()
        .eq('id_itinerario', id_itinerario);

      if (errRel) {
        console.error('Error al eliminar lugares del itinerario:', errRel);
        throw errRel;
      }

      // TERCERO: Eliminar el itinerario
      const { error } = await supabase
        .from('itinerario')
        .delete()
        .eq('id_itinerario', id_itinerario);

      if (error) {
        console.error('Error al eliminar itinerario:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error completo en eliminar itinerario:', error);
      throw error;
    }
  },
  // =====================================================
  // AUXILIARES LUGARES
  // =====================================================
  async agregarLugar(id_itinerario, id_lugar, orden_visita, dia, estado = 'CDMX') {
    const { data, error } = await supabase
      .from('lugar_itinerario')
      .insert({
        id_itinerario,
        id_lugar,
        orden_visita,
        dia,
        estado
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async eliminarLugar(id_itinerario, id_lugar) {
    const { error } = await supabase
      .from('lugar_itinerario')
      .delete()
      .match({ id_itinerario, id_lugar });

    if (error) throw error;
    return true;
  },

  // =====================================================
  // ⭐ CALCULAR CATEGORÍA DOMINANTE (USANDO lugar_categoria)
  // =====================================================
  async calcularCategoriaDominante(id_itinerario) {
    // 1) obtener todos los id_lugar del itinerario
    const { data: lugaresItin, error: errLugItin } = await supabase
      .from('lugar_itinerario')
      .select('id_lugar')
      .eq('id_itinerario', id_itinerario);

    if (errLugItin) throw errLugItin;

    if (!lugaresItin || lugaresItin.length === 0) {
      const { error: updErr } = await supabase
        .from('itinerario')
        .update({ categoria_dominante: null })
        .eq('id_itinerario', id_itinerario);
      if (updErr) throw updErr;
      return null;
    }

    const idsLugares = [...new Set(lugaresItin.map(l => l.id_lugar))];

    const { data: categorias, error: errCat } = await supabase
      .from('lugar_categoria')
      .select('id_lugar, id_categoria')
      .in('id_lugar', idsLugares);

    if (errCat) throw errCat;

    const conteo = {};
    lugaresItin.forEach(lug => {
      const filaCat = categorias.find(c => c.id_lugar === lug.id_lugar);
      if (!filaCat || !filaCat.id_categoria) return;
      const cat = filaCat.id_categoria;
      conteo[cat] = (conteo[cat] || 0) + 1;
    });

    if (Object.keys(conteo).length === 0) {
      const { error: updErr } = await supabase
        .from('itinerario')
        .update({ categoria_dominante: null })
        .eq('id_itinerario', id_itinerario);
      if (updErr) throw updErr;
      return null;
    }

    let categoriaDominante = null;
    let max = 0;
    Object.entries(conteo).forEach(([cat, count]) => {
      if (count > max) {
        max = count;
        categoriaDominante = Number(cat);
      }
    });

    const { error: updateError } = await supabase
      .from('itinerario')
      .update({ categoria_dominante: categoriaDominante })
      .eq('id_itinerario', id_itinerario);

    if (updateError) throw updateError;

    return categoriaDominante;
  },

  // =====================================================
  // ⭐ NUEVO: BUSCAR POR CATEGORÍAS DOMINANTES
  // =====================================================
  async buscarPorCategoriasDominantes(categoriasIds) {
    if (!categoriasIds || categoriasIds.length === 0) {
      return [];
    }

    // Primero, obtener los itinerarios
    const { data: itinerarios, error } = await supabase
      .from('itinerario')
      .select('*')
      .in('categoria_dominante', categoriasIds)
      .eq('privacidad', false)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;

    // Obtener IDs únicos de turistas
    const turistaIds = [...new Set(itinerarios.map(it => it.id_turista))];

    // Obtener nombres de usuarios desde perfil_usuario
    const { data: perfiles, error: perfilesError } = await supabase
      .from('perfil_usuario')
      .select('id_usuario, nombre_usuario')
      .in('id_usuario', turistaIds);

    if (perfilesError) {
      console.error("Error obteniendo perfiles:", perfilesError);
      // Continuar sin nombres de usuarios
    }

    // Crear un mapa de ID de usuario → nombre
    const usuarioMap = {};
    (perfiles || []).forEach(perfil => {
      usuarioMap[perfil.id_usuario] = perfil.nombre_usuario;
    });

    // Formatear la respuesta
    const itinerariosFormateados = itinerarios.map(it => {
      const nombreUsuario = usuarioMap[it.id_turista] || 'Usuario';

      return {
        id_itinerario: it.id_itinerario,
        titulo: it.titulo,
        descripcion: it.descripcion,
        fecha_inicio: it.fecha_inicio,
        fecha_termino: it.fecha_termino,
        categoria_dominante: it.categoria_dominante,
        id_creador: it.id_turista,
        creador_nombre: nombreUsuario
      };
    });

    return itinerariosFormateados || [];
  }
};

export default Itinerario;

export const mContarItinerarios = async (idGenerico) => {
  try {
    let idTuristaFinal = null;
    const { data: esTurista } = await supabase
      .from('turista')
      .select('id_turista')
      .eq('id_turista', idGenerico)
      .maybeSingle();

    if (esTurista) {
      idTuristaFinal = idGenerico;
    } else {
      const { data: esUsuario } = await supabase
        .from('turista')
        .select('id_turista')
        .eq('id_usuario', idGenerico)
        .maybeSingle();

      if (esUsuario) {
        idTuristaFinal = esUsuario.id_turista;
      } else {
        console.log(`No se encontró ningún registro para ID ${idGenerico}`);
      }
    }

    if (!idTuristaFinal) return 0;

    // Conteo Real
    const { count, error } = await supabase
      .from('itinerario')
      .select('*', { count: 'exact', head: true })
      .eq('id_turista', idTuristaFinal);

    if (error) throw error;
    return count || 0;

  } catch (error) {
    console.error("Error backend conteo:", error.message);
    throw error;
  }
};