import express from 'express';
import * as portfinder from 'portfinder';
import { afterEach, expect, test, vi } from 'vitest';
import { listenOnAvailablePort } from '../src/server';
import { closeServer, reservePortWithFreeNext } from './helpers/port';
import type { Server as HttpServer } from 'node:http';
import type { Server as NetServer } from 'node:net';

vi.mock('portfinder', () => ({
  getPortPromise: vi.fn(),
}));

const host = '127.0.0.1';
const getPortPromise = vi.mocked(portfinder.getPortPromise);
const servers: Array<HttpServer | NetServer> = [];

afterEach(async () => {
  getPortPromise.mockReset();

  while (servers.length > 0) {
    await closeServer(servers.pop());
  }
});

test('监听候选端口被抢占时继续使用之后的可用端口', async () => {
  const { blocker, occupiedPort } = await reservePortWithFreeNext(host);
  servers.push(blocker);
  const app = express();
  const nextPort = occupiedPort + 1;

  getPortPromise.mockResolvedValueOnce(occupiedPort).mockResolvedValueOnce(nextPort);

  const result = await listenOnAvailablePort(app, host, occupiedPort);
  servers.push(result.server);

  expect(result.port).toBe(nextPort);
  expect(getPortPromise).toHaveBeenNthCalledWith(1, {
    port: occupiedPort,
    stopPort: 65535,
    host,
  });
  expect(getPortPromise).toHaveBeenNthCalledWith(2, {
    port: nextPort,
    stopPort: 65535,
    host,
  });
});

test('portfinder 找不到可用端口时 listenOnAvailablePort 应抛出错误', async () => {
  const app = express();

  // portfinder 在端口范围耗尽时会抛出 "No open ports ..." 错误
  getPortPromise.mockRejectedValueOnce(new Error('No open ports found in between 65535 and 65535'));

  await expect(listenOnAvailablePort(app, host, 65535)).rejects.toThrow('No available port found from 65535 to 65535');
  expect(getPortPromise).toHaveBeenCalledTimes(1);
});
