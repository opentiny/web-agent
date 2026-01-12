// Logger implementation
import * as winston from 'winston';
import { loggerConfig } from './config/logger';

// Create custom format for development
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  }),
);

// Create custom format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    // Mask sensitive information
    const masked = maskSensitiveData(info);
    return JSON.stringify(masked);
  }),
);

// Function to mask sensitive data
function maskSensitiveData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const masked = { ...obj };
  for (const [key, value] of Object.entries(masked)) {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive patterns
    const isSensitive = loggerConfig.sensitive.maskPatterns.some((pattern) => lowerKey.includes(pattern.toLowerCase()));

    if (isSensitive && typeof value === 'string') {
      masked[key] = '***MASKED***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    }
  }

  return masked;
}

// Create transports array
const transports: winston.transport[] = [];

// Console transport
if (loggerConfig.console.enabled) {
  transports.push(
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development' ? developmentFormat : productionFormat,
    }),
  );
}

// File transport
if (loggerConfig.file.enabled) {
  transports.push(
    new winston.transports.File({
      filename: loggerConfig.file.path,
      maxsize: parseSize(loggerConfig.file.maxSize),
      maxFiles: loggerConfig.file.maxFiles,
      format: productionFormat,
    }),
  );
}

// Parse size string (e.g., "10m" -> 10485760)
function parseSize(sizeStr: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    k: 1024,
    m: 1024 * 1024,
    g: 1024 * 1024 * 1024,
  };

  const match = sizeStr.toLowerCase().match(/^(\d+)([kmg]?)b?$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB

  const size = parseInt(match[1] || '0', 10);
  const unit = match[2] || 'b';
  return size * (units[unit] || 1);
}

// Create logger instance
export const logger = winston.createLogger({
  level: loggerConfig.level,
  transports,
  exitOnError: false,
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.Console(),
    ...(loggerConfig.file.enabled ? [new winston.transports.File({ filename: 'logs/exceptions.log' })] : []),
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
    ...(loggerConfig.file.enabled ? [new winston.transports.File({ filename: 'logs/rejections.log' })] : []),
  ],
});

// Add stream for morgan HTTP logging
export const httpLogStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
