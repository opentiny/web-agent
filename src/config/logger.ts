// Logger configuration
export const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.LOG_FORMAT || 'json', // 'json' | 'simple' | 'combined'
  file: {
    enabled: process.env.LOG_FILE_ENABLED === 'true',
    path: process.env.LOG_FILE_PATH || './logs/app.log',
    maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES || '5', 10),
  },
  console: {
    enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
    colorize: process.env.LOG_CONSOLE_COLORIZE !== 'false',
  },
  http: {
    enabled: process.env.LOG_HTTP_ENABLED === 'true',
    format: process.env.LOG_HTTP_FORMAT || 'combined',
  },
  sensitive: {
    maskPatterns: ['password', 'secret', 'token', 'key', 'authorization'],
  },
};
