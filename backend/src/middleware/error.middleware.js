import { AppError } from '../errors.js';
import { config } from '../config.js';

/** Ruta no encontrada. Se registra después de todas las rutas reales. */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Manejador central de errores.
 *
 * Un solo lugar decide la forma de toda respuesta de error, así que el cliente
 * siempre recibe el mismo contrato: { success, code, message, details? }.
 * En producción no se filtra el stack ni los detalles internos.
 */
// eslint-disable-next-line no-unused-vars -- Express identifica el handler de error por su aridad
export function errorHandler(err, req, res, next) {
  const isAppError = err instanceof AppError;
  const status = isAppError ? err.status : err.status || 500;

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} ->`, err);
  }

  const body = {
    success: false,
    code: isAppError ? err.code : 'INTERNAL_ERROR',
    message:
      isAppError || config.env !== 'production'
        ? err.message
        : 'Ocurrió un error inesperado en el servidor.',
  };

  if (isAppError && err.details) body.details = err.details;
  if (config.env !== 'production' && !isAppError) body.stack = err.stack;

  res.status(status).json(body);
}

/**
 * Envuelve un controlador async para que sus rechazos lleguen al errorHandler.
 * Sin esto, una promesa rechazada en Express 4 queda sin manejar y la petición
 * se cuelga hasta el timeout.
 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
