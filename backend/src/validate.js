import { badRequest } from './errors.js';

/**
 * Validación de entrada sin dependencias externas.
 *
 * Se mantiene deliberadamente pequeña: cada validador devuelve el valor ya
 * convertido o lanza un `AppError` 400 con el campo que falló. El objetivo es que
 * ninguna cadena arbitraria llegue a la base de datos y que los mensajes sean
 * accionables para quien consume la API.
 *
 * Frontera de confianza: `req.body`, `req.query` y `req.params` son datos NO
 * confiables. Los repositorios usan consultas parametrizadas, y esta capa es la
 * que decide qué forma tiene lo que se acepta.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function asString(value, field, { required = false, max = 255, min = 1 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw badRequest(`El campo "${field}" es obligatorio`, { field });
    return null;
  }
  const text = String(value).trim();
  if (text.length < min) {
    throw badRequest(`El campo "${field}" debe tener al menos ${min} caracteres`, { field });
  }
  if (text.length > max) {
    throw badRequest(`El campo "${field}" supera el máximo de ${max} caracteres`, { field });
  }
  return text;
}

export function asInt(value, field, { required = false, min = -2147483648, max = 2147483647 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw badRequest(`El campo "${field}" es obligatorio`, { field });
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw badRequest(`El campo "${field}" debe ser un número entero`, { field });
  }
  if (parsed < min || parsed > max) {
    throw badRequest(`El campo "${field}" debe estar entre ${min} y ${max}`, { field });
  }
  return parsed;
}

export function asDecimal(value, field, { required = false, min = 0, max = 100000 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw badRequest(`El campo "${field}" es obligatorio`, { field });
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    throw badRequest(`El campo "${field}" debe ser numérico`, { field });
  }
  if (parsed < min || parsed > max) {
    throw badRequest(`El campo "${field}" debe estar entre ${min} y ${max}`, { field });
  }
  return parsed;
}

export function asDate(value, field, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw badRequest(`El campo "${field}" es obligatorio`, { field });
    return null;
  }
  const text = String(value).slice(0, 10);
  if (!ISO_DATE.test(text)) {
    throw badRequest(`El campo "${field}" debe tener el formato AAAA-MM-DD`, { field });
  }
  // Descarta fechas con forma válida pero inexistentes (por ejemplo 2026-02-30).
  const parsed = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
    throw badRequest(`El campo "${field}" no es una fecha válida`, { field });
  }
  return text;
}

export function asEmail(value, field, { required = false } = {}) {
  const text = asString(value, field, { required, max: 120 });
  if (text && !EMAIL.test(text)) {
    throw badRequest(`El campo "${field}" no es un correo válido`, { field });
  }
  return text;
}

export function asBoolean(value, field) {
  if (value === undefined || value === null || value === '') return false;
  if (typeof value === 'boolean') return value;
  const text = String(value).toLowerCase();
  if (['true', '1', 'si', 'sí'].includes(text)) return true;
  if (['false', '0', 'no'].includes(text)) return false;
  throw badRequest(`El campo "${field}" debe ser booleano`, { field });
}

/** Valida la lista de diagnósticos de una consulta. */
export function asDiagnosticos(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw badRequest('El campo "diagnosticos" debe ser una lista', { field: 'diagnosticos' });
  }
  if (value.length > 20) {
    throw badRequest('Una consulta no puede tener más de 20 diagnósticos', {
      field: 'diagnosticos',
    });
  }
  return value.map((item, index) => ({
    diagnostico: asInt(item?.diagnostico, `diagnosticos[${index}].diagnostico`, {
      required: true,
      min: 1,
    }),
    patologia: asInt(item?.patologia, `diagnosticos[${index}].patologia`, { min: 1 }),
    especialidad: asInt(item?.especialidad, `diagnosticos[${index}].especialidad`, { min: 1 }),
  }));
}

/** Cédula venezolana: opcionalmente con prefijo V/E/J, guion y dígitos. */
export function asCedula(value, field = 'cedula', { required = false } = {}) {
  const text = asString(value, field, { required, max: 15 });
  if (!text) return null;
  if (!/^[VEJvej]-?\d{6,9}$/.test(text)) {
    throw badRequest(
      `El campo "${field}" debe ser una cédula válida (ejemplo: V-10000001)`,
      { field },
    );
  }
  const digits = text.replace(/^[VEJvej]-?/, '');
  const prefix = text.replace(/[\d-]/g, '').toUpperCase() || 'V';
  return `${prefix}-${digits}`;
}
