// 系统级路由 - 从 index.ts 迁移而来
import { Router, Request, Response, IRouter } from 'express';
import { useProxyHandles } from '@opentiny/agent';
import { logger } from '../../Logger';
import { config } from '../../config';

type ProxyHandles = ReturnType<typeof useProxyHandles>;

// 全局代理处理对象
const proxyHandles: ProxyHandles = useProxyHandles();
const router: IRouter = Router();

router.get('/ping', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    res.json(await proxyHandles.ping());
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Ping endpoint error:', error);

    res.status(500).json({
      error: 'Ping check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/sse', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const connectionId = `sse_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  try {
    // 连接并发限制（支持请求头旁路）
    const sessionId = (req.query.sessionId as string) || null;

    // 连接处理逻辑
    if (sessionId) {
      // Inspector模式
      logger.info(`SSE Inspector connection: ${connectionId} for session: ${sessionId}`);

      // 增强错误处理的SSE Inspector
      try {
        await proxyHandles.handleSseInspector(req, res, `${config.app.apiPrefix}/webmcp/messages`);
      } catch (inspectorError) {
        logger.error(`SSE Inspector error for connection ${connectionId}:`, inspectorError);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'SSE Inspector connection failed',
            connectionId,
            sessionId,
            message: inspectorError instanceof Error ? inspectorError.message : 'Unknown error',
          });
        }
      }
    } else {
      // Proxy模式
      logger.info(`SSE Proxy connection: ${connectionId}`);

      try {
        await proxyHandles.handleSseProxy(req, res, `${config.app.apiPrefix}/webmcp/messages`);
      } catch (proxyError) {
        logger.error(`SSE Proxy error for connection ${connectionId}:`, proxyError);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'SSE Proxy connection failed',
            connectionId,
            message: proxyError instanceof Error ? proxyError.message : 'Unknown error',
          });
        }
      }
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Agent Server SSE error for connection ${connectionId}:`, error);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'SSE connection failed',
        connectionId,
        duration: `${duration}ms`,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }
});

// 消息转发端点，根据 sessionId 找到对应 transport 处理消息
router.post('/messages', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  try {
    // 增强的消息处理
    await proxyHandles.handleSseMessage(req, res);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Agent Server message error for ${messageId}:`, error);

    // 分类错误类型
    let errorCode = 'MESSAGE_ERROR';
    let statusCode = 500;
    let errorMessage = 'Message processing failed';

    if (error instanceof Error) {
      if (error.message.includes('session') || error.message.includes('not found')) {
        errorCode = 'SESSION_ERROR';
        statusCode = 404;
        errorMessage = '会话未找到或已断开';
      } else if (error.message.includes('transport') || error.message.includes('connection')) {
        errorCode = 'TRANSPORT_ERROR';
        statusCode = 503;
        errorMessage = '传输连接错误';
      } else if (error.message.includes('timeout')) {
        errorCode = 'TIMEOUT_ERROR';
        statusCode = 408;
        errorMessage = '消息处理超时';
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        errorCode = 'PERMISSION_ERROR';
        statusCode = 403;
        errorMessage = '权限不足';
      }
    }

    if (!res.headersSent) {
      res.status(statusCode).json({
        error: errorCode,
        message: errorMessage,
        messageId,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        details:
          process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined,
      });
    }
  }
});

// 处理 Streamable HTTP 服务端 POST/GET/DELETE 连接
// 可以使用 MCP inspector 连接调试，方式与 SSE 连接相同，如下：
// http://localhost:8001/mcp?sessionId= 或 http://localhost/agent/mcp?sessionId=
// MCP 协议处理端点
router.all('/mcp', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = `mcp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  // 详细的调试日志
  logger.debug('🚀 MCP ROUTE: Request entered router.all handler', {
    requestId,
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    headers: {
      'content-type': req.headers['content-type'],
      authorization: req.headers.authorization ? 'present' : 'missing',
      origin: req.headers.origin,
    },
    timestamp: new Date().toISOString(),
  });

  try {
    // 添加MCP请求追踪头
    res.setHeader('X-MCP-Request-ID', requestId);
    res.setHeader('X-MCP-Method', req.method);
    res.setHeader('X-Processing-Start', new Date().toISOString());

    // 仅对 GET（长连接场景）实施并发连接控制（支持请求头旁路）
    if ((req.method || '').toUpperCase() === 'GET' && req.headers.accept?.includes('text/event-stream')) {
      const connectSessionId = req.headers['mcp-session-id'] as string;
      const clientKey = (connectSessionId || '').trim();

      // 统一清理闭包：优先关闭/移除 client，再按需释放并发占用
      const cleanupOnce = (() => {
        let done = false;
        return () => {
          if (done) return;
          done = true;
          // client 清理
          try {
            logger.debug('cleanupOnce', { clientKey });
            if (clientKey) {
              proxyHandles?.clients[clientKey]?.transport?.close?.();
              delete proxyHandles?.clients[clientKey];
            }
          } catch (_) {
            // ignore
          }
        };
      })();

      // 仅注册一组事件监听
      res.once('close', cleanupOnce);
      res.once('error', cleanupOnce);
      req.once('close', cleanupOnce);
    }

    let mcpPromise: Promise<any>;

    if (req.query.sessionId) {
      const sessionId = req.query.sessionId as string;
      logger.debug('🔍 MCP ROUTE: Inspector mode', {
        requestId,
        sessionId,
        method: req.method,
      });
      mcpPromise = proxyHandles.handleStreamInspector(req, res);
    } else {
      logger.debug('🔍 MCP ROUTE: Standard MCP request', {
        requestId,
        method: req.method,
      });
      mcpPromise = proxyHandles.handleStreamRequest(req, res);
    }

    // 增强的MCP处理
    try {
      await mcpPromise;

      const duration = Date.now() - startTime;
      logger.debug('✅ MCP ROUTE: Request completed successfully', {
        requestId,
        duration: `${duration}ms`,
        method: req.method,
      });
    } catch (mcpError) {
      const duration = Date.now() - startTime;
      logger.error('❌ MCP ROUTE: Request failed', {
        requestId,
        error: mcpError instanceof Error ? mcpError.message : String(mcpError),
        duration: `${duration}ms`,
        method: req.method,
      });

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal MCP processing error',
            data: {
              requestId,
              error: mcpError instanceof Error ? mcpError.message : String(mcpError),
              timestamp: new Date().toISOString(),
            },
          },
        });
      }
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('❌ MCP ROUTE: Unexpected error in handler', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      method: req.method,
    });

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Unexpected error in MCP handler',
          data: {
            requestId,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          },
        },
      });
    }
  }
});

