import { afterEach, expect, test, vi } from 'vitest';

async function importConfig() {
  vi.resetModules();

  return import('../src/config');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

test('拒绝非法 NODE_ENV，避免运行时环境突破配置契约', async () => {
  vi.stubEnv('NODE_ENV', 'prod');

  await expect(importConfig()).rejects.toThrow('Invalid NODE_ENV');
});

test('拒绝非法 AGENT_STRICT_PORT，避免生产环境静默关闭严格端口', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('AGENT_STRICT_PORT', 'fasle');

  await expect(importConfig()).rejects.toThrow('Invalid AGENT_STRICT_PORT');
});

test('规范化合法 NODE_ENV 后再推断严格端口默认值', async () => {
  vi.stubEnv('NODE_ENV', ' Production ');

  const { config } = await importConfig();

  expect(config.app.env).toBe('production');
  expect(config.app.strictPort).toBe(true);
});

test('接受 NODE_ENV=test 作为非生产运行环境', async () => {
  vi.stubEnv('NODE_ENV', 'test');

  const { config } = await importConfig();

  expect(config.app.env).toBe('test');
  expect(config.app.strictPort).toBe(false);
});

test('规范化合法 AGENT_STRICT_PORT 后再覆盖默认值', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('AGENT_STRICT_PORT', ' TRUE ');

  const { config } = await importConfig();

  expect(config.app.strictPort).toBe(true);
});
