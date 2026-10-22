import { pool } from '../db/pool.js';

/**
 * Acceso a datos de usuarios del portal.
 *
 * Solo se seleccionan las columnas necesarias. El `SELECT *` es cómodo pero
 * arrastra columnas sensibles (el hash de la contraseña o el token de sesión)
 * hacia capas que no deberían verlas y rompe el código cuando el esquema cambia.
 */

const PUBLIC_COLUMNS = `
  id_usuario, email_usuario, nombre_usuario, id_rol, activo, creado_en
`;

export async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, clave_hash, token_activo
       FROM usuarios
      WHERE email_usuario = ? AND activo = 1
      LIMIT 1`,
    [email],
  );
  return rows[0] ?? null;
}

/** Incluye `token_activo`, que el middleware compara en cada petición. */
export async function findByIdForAuth(idUsuario) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, token_activo
       FROM usuarios
      WHERE id_usuario = ? AND activo = 1
      LIMIT 1`,
    [idUsuario],
  );
  return rows[0] ?? null;
}

export async function setActiveToken(idUsuario, token) {
  await pool.query('UPDATE usuarios SET token_activo = ? WHERE id_usuario = ?', [
    token,
    idUsuario,
  ]);
}

export async function clearActiveToken(idUsuario) {
  await pool.query('UPDATE usuarios SET token_activo = NULL WHERE id_usuario = ?', [
    idUsuario,
  ]);
}
