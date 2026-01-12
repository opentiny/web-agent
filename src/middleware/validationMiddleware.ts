// Validation middleware
import { Request, Response, NextFunction } from 'express';

export const validationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Basic content type validation for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];

    if (
      contentType &&
      !contentType.includes('application/json') &&
      !contentType.includes('multipart/form-data') &&
      !contentType.includes('application/x-www-form-urlencoded')
    ) {
      return res.status(415).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Content-Type must be application/json, multipart/form-data, or application/x-www-form-urlencoded',
        },
      });
    }
  }

  return next();
};
