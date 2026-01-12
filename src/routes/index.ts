// Main routes configuration
import { Application } from 'express';
import { config } from '../config';
import v1Routes from './v1';
import healthRoutes from './health';

export async function setupRoutes(app: Application) {
  // Health check routes (no API prefix)
  app.use('/health', healthRoutes);

  // API v1 routes
  app.use(config.app.apiPrefix, v1Routes);

  // 404 handler
  app.use('/*splat', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        path: req.originalUrl,
        method: req.method,
      },
    });
  });
}
