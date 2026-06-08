import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { expect, test } from 'vitest';
import { closeServer, listen, reserveConsecutivePorts } from './helpers/port';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import type { AddressInfo } from 'node:net';

const host = '127.0.0.1';

interface StartupResult {
  output: string;
  port: number;
}

interface ExitResult {
  output: string;
  code: number | null;
  signal: NodeJS.Signals | null;
}

function spawnServer(env: Record<string, string | undefined>): ChildProcessWithoutNullStreams {
  const childEnv = {
    ...process.env,
    ...env,
  };

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete childEnv[key];
    }
  }

  return spawn('pnpm', ['exec', 'tsx', 'src/server.ts'], {
    cwd: process.cwd(),
    env: childEnv,
  });
}

// 等待子进程打印启动日志并解析实际端口；提前退出或超时会带上完整输出，便于定位失败原因。
function waitForStartup(child: ChildProcessWithoutNullStreams): Promise<StartupResult> {
  let output = '';

  return new Promise<StartupResult>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`服务未按预期启动\n${output}`));
    }, 10_000);

    const cleanup = () => {
      clearTimeout(timeout);
      child.off('exit', onExit);
      child.off('error', onError);
      child.stdout.off('data', onData);
      child.stderr.off('data', onData);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      cleanup();
      reject(new Error(`服务提前退出：code=${code ?? 'null'} signal=${signal ?? 'null'}\n${output}`));
    };
    const onData = (chunk: Buffer) => {
      output += chunk.toString();

      const startup = output.match(new RegExp(`WebAgent server started on ${host}:(\\d+)`));
      if (startup) {
        cleanup();
        resolve({
          output,
          port: Number(startup[1]),
        });
      }
    };

    child.once('error', onError);
    child.once('exit', onExit);
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
  });
}

function waitForExit(child: ChildProcessWithoutNullStreams): Promise<ExitResult> {
  let output = '';

  return new Promise<ExitResult>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`服务未按预期退出\n${output}`));
    }, 10_000);

    const cleanup = () => {
      clearTimeout(timeout);
      child.off('exit', onExit);
      child.off('error', onError);
      child.stdout.off('data', onData);
      child.stderr.off('data', onData);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      cleanup();
      resolve({ output, code, signal });
    };
    const onData = (chunk: Buffer) => {
      output += chunk.toString();
    };

    child.once('error', onError);
    child.once('exit', onExit);
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
  });
}

async function stopChild(child: ChildProcessWithoutNullStreams | undefined): Promise<void> {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  await new Promise<void>((resolve) => {
    const forceKill = setTimeout(() => {
      child.kill('SIGKILL');
    }, 2_000);

    child.once('exit', () => {
      clearTimeout(forceKill);
      resolve();
    });
    child.kill('SIGTERM');
  });
}

test('非生产环境端口被占用时自动使用之后的第一个可用端口', async () => {
  const { blockers, firstPort, firstFreePort } = await reserveConsecutivePorts(3);
  const child = spawnServer({
    AGENT_HOST: host,
    AGENT_PORT: String(firstPort),
    AGENT_STRICT_PORT: undefined,
    NODE_ENV: 'test',
  });

  try {
    const { output, port } = await waitForStartup(child);

    expect(port).toBe(firstFreePort);
    assert.match(output, new RegExp(`Configured port ${firstPort} is in use, using ${firstFreePort} instead`));
  } finally {
    await stopChild(child);
    await Promise.all(blockers.map((blocker) => closeServer(blocker)));
  }
});

test('生产环境默认严格端口，端口被占用时启动失败', async () => {
  const blocker = createServer();
  await listen(blocker, 0, host);
  const occupiedPort = (blocker.address() as AddressInfo).port;
  const child = spawnServer({
    AGENT_HOST: host,
    AGENT_PORT: String(occupiedPort),
    AGENT_STRICT_PORT: undefined,
    NODE_ENV: 'production',
  });

  try {
    const { output, code, signal } = await waitForExit(child);

    expect(signal).toBeNull();
    expect(code).not.toBe(0);
    expect(output).toContain('Failed to start server:');
    expect(output).toContain('EADDRINUSE');
    expect(output).not.toContain('using');
  } finally {
    await stopChild(child);
    await closeServer(blocker);
  }
});

test('显式关闭严格端口后生产环境允许 fallback', async () => {
  const { blockers, firstPort, firstFreePort } = await reserveConsecutivePorts(3);
  const child = spawnServer({
    AGENT_HOST: host,
    AGENT_PORT: String(firstPort),
    AGENT_STRICT_PORT: 'false',
    NODE_ENV: 'production',
  });

  try {
    const { output, port } = await waitForStartup(child);

    expect(port).toBe(firstFreePort);
    assert.match(output, new RegExp(`Configured port ${firstPort} is in use, using ${firstFreePort} instead`));
  } finally {
    await stopChild(child);
    await Promise.all(blockers.map((blocker) => closeServer(blocker)));
  }
});

test('严格端口模式下端口可用时服务正常启动', async () => {
  // 通过 OS 分配一个空闲端口号，释放后立即由子进程占用（存在极小竞争窗口，可接受）
  const probe = createServer();
  await listen(probe, 0, host);
  const freePort = (probe.address() as AddressInfo).port;
  await closeServer(probe);

  const child = spawnServer({
    AGENT_HOST: host,
    AGENT_PORT: String(freePort),
    AGENT_STRICT_PORT: 'true',
    NODE_ENV: 'production',
  });

  try {
    const { port } = await waitForStartup(child);

    expect(port).toBe(freePort);
  } finally {
    await stopChild(child);
  }
});
