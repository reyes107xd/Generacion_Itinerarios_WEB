
/**
 * REGLAS DE NEGOCIO - ERRORES DE DOMINIO
 * Aquí definimos errores específicos para nuestro dominio de aplicación.
 * 
 * Error de Dominio: Indica que un usuario intenta crear un recurso 
 * que ya existe, violando una restricción de unicidad (e.g., correo).
 */
export class CorreoYaRegistradoError extends Error {
  constructor(message = 'Correo registrado.') {
    super(message);
    this.name = 'CorreoYaRegistradoError';
  }
}

/**
 * Error de Dominio: Indica que las credenciales de inicio de sesión son incorrectas.
 */
export class CredencialesInvalidasError extends Error {
  constructor(message = 'Usuario o contraseña incorrectos.') {
    super(message);
    this.name = 'CredencialesInvalidasError';
  }
}


/**
 * Error de Dominio: Indica que lun recurso solicitado no fue encontrado.
 */
export class RecursoNoEncontradoError extends Error {
    constructor(message = 'El recurso solicitado no fue encontrado.') {
        super(message);
        this.name = 'RecursoNoEncontradoError';
    }
}

export class ValidacionError extends Error {
    constructor(message = 'Datos de entrada inválidos.') {
        super(message);
        this.name = 'ValidacionError';
    }
}

/**
 * Error de Dominio: Indica que el usuario no fue encontrado en la base de datos.
 */
export class ErrorUsuarioNoEncontrado extends Error {
  constructor(mensaje = 'Usuario no encontrado.') {
    super(mensaje);
    this.name = 'ErrorUsuarioNoEncontrado';
  }
}

/**
 * Error de Dominio: Indica que los datos proporcionados para actualizar un usuario son invalidos.
 */
export class ErrorActualizacionInvalida extends Error {
  constructor(mensaje = 'Los datos proporcionados no son válidos.') {
    super(mensaje);
    this.name = 'ErrorActualizacionInvalida';
  }
}

/**
 * Error de Dominio: Indica que el usuario no tiene permiso para realizar una acción específica.
 */
export class ErrorOperacionNoPermitida extends Error {
  constructor(mensaje = 'No tienes permiso para realizar esta acción.') {
    super(mensaje);
    this.name = 'ErrorOperacionNoPermitida';
  }
}

export class DatabaseError extends Error {
  constructor(message = 'Error en la base de datos.') {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Error de Dominio: Indica que un reporte no fue encontrado.
 */
export class ErrorReporteNoEncontrado extends Error {
  constructor(mensaje = 'El reporte no existe.') {
    super(mensaje);
    this.name = 'ErrorReporteNoEncontrado';
  }
}

/**
 * Error de Dominio: Indica que el estatus proporcionado no es válido.
 */
export class ErrorEstatusInvalido extends Error {
  constructor(mensaje = 'El estatus proporcionado no es válido.') {
    super(mensaje);
    this.name = 'ErrorEstatusInvalido';
  }
}

/**
 * Error de Dominio: Indica que la operación no está permitida en el estado actual del reporte.
 */
export class ErrorOperacionReporteNoPermitida extends Error {
  constructor(mensaje = 'Operación no permitida en el estado actual del reporte.') {
    super(mensaje);
    this.name = 'ErrorOperacionReporteNoPermitida';
  }
}

// Agregar estos errores en src/utils/u-errores-dominio.js

/**
 * Error de Dominio: Indica un error en las operaciones del dashboard
 */
export class ErrorDashboard extends Error {
  constructor(mensaje = 'Error en las operaciones del dashboard.') {
    super(mensaje);
    this.name = 'ErrorDashboard';
  }
}

/**
 * Error de Dominio: Indica que no se pudieron obtener las métricas del dashboard
 */
export class ErrorMetricasDashboard extends Error {
  constructor(mensaje = 'Error al obtener métricas del dashboard.') {
    super(mensaje);
    this.name = 'ErrorMetricasDashboard';
  }
}