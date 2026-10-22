import { createApp } from './app.js';
import { config, assertLdapConfig } from './config.js';
import { ping, closePool } from './db/pool.js';

/**
 * Punto de entrada: valida la configuración, comprueba la base de datos y
 * arranca el servidor. Falla rápido y con mensaje claro si algo falta.
 */
async function main() {
  if (config.auth.provider === 'ldap') {
    assertLdapConfig();
  }

  try {
    await ping();
    console.log(`[db] Conexión establecida con ${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`);
  } catch (error) {
    console.error('[db] No se pudo conectar a MySQL:', error.message);
    console.error('[db] Revisa las variables MYSQL_* de tu .env y que el servidor esté levantado.');
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(config.server.port, () => {
    console.log(`[api] Servicio Médico API escuchando en http://localhost:${config.server.port}`);
    console.log(`[api] Entorno: ${config.env} · Proveedor de identidad: ${config.auth.provider}`);
  });

  // Apagado ordenado: deja de aceptar peticiones, espera a las en curso y
  // cierra el pool. Sin esto, un reinicio en caliente deja conexiones colgadas.
  const shutdown = async (signal) => {
    console.log(`\n[api] ${signal} recibido: cerrando...`);
    server.close(async () => {
      await closePool();
      console.log('[api] Cerrado correctamente.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('[api] Error fatal al arrancar:', error);
  process.exit(1);
});
