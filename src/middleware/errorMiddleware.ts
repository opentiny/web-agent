// Error handling middleware
import { Request, Response, NextFunction } from 'express';
import { logger } from '../Logger';
import { BaseError } from '../utils/BaseError';

export const errorMiddleware = (error: Error | BaseError, req: Request, res: Response, _next: NextFunction) => {
  // Log error
  logger.error('Request error', {
    requestId: req.requestId,
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  });

  // Handle known errors
  if (error instanceof BaseError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        requestId: req.requestId,
        timestamp: error.timestamp,
      },
    });
  }

  // Handle validation errors (from libraries like joi, zod)
  if (error.name === 'ValidationError' || error.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Handle unknown errors
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDevelopment ? error.message : 'Internal server error',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { stack: error.stack }),
    },
  });
};
