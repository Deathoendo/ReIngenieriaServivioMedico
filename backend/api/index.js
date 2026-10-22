/**
 * Adaptador para plataformas sin servidor (Vercel).
 *
 * Aquí no existe un proceso de larga vida: la plataforma importa este módulo y
 * le entrega cada petición ya construida. Por eso NO se usa `src/index.js`
 * —que hace `app.listen` y espera señales del sistema— sino que se exporta la
 * misma aplicación Express para que la plataforma la invoque.
 *
 * Tampoco se llama a `process.exit` en ningún punto: en un entorno sin servidor
 * el proceso es compartido, así que matarlo tumbaría la instancia que está
 * atendiendo a otras peticiones.
 */
import { createApp } from '../src/app.js';

const app = createApp();

export default app;
