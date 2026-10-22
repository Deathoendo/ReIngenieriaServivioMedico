import * as authService from '../services/auth.service.js';
import * as v from '../validate.js';

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(req, res) {
  const email = v.asEmail(req.body?.email, 'email', { required: true });
  const password = v.asString(req.body?.password, 'password', { required: true, max: 200 });

  const resultado = await authService.login(email, password);
  res.status(200).json({ success: true, data: resultado });
}

/**
 * POST /api/auth/logout
 * Cierra la sesión activa del usuario autenticado.
 */
export async function logout(req, res) {
  await authService.logout(req.user.id);
  res.status(200).json({ success: true, message: 'Sesión cerrada correctamente.' });
}

/**
 * GET /api/auth/me
 * Devuelve la identidad de la sesión vigente.
 *
 * Va en el backend y no se resuelve con el contenido del JWT porque el cliente
 * no debe ser la fuente de verdad de sus propios permisos: si un administrador
 * cambia el rol, `/me` refleja el cambio en la siguiente petición.
 */
export async function me(req, res) {
  res.status(200).json({ success: true, data: req.user });
}
