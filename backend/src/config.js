import 'dotenv/config';

/**
 * Lee una variable obligatoria. Falla al arrancar en vez de fallar en runtime:
 * es preferible que el proceso no levante que servir peticiones a medio configurar.
 */
function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }
  return value;
}

function num(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`La variable ${name} debe ser numérica (recibido: "${raw}")`);
  }
  return parsed;
}

const authProvider = (process.env.AUTH_PROVIDER || 'local').toLowerCase();
if (!['local', 'ldap'].includes(authProvider)) {
  throw new Error(`AUTH_PROVIDER debe ser "local" o "ldap" (recibido: "${authProvider}")`);
}

// El proveedor local guarda hashes; el de LDAP no toca la tabla de usuarios para login.
export const config = {
  env: process.env.NODE_ENV || 'development',

  server: {
    port: num('PORT', 3000),
    corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:4200')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },

  auth: {
    provider: authProvider,
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',

    ldap: {
      url: process.env.LDAP_URL,
      base: process.env.LDAP_BASE,
      bindDn: process.env.LDAP_BIND_DN,
      bindPassword: process.env.LDAP_BIND_PW,
      searchFilterByMail:
        process.env.LDAP_SEARCH_FILTER_BY_MAIL || '(&(objectClass=user)(mail={0}))',
      timeoutMs: num('LDAP_TIMEOUT_MS', 5000),
      tlsRejectUnauthorized: process.env.TLS_REJECT_UNAUTHORIZED !== 'false',
    },

    // Grupos del directorio con permiso de acceso al portal.
    allowedGroups: [
      process.env.GROUP_ADMIN,
      process.env.GROUP_ASEGURAMIENTO,
      process.env.GROUP_OPERACIONES,
      process.env.GROUP_SALUD_LABORAL,
      process.env.GROUP_COORD_MEDICA,
    ].filter(Boolean),
  },

  mysql: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: num('MYSQL_PORT', 3306),
    user: process.env.MYSQL_USER || 'portalmed',
    password: process.env.MYSQL_PW || '',
    database: process.env.MYSQL_DB || 'servicio_medico',
    connectionLimit: num('MYSQL_CONN_LIMIT', 10),
  },
};

/** Valida que la configuración del proveedor LDAP esté completa. */
export function assertLdapConfig() {
  const missing = ['url', 'base'].filter((key) => !config.auth.ldap[key]);
  if (config.auth.ldap.bindDn && !config.auth.ldap.bindPassword) {
    missing.push('bindPassword (requerido si defines bindDn)');
  }
  if (missing.length > 0) {
    throw new Error(
      `AUTH_PROVIDER=ldap requiere: ${missing.join(', ')}. Revisa tu .env`,
    );
  }
}
