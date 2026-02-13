import { existsSync } from 'node:fs';

const isDisabled = process.env.HUSKY === '0';
const isProduction = process.env.NODE_ENV === 'production';
const isCI = process.env.CI === 'true';
const hasGitDir = existsSync('.git');

if (isDisabled || isProduction || isCI || !hasGitDir) {
  process.exit(0);
}

try {
  const { default: husky } = await import('husky');
  husky();
} catch (error) {
  const message = String(error);
  if (message.includes("Cannot find package 'husky'") || message.includes('ERR_MODULE_NOT_FOUND')) {
    process.exit(0);
  }

  console.error('[prepare] Failed to install husky hooks.');
  console.error(error);
  process.exit(1);
}
