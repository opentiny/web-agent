import { logger } from './Logger';
import { createApp } from './app';
import { config } from './config';

async function startServer() {
  try {
    const application = createApp();
    await application.initialize();

    const app = application.getApp();
    const port = config.app.port;
    const host = config.app.host;

    const server = app.listen(port, host, () => {
      logger.info(`WebAgent server started on ${host}:${port}`);
      logger.info(`Environment: ${config.app.env}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export { startServer };
