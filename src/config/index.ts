export const APP_API_PREFIX = '/api/v1';

interface AppConfig {
  app: {
    port: number;
    host: string;
    env: 'development' | 'staging' | 'production';
    apiPrefix: string;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
}

export const config: AppConfig = {
  app: {
    port: parseInt(process.env.AGENT_PORT || '3000', 10),
    host: process.env.AGENT_HOST || '0.0.0.0',
    env: (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production',
    apiPrefix: APP_API_PREFIX,
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
};
