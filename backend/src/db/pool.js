import mysql from 'mysql2/promise';
import { config } from '../config.js';

/**
 * Pool único de conexiones reutilizado por todos los repositorios.
 *
 * Un pool (y no una conexión por petición) porque abrir un handshake TCP+auth por
 * request es caro y agota los `max_connections` del servidor MySQL bajo carga.
 */
export const pool = mysql.createPool({
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  waitForConnections: true,
  connectionLimit: config.mysql.connectionLimit,
  queueLimit: 0,
  // Evita sorpresas de zona horaria entre Node y MySQL al leer/grabar fechas.
  timezone: 'Z',
  dateStrings: ['DATE', 'DATETIME'],
  // TLS cuando el servidor lo exige. `rejectUnauthorized: false` porque los
  // proveedores gestionados firman con su propia CA, que no está en el almacén
  // del contenedor: la conexión va cifrada, solo se omite la validación de la
  // cadena. Para verificación completa, define MYSQL_SSL_CA con la CA del
  // proveedor en vez de activar esta bandera.
  ssl: config.mysql.ssl ? { rejectUnauthorized: false } : undefined,
});

/**
 * Ejecuta `fn` con una conexión dedicada del pool y SIEMPRE la libera.
 *
 * Necesario para las rutas que llaman stored procedures con parámetros OUT:
 * las variables de sesión (@out_code) viven en la conexión, así que la llamada
 * al SP y el SELECT de sus parámetros tienen que ocurrir sobre la MISMA conexión.
 */
export async function withConnection(fn) {
  const connection = await pool.getConnection();
  try {
    return await fn(connection);
  } finally {
    connection.release();
  }
}

/**
 * Ejecuta `fn` dentro de una transacción real, con rollback automático ante error.
 * Se usa en las operaciones maestro-detalle (consulta + diagnósticos).
 */
export async function withTransaction(fn) {
  return withConnection(async (connection) => {
    await connection.beginTransaction();
    try {
      const result = await fn(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}

export async function ping() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

export async function closePool() {
  await pool.end();
}
