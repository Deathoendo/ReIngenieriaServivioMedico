/**
 * Adaptador para plataformas sin servidor (Vercel).
 *
 * Aquí no existe un proceso de larga vida: la plataforma importa este módulo y
 * le entrega cada petición ya construida. Por eso NO se usa `src/index.js`
 * —que hace `app.listen` y espera señales del sistema— sino que se exporta un
 * manejador que delega en la misma aplicación Express.
 *
 * Tampoco se llama a `process.exit` en ningún punto: en un entorno sin servidor
 * el proceso es compartido, así que matarlo tumbaría la instancia que está
 * atendiendo a otras peticiones.
 */
import { createApp } from '../src/app.js';

const app = createApp();

/**
 * Inicialización de la base de datos para la demo pública.
 *
 * Un despliegue de portafolio no tiene una terminal donde correr
 * `npm run db:migrate`, así que con AUTO_MIGRATE=true la propia instancia aplica
 * el esquema y los datos sintéticos antes de atender la primera petición.
 *
 * Se guarda la PROMESA (no un booleano) para que todas las peticiones en vuelo
 * esperen a la misma migración en vez de lanzar varias en paralelo. Es
 * idempotente y solo corre si se pide explícitamente; si falla, se registra y la
 * aplicación sigue en pie, de modo que la API devuelve el error real en vez de
 * quedarse sin arrancar.
 */
const migracion =
  process.env.AUTO_MIGRATE === 'true'
    ? import('../scripts/migrate.js')
        .then(({ migrate }) => migrate({ log: (linea) => console.log(linea) }))
        .then(() => console.log('[demo] Base de datos inicializada.'))
        .catch((error) => console.error('[demo] No se pudo inicializar la base:', error.message))
    : Promise.resolve();

export default async function handler(req, res) {
  await migracion;
  return app(req, res);
}
