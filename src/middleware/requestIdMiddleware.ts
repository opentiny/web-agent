// Request ID middleware
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate or use existing request ID
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
};
