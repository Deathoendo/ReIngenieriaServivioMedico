import { extractToken, verifyToken } from '../auth/tokens.js';
import * as usuarios from '../repositories/usuario.repository.js';
import { unauthorized } from '../errors.js';

/**
 * Verifica que la petición traiga un token válido y vigente.
 *
 * Además de la firma del JWT se comprueba que el token siga siendo el ACTIVO del
 * usuario en la base de datos. Eso da sesión única: al iniciar sesión en otro
 * dispositivo, el token anterior se invalida de inmediato aunque todavía no haya
 * expirado. Un JWT por sí solo no se puede revocar; esta columna resuelve eso.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req.headers);
    if (!token) {
      throw unauthorized('No se proporcionó un token de sesión.');
    }

    const payload = verifyToken(token);
    const usuario = await usuarios.findByIdForAuth(Number(payload.sub));

    if (!usuario) {
      throw unauthorized('La cuenta ya no está activa.');
    }
    if (usuario.token_activo !== token) {
      throw unauthorized('La sesión se inició en otro dispositivo o fue cerrada.');
    }

    req.user = {
      id: usuario.id_usuario,
      email: usuario.email_usuario,
      nombre: usuario.nombre_usuario,
      rol: usuario.id_rol,
    };
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Restringe una ruta a ciertos roles.
 * Roles: 1 = Administrador, 2 = Médico, 3 = Analista.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(unauthorized());
    }
    if (!roles.includes(Number(req.user.rol))) {
      return next(
        Object.assign(new Error('No tienes permisos para esta acción'), {
          status: 403,
          code: 'FORBIDDEN',
        }),
      );
    }
    return next();
  };
}
