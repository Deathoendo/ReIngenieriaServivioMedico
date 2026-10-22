import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRoutes from './routes/auth.routes.js';
import consultaRoutes from './routes/consulta.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { ping } from './db/pool.js';

/**
 * Construye la aplicación Express.
 *
 * Se exporta como fábrica (y no como instancia ya escuchando) para que los tests
 * puedan montarla en un puerto efímero sin abrir el puerto de producción.
 */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(
    cors({
      origin: config.server.corsOrigin,
      credentials: true,
    }),
  );

  app.get('/api/health', async (req, res) => {
    try {
      await ping();
      res.json({ success: true, status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ success: false, status: 'degraded', database: 'down' });
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/consultas', consultaRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
