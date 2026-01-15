// Middleware setup
import { Application, Request, Response, NextFunction } from 'express';
import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './corsMiddleware';
import { requestIdMiddleware } from './requestIdMiddleware';
import { loggingMiddleware } from './loggingMiddleware';
import { validationMiddleware } from './validationMiddleware';
import { errorMiddleware } from './errorMiddleware';
import { APP_API_PREFIX } from '../config';

export function setupMiddleware(app: Application) {
  // Basic middleware (with conditional body parsing)
  const shouldSkipBodyParsingByConfig = (req: Request): boolean => {
    const routes = [
      {
        method: 'POST',
        path: `${APP_API_PREFIX}/webmcp/messages`,
        match: 'prefix',
      },
    ];

    // Normalize url without query string for exact/prefix base matching
    const originalUrl = req.originalUrl || req.url || '';
    const urlNoQuery = originalUrl.split('?')[0] || '';

    for (const route of routes) {
      const methodMatch = route.method === 'ALL' || route.method === req.method;
      if (!methodMatch) continue;

      const matchMode = route.match || 'exact';
      if (matchMode === 'exact') {
        if (originalUrl === route.path || urlNoQuery === route.path) return true;
      } else {
        if (originalUrl.startsWith(route.path) || urlNoQuery.startsWith(route.path)) return true;
      }
    }

    return false;
  };

  const conditionalJsonParser = (req: Request, res: Response, next: NextFunction) => {
    if (shouldSkipBodyParsingByConfig(req)) {
      return next();
    }
    return express.json({ limit: '10mb' })(req, res, next);
  };

  const conditionalUrlencodedParser = (req: Request, res: Response, next: NextFunction) => {
    if (shouldSkipBodyParsingByConfig(req)) {
      return next();
    }
    return express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
  };

  app.use(conditionalJsonParser);
  app.use(conditionalUrlencodedParser);
  app.use(cookieParser());
  app.use(compression());

  // Custom middleware (order matters)
  app.use(corsMiddleware);
  app.use(requestIdMiddleware);
  app.use(loggingMiddleware);
  app.use(validationMiddleware);
}

// Error handling middleware - must be registered AFTER routes
export function setupErrorHandling(app: Application) {
  app.use(errorMiddleware);
}
