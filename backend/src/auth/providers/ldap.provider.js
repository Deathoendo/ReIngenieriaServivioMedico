import { Client } from 'ldapts';
import { config } from '../../config.js';
import { AppError } from '../../errors.js';

/**
 * Proveedor de identidad LDAP / Active Directory.
 *
 * Flujo real de autenticación (no existe atajo):
 *   1. (Si está configurado) bind con un usuario de servicio para poder buscar.
 *   2. Buscar el DN del usuario por su correo dentro de LDAP_BASE.
 *   3. Bind con ESE DN y la contraseña recibida. Aquí ocurre la autenticación.
 *   4. Leer `memberOf` de la entrada para resolver los grupos del usuario.
 *
 * Si el paso 3 falla, la autenticación falla. No hay camino alternativo.
 *
 * Se usa `ldapts` en lugar de `ldapjs` (descontinuado por su mantenedor) porque
 * expone una API basada en promesas: elimina el envoltorio manual de callbacks
 * que requería ldapjs y con él toda una clase de errores por escapes olvidados.
 */

/** Escapa los caracteres especiales del filtro LDAP (RFC 4515) — evita inyección. */
export function escapeFilter(value) {
  return String(value).replace(/[\\*()\0]/g, (char) => {
    const code = char.charCodeAt(0).toString(16).padStart(2, '0');
    return `\\${code}`;
  });
}

function createClient() {
  const options = {
    url: config.auth.ldap.url,
    timeout: config.auth.ldap.timeoutMs,
    connectTimeout: config.auth.ldap.timeoutMs,
  };

  // Certificados autofirmados solo si se desactiva de forma explícita en el .env.
  // Por defecto la verificación queda activa: la conexión debe ser de confianza.
  if (config.auth.ldap.url?.startsWith('ldaps://') && !config.auth.ldap.tlsRejectUnauthorized) {
    options.tlsOptions = { rejectUnauthorized: false };
  }

  return new Client(options);
}

export async function authenticate({ user, password }) {
  const { base, bindDn, bindPassword, searchFilterByMail } = config.auth.ldap;
  const client = createClient();

  try {
    // 1. Bind de servicio, solo si está configurado.
    if (bindDn) {
      try {
        await client.bind(bindDn, bindPassword);
      } catch (error) {
        throw new AppError(
          `No se pudo autenticar el usuario de servicio LDAP: ${error.message}`,
          503,
          'LDAP_SERVICE_BIND_FAILED',
        );
      }
    }

    // 2. Localizar el DN del usuario por su correo.
    const filter = searchFilterByMail.replace('{0}', escapeFilter(user.email_usuario));
    const { searchEntries } = await client.search(base, {
      scope: 'sub',
      filter,
      attributes: ['sAMAccountName', 'mail', 'displayName', 'memberOf'],
      sizeLimit: 2,
    });

    if (searchEntries.length === 0) {
      return { authenticated: false, reason: 'El usuario no existe en el directorio' };
    }
    if (searchEntries.length > 1) {
      throw new AppError(
        'El correo está asociado a más de una cuenta en el directorio',
        409,
        'LDAP_AMBIGUOUS_USER',
      );
    }

    const entry = searchEntries[0];
    return await bindAsUser(entry, user, password);
  } finally {
    await client.unbind().catch(() => {});
  }
}

/**
 * Autentica con la identidad del propio usuario sobre un cliente nuevo.
 *
 * Se abre otro cliente a propósito: el anterior quedó ligado al usuario de
 * servicio, y reutilizarlo devolvería un falso positivo (el bind siempre
 * funcionaría, sin importar la contraseña que se envíe).
 */
async function bindAsUser(entry, user, password) {
  const client = createClient();

  try {
    await client.bind(entry.dn, password);
  } catch {
    // Credencial inválida (o cuenta bloqueada). Se devuelve el mismo mensaje
    // genérico para no revelar cuál de los dos casos ocurrió.
    return { authenticated: false, reason: 'Credenciales inválidas' };
  } finally {
    await client.unbind().catch(() => {});
  }

  return {
    authenticated: true,
    subject: user.email_usuario,
    distinguishedName: entry.dn,
    samAccountName: firstValue(entry.sAMAccountName) ?? user.email_usuario.split('@')[0],
    groups: normalizeGroups(entry.memberOf),
    authProvider: 'ldap',
  };
}

function firstValue(value) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

/**
 * Normaliza `memberOf`, que el directorio puede devolver como cadena única o
 * como arreglo según cuántos grupos tenga la cuenta.
 */
function normalizeGroups(value) {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.filter(Boolean).map((group) => String(group));
}

export const name = 'ldap';
