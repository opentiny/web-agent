import { createServer, type Server } from 'node:http';
import type { Application } from 'express';
import * as portfinder from 'portfinder';
import { logger } from './Logger';
import { createApp } from './app';
import { config } from './config';

interface ListenResult {
  server: Server;
  port: number;
}

function isAddressInUseError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && (error as NodeJS.ErrnoException).code === 'EADDRINUSE';
}

// portfinder（>=1.0.x）在端口范围耗尽时抛出以 "No open ports" 开头的错误。
// 使用宽松前缀匹配，避免因 portfinder 版本升级导致措辞细微变化而漏捕获。
function isNoOpenPortError(error: unknown): error is Error {
  return error instanceof Error && /^No open ports/.test(error.message);
}

function listenOnce(app: Application, port: number, host: string): Promise<Server> {
  const server = createServer(app);

  return new Promise<Server>((resolve, reject) => {
    const cleanup = () => {
      server.off('error', onError);
      server.off('listening', onListening);
    };
    const onError = (error: NodeJS.ErrnoException) => {
      cleanup();
      reject(error);
    };
    const onListening = () => {
      cleanup();
      resolve(server);
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

/**
 * 使用 portfinder 从首选端口开始顺序探测，并启动 HTTP 服务。
 *
 * @param app Express 应用实例。
 * @param host 监听地址。
 * @param preferredPort 首选监听端口。
 * @returns 实际启动的 HTTP server 与端口。
 * @throws 找不到可用端口，或探测、监听过程遇到非端口占用错误时抛出。
 */
export async function listenOnAvailablePort(
  app: Application,
  host: string,
  preferredPort: number,
): Promise<ListenResult> {
  let port = preferredPort;

  while (port <= 65535) {
    let availablePort: number;
    try {
      availablePort = await portfinder.getPortPromise({
        port,
        stopPort: 65535,
        host,
      });
    } catch (error) {
      if (isNoOpenPortError(error)) {
        break;
      }

      throw error;
    }

    try {
      return {
        server: await listenOnce(app, availablePort, host),
        port: availablePort,
      };
    } catch (error) {
      // 探测与真实监听之间仍可能出现竞争，端口被抢占时继续尝试下一个端口。
      // 使用 Math.max 避免因 portfinder 意外返回小于 port 的值时回退导致死循环。
      if (isAddressInUseError(error)) {
        port = Math.max(availablePort + 1, port + 1);
        continue;
      }

      throw error;
    }
  }

  throw new Error(`No available port found from ${preferredPort} to 65535`);
}

/**
 * 初始化应用并启动 HTTP 服务。
 *
 * @returns 实际监听的 HTTP server。
 * @throws 初始化或监听失败时记录错误并退出进程，不向调用方返回。
 */
async function startServer() {
  try {
    const application = createApp();
    await application.initialize();

    const app = application.getApp();
    const preferredPort = config.app.port;
    const host = config.app.host;

    const { server, port } = config.app.strictPort
      ? {
          server: await listenOnce(app, preferredPort, host),
          port: preferredPort,
        }
      : await listenOnAvailablePort(app, host, preferredPort);

    if (!config.app.strictPort && port !== preferredPort) {
      logger.warn(`Configured port ${preferredPort} is in use, using ${port} instead`);
    }

    logger.info(`WebAgent server started on ${host}:${port}`);
    logger.info(`Environment: ${config.app.env}`);

    // 如果是 PM2 启动，发送 ready 信号
    if (process.send) {
      process.send('ready');
    }

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export { startServer };
