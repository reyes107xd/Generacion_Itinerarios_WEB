import { 
  ErrorUsuarioNoEncontrado, 
  ErrorOperacionNoPermitida,
  ValidacionError 
} from "../utils/u-errores-dominio.js";
import { Turista } from "../models/m-a-turistas.js";

/**
 * Obtener turistas paginados con filtros
 */
export const obtenerTuristasPaginados = async (pagina = 1, limite = 10, filtros = {}) => {
    const inicio = (pagina - 1) * limite;
    
    // Validar parámetros de paginación
    if (pagina < 1 || limite < 1) {
        throw new ValidacionError('Los parámetros de paginación deben ser números positivos');
    }

    if (limite > 100) {
        throw new ValidacionError('El límite no puede ser mayor a 100');
    }

    // Transformar filtros del frontend al formato del modelo
    const filtrosTransformados = transformarFiltros(filtros);
    
    // Pasar los filtros transformados al modelo
    const resultado = await Turista.obtenerTuristasPaginados(inicio, limite, filtrosTransformados);
    
    const totalPaginas = Math.ceil(resultado.total / limite);

    return {
        turistas: resultado.turistas,
        paginaActual: pagina,
        totalPaginas,
        totalTuristas: resultado.total
    };
};

// Función para transformar filtros del frontend al formato del modelo
function transformarFiltros(filtros) {
    const transformados = {};
    
    // Filtro de estado
    if (filtros.estado && filtros.estado !== 'todos') {
        transformados.estado = filtros.estado;
    }
    
    // Filtro de verificación - CORREGIDO
    if (filtros.verificacion && filtros.verificacion !== 'todos') {
        // Si viene como 'verificado'/'no-verificado'
        transformados.emailVerificado = filtros.verificacion === 'verificado';
    } else if (filtros.emailVerificado !== undefined) {
        // Si ya viene como 'true'/'false' (string)
        transformados.emailVerificado = filtros.emailVerificado === 'true';
    }
    
    // Filtro de búsqueda
    if (filtros.busqueda) {
        transformados.busqueda = filtros.busqueda;
    }
    
    return transformados;
}

/**
 * Obtener estadísticas de turistas
 */
export const obtenerEstadisticasTuristas = async () => {
  const estadisticas = await Turista.obtenerEstadisticas();
  return estadisticas;
};

/**
 * Bloquear un turista
 */
export const bloquearTurista = async (idTurista, duracion, motivo, idAdmin) => {
  // Validar que el ID sea un número válido
  if (!idTurista || isNaN(idTurista)) {
    throw new ValidacionError('ID de turista no válido');
  }

  // Validar duración
  const duracionesValidas = ['3_dias', '1_semana', '1_mes', '1_anio', 'permanente'];
  if (!duracion || !duracionesValidas.includes(duracion)) {
    throw new ValidacionError(
      `Duración de bloqueo no válida. Los valores permitidos son: ${duracionesValidas.join(', ')}`
    );
  }

  const idTuristaNum = parseInt(idTurista);

  // Verificar que el turista existe y obtener datos actuales
  const turistaActual = await Turista.obtenerPorId(idTuristaNum);
  
  // Validar que no esté ya bloqueado
  if (turistaActual.estado === 'bloqueado') {
    throw new ErrorOperacionNoPermitida('El turista ya está bloqueado');
  }

  // Validar que sea un turista (no admin)
  if (turistaActual.rol !== 'turista') {
    throw new ErrorOperacionNoPermitida('Solo se pueden bloquear usuarios turistas');
  }

  // Bloquear turista
  const turistaActualizado = await Turista.bloquear(
    idTuristaNum, 
    duracion, 
    motivo, 
    idAdmin
  );

  return turistaActualizado;
};

/**
 * Desbloquear un turista
 */
export const desbloquearTurista = async (idTurista, idAdmin) => {
  // Validar que el ID sea un número válido
  if (!idTurista || isNaN(idTurista)) {
    throw new ValidacionError('ID de turista no válido');
  }

  const idTuristaNum = parseInt(idTurista);

  // Verificar que el turista existe y obtener datos actuales
  const turistaActual = await Turista.obtenerPorId(idTuristaNum);

  // Validar que esté bloqueado
  if (turistaActual.estado !== 'bloqueado') {
    throw new ErrorOperacionNoPermitida('El turista no está bloqueado');
  }

  // Validar que sea un turista (no admin)
  if (turistaActual.rol !== 'turista') {
    throw new ErrorOperacionNoPermitida('Solo se pueden desbloquear usuarios turistas');
  }

  // Desbloquear turista
  const turistaActualizado = await Turista.desbloquear(idTuristaNum, idAdmin);

  return turistaActualizado;
};