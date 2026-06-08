export const APP_API_PREFIX = '/api/v1';

const appEnvs = ['development', 'test', 'staging', 'production'] as const;

type AppEnv = (typeof appEnvs)[number];

interface AppConfig {
  app: {
    port: number;
    host: string;
    env: AppEnv;
    apiPrefix: string;
    strictPort: boolean;
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

function isAppEnv(value: string): value is AppEnv {
  return (appEnvs as readonly string[]).includes(value);
}

function parseAppEnv(value: string | undefined): AppEnv {
  const env = value === undefined ? 'development' : value.trim().toLowerCase();

  if (isAppEnv(env)) {
    return env;
  }

  throw new Error(`Invalid NODE_ENV: ${value}. Expected one of: ${appEnvs.join(', ')}`);
}

function parseBooleanEnv(name: string, value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  throw new Error(`Invalid ${name}: ${value}. Expected "true" or "false".`);
}

const appEnv = parseAppEnv(process.env.NODE_ENV);

export const config: AppConfig = {
  app: {
    port: parseInt(process.env.AGENT_PORT || '3000', 10),
    host: process.env.AGENT_HOST || '0.0.0.0',
    env: appEnv,
    apiPrefix: APP_API_PREFIX,
    strictPort: parseBooleanEnv('AGENT_STRICT_PORT', process.env.AGENT_STRICT_PORT, appEnv === 'production'),
  },
  cors: {
    origin: corsOrigin,
    credentials: corsCredentials,
  },
};
