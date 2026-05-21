// src/utils/u-mapeo-errores.js
import {
  RecursoNoEncontradoError,
  CredencialesInvalidasError,
  CorreoYaRegistradoError,
  ValidacionError,
  ErrorUsuarioNoEncontrado,
  ErrorActualizacionInvalida,
  ErrorOperacionNoPermitida,
  ErrorReporteNoEncontrado,
  ErrorEstatusInvalido,
  ErrorOperacionReporteNoPermitida,
  ErrorDashboard,
  ErrorMetricasDashboard
} from '../utils/u-errores-dominio.js';

const ERROR_MAP = {
  [CredencialesInvalidasError.name]: 401,
  [CorreoYaRegistradoError.name]: 409,
  [RecursoNoEncontradoError.name]: 404,
  [ValidacionError.name]: 400,
  [ErrorUsuarioNoEncontrado.name]: 404,
  [ErrorActualizacionInvalida.name]: 400,
  [ErrorOperacionNoPermitida.name]: 403,
  [ErrorReporteNoEncontrado.name]: 404,
  [ErrorEstatusInvalido.name]: 400,
  [ErrorOperacionReporteNoPermitida.name]: 403,
  [ErrorDashboard.name]: 500,
  [ErrorMetricasDashboard.name]: 500
};

export { ERROR_MAP };