import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { unauthorized } from '../errors.js';

/**
 * Genera el token de sesión del usuario.
 *
 * El `jti` (identificador único del token) es lo que permite la sesión única por
 * usuario: se persiste en la base de datos y se compara en cada petición, de modo
 * que un login nuevo invalida el token anterior de forma inmediata.
 */
export function issueToken(user) {
  return jwt.sign(
    {
      sub: String(user.id_usuario),
      email: user.email_usuario,
      nombre: user.nombre_usuario,
      rol: user.id_rol,
    },
    config.auth.jwtSecret,
    {
      expiresIn: config.auth.jwtExpiresIn,
      issuer: 'servicio-medico-api',
      audience: 'portal-servicio-medico',
      jwtid: crypto.randomUUID(),
    },
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.auth.jwtSecret, {
      issuer: 'servicio-medico-api',
      audience: 'portal-servicio-medico',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw unauthorized('La sesión expiró. Inicia sesión nuevamente.');
    }
    throw unauthorized('Token inválido.');
  }
}

/** Extrae el token de `Authorization: Bearer <token>` o del header legado `x-access-token`. */
export function extractToken(headers) {
  const raw = headers.authorization || headers['x-access-token'];
  if (!raw) return null;
  return raw.startsWith('Bearer ') ? raw.slice(7).trim() : raw.trim();
}
