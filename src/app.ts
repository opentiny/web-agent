// Main application entry point
import express from 'express';
import helmet from 'helmet';
import { setupMiddleware, setupErrorHandling } from './middleware';
import { setupRoutes } from './routes';
import { logger } from './Logger';

export class Application {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.setupSecurity();
    this.setupMiddleware();
  }

  private setupSecurity() {
    this.app.use(helmet());
    this.app.set('trust proxy', 1);
  }

  private setupMiddleware() {
    setupMiddleware(this.app);
  }

  private async setupRoutes() {
    await setupRoutes(this.app);
  }

  private setupErrorHandling() {
    setupErrorHandling(this.app);
  }

  public async initialize() {
    try {
      await this.setupRoutes();
      this.setupErrorHandling(); // Must be after routes
      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  public getApp() {
    return this.app;
  }
}

export const createApp = () => new Application();
