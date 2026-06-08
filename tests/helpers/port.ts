import { createServer } from 'node:net';
import type { AddressInfo, Server } from 'node:net';

/**
 * 以 Promise 方式在指定 host:port 启动 net.Server，失败时 reject。
 */
export async function listen(server: Server, port: number, host: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      server.off('error', onError);
      server.off('listening', onListening);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onListening = () => {
      cleanup();
      resolve();
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

/**
 * 关闭正在监听的 server；若已关闭则直接返回。
 */
export async function closeServer(server: Server | undefined): Promise<void> {
  if (!server?.listening) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

/**
 * 检测 host:port 是否可以被监听（探测后立即关闭）。
 */
export async function canListen(port: number, host: string): Promise<boolean> {
  const probe = createServer();

  try {
    await listen(probe, port, host);
    return true;
  } catch {
    return false;
  } finally {
    await closeServer(probe);
  }
}

/**
 * 预占单个端口，并确保其后一个端口当时可用。
 * 用于模拟"首选端口已占用、下一个空闲"的场景。
 */
export async function reservePortWithFreeNext(host: string): Promise<{ blocker: Server; occupiedPort: number }> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const blocker = createServer();
    await listen(blocker, 0, host);

    const occupiedPort = (blocker.address() as AddressInfo).port;
    if (occupiedPort < 65535 && (await canListen(occupiedPort + 1, host))) {
      return { blocker, occupiedPort };
    }

    await closeServer(blocker);
  }

  throw new Error('无法找到相邻可用端口用于测试');
}

/**
 * 预占 count 个连续端口，并确保第 count+1 个端口当时可用。
 * 用于构造"多个端口均被占用、首个可用端口在更后面"的集成测试场景。
 */
export async function reserveConsecutivePorts(
  count: number,
  listenHost = '0.0.0.0',
): Promise<{ blockers: Server[]; firstPort: number; firstFreePort: number }> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const blockers: Server[] = [];
    let keepBlockers = false;

    try {
      const firstBlocker = createServer();
      await listen(firstBlocker, 0, listenHost);
      blockers.push(firstBlocker);

      const firstPort = (firstBlocker.address() as AddressInfo).port;
      if (firstPort + count > 65535) {
        continue;
      }

      for (let offset = 1; offset < count; offset += 1) {
        const blocker = createServer();
        await listen(blocker, firstPort + offset, listenHost);
        blockers.push(blocker);
      }

      const firstFreePort = firstPort + count;
      if (await canListen(firstFreePort, listenHost)) {
        keepBlockers = true;
        return { blockers, firstPort, firstFreePort };
      }
    } catch {
      // 连续端口可能被系统或其它进程占用，释放本轮资源后重新取一段。
    } finally {
      if (!keepBlockers) {
        await Promise.all(blockers.map((blocker) => closeServer(blocker)));
      }
    }
  }

  throw new Error('无法找到连续端口段用于测试');
}
