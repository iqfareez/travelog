import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync } from 'node:fs';
import process from 'node:process';

// Source archives and deployment installs may not include Git metadata.
if (!process.env.CI && existsSync('.git')) {
  const result = spawnSync('git', ['config', '--get', 'core.hooksPath'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (result.error) throw result.error;
  if (![0, 1].includes(result.status)) throw new Error('Unable to read Git hook configuration.');
  const existing = result.stdout;
  if (existing.trim() && existing.trim() !== '.githooks') {
    throw new Error(`Existing core.hooksPath (${existing.trim()}) must be integrated manually.`);
  }
  chmodSync('.githooks/pre-commit', 0o755);
  execFileSync('git', ['config', '--local', 'core.hooksPath', '.githooks']);
}
