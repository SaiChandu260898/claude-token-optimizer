import chalk from 'chalk';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// cto trims what Claude Code loads at startup. These tools trim the other
// token sinks (shell output, file reads, reply length) and are independent of
// this project. Install commands are quoted from each project's README.
export const COMPANIONS = [
  {
    name: 'rtk',
    what: 'Rewrites Bash tool calls through a PreToolUse hook so command output reaches Claude filtered and compressed',
    install: 'curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh && rtk init -g',
    url: 'https://github.com/rtk-ai/rtk',
    detect: { binary: 'rtk' },
  },
  {
    name: 'lean-ctx',
    what: 'MCP server that replaces Read, Grep and Shell with cached, compressed equivalents',
    install: 'curl -fsSL https://leanctx.com/install.sh | sh && lean-ctx init --agent claude',
    url: 'https://github.com/yvgude/lean-ctx',
    detect: { binary: 'lean-ctx' },
  },
  {
    name: 'caveman',
    what: 'Plugin that makes Claude answer tersely, cutting output tokens per reply',
    install: 'claude plugin marketplace add JuliusBrussee/caveman && claude plugin install caveman@caveman',
    url: 'https://github.com/JuliusBrussee/caveman',
    detect: { homePath: '.claude/plugins/cache/caveman' },
  },
  {
    name: 'ponytail',
    what: 'Plugin ruleset for the simplest code that works; fewer lines written means fewer output tokens, though its rules are re-injected each turn',
    install: 'claude plugin marketplace add DietrichGebert/ponytail && claude plugin install ponytail@ponytail',
    url: 'https://github.com/DietrichGebert/ponytail',
    detect: { homePath: '.claude/plugins/cache/ponytail' },
  },
];

export function isOnPath(binary, pathEnv = process.env.PATH ?? '') {
  return pathEnv
    .split(path.delimiter)
    .filter(Boolean)
    .some((dir) => fs.existsSync(path.join(dir, binary)));
}

export function detectCompanion(tool, env = {}) {
  const { binary, homePath } = tool.detect;
  if (binary) return isOnPath(binary, env.pathEnv);
  return fs.existsSync(path.join(env.home ?? os.homedir(), homePath));
}

export function formatCompanions(tools, isInstalled) {
  const lines = ['', chalk.bold('cto companions — other token savers for Claude Code'), ''];
  for (const tool of tools) {
    const installed = isInstalled(tool);
    const status = installed ? chalk.green('installed') : chalk.yellow('not found');
    lines.push(`  ${chalk.cyan(tool.name.padEnd(10))} ${status}`);
    lines.push(`  ${''.padEnd(10)} ${tool.what}`);
    if (!installed) lines.push(`  ${''.padEnd(10)} ${chalk.dim('install:')} ${tool.install}`);
    lines.push(`  ${''.padEnd(10)} ${chalk.dim(tool.url)}`);
    lines.push('');
  }
  lines.push(chalk.dim('  Detection checks your PATH and ~/.claude only. Savings claims are each project\'s own.'));
  lines.push('');
  return lines;
}

export async function companionsCommand() {
  formatCompanions(COMPANIONS, detectCompanion).forEach((line) => console.log(line));
}
