/**
 * 统一CORS中间件
 * 支持动态CORS配置和静态环境变量配置
 * 针对特定接口使用数据库动态配置，其他接口使用静态配置
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../Logger';

// 针对特定路由前缀无条件放行CORS（任意Origin）
const ALWAYS_ALLOW_PREFIX = '/api/v1/webmcp';

// 通用的 CORS 允许的方法
const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';

// 通用的 CORS 允许的请求头
const ALLOWED_HEADERS =
  'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID, stream-session-id, mcp-protocol-version, mcp-session-id, sse-session-id';

// 通用的 CORS 暴露的响应头
const EXPOSED_HEADERS = 'Mcp-Session-Id';

/**
 * 设置通用的 CORS 响应头
 */
function setCommonCorsHeaders(res: Response): void {
  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  res.setHeader('Access-Control-Expose-Headers', EXPOSED_HEADERS);
}

/**
 * 设置 Origin 相关的 CORS 响应头
 */
function setOriginHeaders(res: Response, origin: string | undefined, allowCredentials: boolean): void {
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    if (allowCredentials) {
      // 当 Access-Control-Allow-Credentials: true 时，
      // Access-Control-Allow-Origin 不能设置为通配符 *，必须指定具体的来源域名
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  } else {
    // 无 Origin 的请求（如 curl），可以使用 "*" 且不返回 credentials
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}

/**
 * 处理 OPTIONS 预检请求
 * @returns 如果是 OPTIONS 请求返回 true，否则返回 false
 */
function handleOptionsRequest(req: Request, res: Response): boolean {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

/**
 * 统一CORS中间件
 */
export const corsMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.debug('corsMiddleware 详细调试信息', {
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      method: req.method,
      headers: req.headers,
    });

    const origin = req.headers.origin;
    // 使用 req.originalUrl 替代 req.path，因为 originalUrl 在请求处理过程中不会被修改
    const pathToCheck = req.originalUrl || req.path;

    // 前缀无条件放行：/api/v1/webmcp/*
    if (pathToCheck.startsWith(ALWAYS_ALLOW_PREFIX)) {
      logger.debug('命中无条件CORS放行前缀', { path: pathToCheck, origin });

      setOriginHeaders(res, origin, config.cors.credentials);
      setCommonCorsHeaders(res);

      if (handleOptionsRequest(req, res)) {
        return;
      }

      next();
      return;
    }

    // 静态路由：使用环境变量配置
    const allowedOrigins = Array.isArray(config.cors.origin) ? config.cors.origin : [config.cors.origin];

    // 验证Origin
    const isOriginAllowed = validateOrigin(origin, allowedOrigins);

    if (isOriginAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin!);
      res.setHeader('Vary', 'Origin');
      logger.debug('CORS请求允许', { origin, path: pathToCheck });

      if (config.cors.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    } else if (!origin) {
      // 允许无Origin的请求（如移动应用、curl请求等）
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
      logger.warn('CORS请求被拒绝', {
        origin,
        path: pathToCheck,
        allowedOrigins,
      });
      // 不设置Access-Control-Allow-Origin头，浏览器会阻止请求
    }

    setCommonCorsHeaders(res);

    if (handleOptionsRequest(req, res)) {
      return;
    }

    next();
  } catch (error) {
    logger.error('CORS中间件处理失败，使用降级配置', {
      error: error instanceof Error ? error.message : String(error),
      path: req.originalUrl || req.path,
      origin: req.headers.origin,
    });

    // 降级处理：使用静态配置
    handleCorsWithFallback(req, res, next);
  }
};

/**
 * 验证Origin是否被允许
 */
function validateOrigin(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (!origin) {
    return false;
  }

  // 检查是否在允许列表中（包含通配符检查）
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    return true;
  }

  // 开发环境松散匹配：允许http协议的Origin与https配置匹配
  if (config.app.env !== 'production') {
    for (const allowedOrigin of allowedOrigins) {
      if (isLooseMatch(origin, allowedOrigin)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 开发环境的松散匹配
 * 允许http协议与https配置进行匹配（仅比较主机名和端口）
 */
function isLooseMatch(requestOrigin: string, configOrigin: string): boolean {
  try {
    const requestUrl = new URL(requestOrigin);
    const configUrl = new URL(configOrigin);

    // 主机名和端口匹配即可（开发环境忽略协议差异）
    return requestUrl.hostname === configUrl.hostname && requestUrl.port === configUrl.port;
  } catch (error) {
    logger.warn('Origin匹配检查失败', {
      requestOrigin,
      configOrigin,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * 降级CORS处理
 * 当动态配置失败时使用静态配置
 */
function handleCorsWithFallback(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  const allowedOrigins = Array.isArray(config.cors.origin) ? config.cors.origin : [config.cors.origin];

  // 简单的Origin检查
  if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    if (origin && config.cors.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }

  setCommonCorsHeaders(res);

  if (handleOptionsRequest(req, res)) {
    return;
  }

  next();
}