// 获取所有客户端的 sessionId
router.get('/list', async (req: Request, res: Response) => {
  const sessions: Record<string, object> = {};
  for (const sessionId in proxyHandles.clients) {
    const { user, device, type } = proxyHandles.clients[sessionId] || {};
    sessions[sessionId] = { user, device, type };
  }
  res.json(sessions);
});

// 获取所有操控端的 sessionId
router.get('/remoter', async (req: Request, res: Response) => {
  const sessions: Record<string, object> = {};
  for (const sessionId in proxyHandles.remoters) {
    const { user, client, device, type } = proxyHandles.remoters[sessionId] || {};
    sessions[sessionId] = { user, client, device, type };
  }
  res.json(sessions);
});

// 重置所有客户端和操控端
router.get('/reset', async (req: Request, res: Response) => {
  res.json(proxyHandles.reset());
});

router.get('/tools', async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const client = proxyHandles.clients[sessionId]?.client;
  if (client) {
    const result = await client.listTools();
    res.json({ result });
    return;
  }
  res.json({ result: `No client found for session ID ${sessionId}` });
});

// 按 sessionId 查询单个客户端信息（轻量无鉴权）
router.get('/client', async (req: Request, res: Response) => {
  try {
    let sessionId = req.query.sessionId as string;
    if (!sessionId) {
      return res.status(200).json({
        status: 400,
        error: 'MISSING_SESSION_ID',
        message: 'sessionId is required',
      });
    }

    // 支持传入 sessionId 后六位进行匹配
    if (sessionId.length === 6) {
      try {
        const suffix = sessionId;
        const allSessionIds = Object.keys(proxyHandles.clients || {});
        const matched = allSessionIds.find((id) => id.endsWith(suffix));
        if (matched) {
          sessionId = matched;
        }
      } catch (_) {
        // ignore
      }
    }

    const entry = proxyHandles.clients[sessionId];
    if (!entry) {
      return res.status(200).json({
        status: 404,
        error: 'SESSION_NOT_FOUND',
        message: `No client found for session ID ${sessionId}`,
      });
    }

    const { user, device, type } = entry;
    return res.status(200).json({ status: 0, data: { sessionId, user, device, type } });
  } catch (error) {
    return res.status(200).json({
      status: 500,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unexpected error',
    });
  }
});

export default router;
