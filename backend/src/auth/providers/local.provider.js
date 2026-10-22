import bcrypt from 'bcryptjs';

/**
 * Proveedor de identidad LOCAL.
 *
 * Valida el correo y la contraseña contra la tabla `usuarios` usando hash bcrypt.
 *
 * Cuándo se usa:
 *  - Demostración y desarrollo, donde no hay un Directorio Activo disponible.
 *  - Entornos con usuarios propios del portal (terceros, auditores).
 *
 * NO es un atajo para saltarse la autenticación: comprueba el hash y falla si la
 * contraseña no corresponde. El proveedor LDAP es el que se usa en producción
 * corporativa; este existe para que el sistema sea ejecutable y verificable sin
 * depender de infraestructura privada.
 */
export async function authenticate({ user, password }) {
  if (!user?.clave_hash) {
    // El usuario existe en el directorio pero no tiene credencial local:
    // significa que su identidad se valida por LDAP, no por este proveedor.
    return { authenticated: false, reason: 'El usuario no tiene credencial local configurada' };
  }

  const matches = await bcrypt.compare(password, user.clave_hash);
  if (!matches) {
    return { authenticated: false, reason: 'Credenciales inválidas' };
  }

  return {
    authenticated: true,
    subject: user.email_usuario,
    // El proveedor local no conoce grupos de directorio: delega la autorización
    // al rol almacenado en la base de datos (ver `auth.service.js`).
    groups: [],
    authProvider: 'local',
  };
}

export const name = 'local';
