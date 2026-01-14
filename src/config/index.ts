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

// - 如果 origin 包含通配符 "*"，必须禁用 credentials（CORS 规范要求）
// - 否则启用 credentials，允许携带 cookie 等凭证
const corsCredentials = !corsOrigin.includes('*');

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
