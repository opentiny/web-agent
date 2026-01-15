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

// 解析 CORS origin 配置
const corsOrigin = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];

// 即使 origin 包含通配符 "*"，我们也允许启用 credentials。
// 中间件在处理请求时会根据请求的 Origin 动态设置 Access-Control-Allow-Origin，
// 这样可以同时满足 "*" 的通用性以及 credentials 的要求。
const corsCredentials = true;

export const config: AppConfig = {
  app: {
    port: parseInt(process.env.AGENT_PORT || '3000', 10),
    host: process.env.AGENT_HOST || '0.0.0.0',
    env: (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production',
    apiPrefix: APP_API_PREFIX,
  },
  cors: {
    origin: corsOrigin,
    credentials: corsCredentials,
  },
};
