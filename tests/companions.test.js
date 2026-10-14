import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { COMPANIONS, isOnPath, detectCompanion, formatCompanions } from '../src/commands/companions.js';

const binPath = path.resolve(import.meta.dirname, '../bin/cto.js');

function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('unit — pure logic', () => {
  it('isOnPath: finds an executable in a PATH entry and misses an absent one', () => {
    const dir = tmpDir('cto-companions-path-');
    fs.writeFileSync(path.join(dir, 'present-tool'), '#!/bin/sh\n', { mode: 0o755 });
    const pathEnv = ['/nonexistent-dir', dir].join(path.delimiter);
    assert.strictEqual(isOnPath('present-tool', pathEnv), true);
    assert.strictEqual(isOnPath('missing-tool', pathEnv), false);
  });

  it('detectCompanion: checks a binary on PATH or a path under the home directory', () => {
    const home = tmpDir('cto-companions-home-');
    fs.mkdirSync(path.join(home, '.claude', 'plugins', 'demo'), { recursive: true });
    const env = { pathEnv: '/nonexistent-dir', home };
    assert.strictEqual(detectCompanion({ detect: { homePath: '.claude/plugins/demo' } }, env), true);
    assert.strictEqual(detectCompanion({ detect: { homePath: '.claude/plugins/other' } }, env), false);
    assert.strictEqual(detectCompanion({ detect: { binary: 'nothing-here' } }, env), false);
  });

  it('formatCompanions: marks installed tools and shows the install command only for missing ones', () => {
    const tools = [
      { name: 'alpha', what: 'does alpha', install: 'brew install alpha', url: 'https://example.com/alpha' },
      { name: 'beta', what: 'does beta', install: 'npm i -g beta', url: 'https://example.com/beta' },
    ];
    const text = formatCompanions(tools, (tool) => tool.name === 'alpha').join('\n');
    assert.match(text, /alpha.*installed/);
    assert.match(text, /beta.*not found/);
    assert.ok(text.includes('npm i -g beta'), 'missing tool shows its install command');
    assert.ok(!text.includes('brew install alpha'), 'installed tool does not repeat its install command');
  });

  it('every companion has the fields the table and README rely on', () => {
    assert.ok(COMPANIONS.length >= 3);
    for (const tool of COMPANIONS) {
      for (const key of ['name', 'what', 'install', 'url', 'detect']) {
        assert.ok(tool[key], `${tool.name || '?'} is missing ${key}`);
      }
      assert.ok(tool.url.startsWith('https://github.com/'), `${tool.name} url should be a GitHub repo`);
    }
  });
});

describe('e2e — subprocess', () => {
  it('cto companions exits 0 and lists every companion', () => {
    const result = spawnSync(process.execPath, [binPath, 'companions'], {
      cwd: tmpDir('cto-companions-e2e-'),
      encoding: 'utf8',
      timeout: 10000,
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    assert.strictEqual(result.status, 0, `exit ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
    for (const tool of COMPANIONS) {
      assert.ok(result.stdout.includes(tool.name), `expected ${tool.name} in stdout:\n${result.stdout}`);
    }
  });
});
