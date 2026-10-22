/**
 * Error de aplicación con código HTTP asociado.
 *
 * Por qué existe: sin esto, cada controlador decide a mano qué status devolver y
 * el manejo termina disperso e inconsistente. Con AppError, los servicios lanzan
 * errores con intención y el middleware de errores los traduce a HTTP en un solo lugar.
 */
export class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

export const badRequest = (message, details) =>
  new AppError(message, 400, 'BAD_REQUEST', details);

export const unauthorized = (message = 'No autorizado') =>
  new AppError(message, 401, 'UNAUTHORIZED');

export const forbidden = (message = 'No tienes permisos para esta acción') =>
  new AppError(message, 403, 'FORBIDDEN');

export const notFound = (message = 'Recurso no encontrado') =>
  new AppError(message, 404, 'NOT_FOUND');

export const conflict = (message) => new AppError(message, 409, 'CONFLICT');
