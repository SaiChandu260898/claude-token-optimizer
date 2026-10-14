# AGENTS.md

`claude-token-optimizer` (CLI: `cto`) shrinks what Claude Code loads at session start. It sets up a small CLAUDE.md with on-demand doc folders, measures auto-loaded tokens, and moves finished tasks and old session notes out of CLAUDE.md. On the author's RedwoodJS project startup went from about 11,000 tokens to about 800. Token counts use the Claude 2 tokenizer, so they are estimates.

## Use cto in a project

Run from the root of the user's project with Node 20+. Every command below uses `npx -y claude-token-optimizer`; if `cto` is installed globally, `cto` works the same.

Safety rules, read before writing anything:

- Copy `CLAUDE.md` to a safe place first. `compress` and `prune` each write `<file>.bak`, but a second run replaces the first `.bak`, so after chaining them only the last change can be undone.
- Never pass `--force` to `init` on a user's project. It replaces CLAUDE.md and the support files with no backup.
- If the project has no CLAUDE.md, `init` writes `.claudeignore`, `.claude/COMMON_MISTAKES.md`, `.claude/QUICK_START.md`, `.claude/ARCHITECTURE_MAP.md` and `docs/INDEX.md` fresh, replacing any that already exist. Check for those files first and back them up.
- `compress` is lossy: it truncates long lists and strips HTML comments, including tool markers such as `<!-- OMC:START -->`. Read the `--dry-run` output before applying.

Steps:

1. `npx -y claude-token-optimizer measure` shows auto-loaded tokens, file by file.
2. `npx -y claude-token-optimizer init --yes --framework <name>` creates CLAUDE.md, `.claude/`, `docs/` and `.claudeignore`. Frameworks: express, nextjs, react, vue, nuxtjs, angular, svelte, nestjs, django, fastapi, rails, laravel, go, spring-boot. Leave out `--framework` to auto-detect. If CLAUDE.md exists, init appends only the missing cto sections and leaves the support files alone.
3. `npx -y claude-token-optimizer prune --dry-run`, then `prune --yes`. Moves completed-task and dated session-note sections into `.claude/completions/` and `.claude/sessions/archive/`, and drops empty sections. `--days <n>` limits it to session notes older than n days.
4. `npx -y claude-token-optimizer compress --dry-run`, then `compress --yes` only if the preview is acceptable.
5. `npx -y claude-token-optimizer audit --json` checks structure and token health. It exits 1 when there are errors. `audit --fix` creates missing files for failing checks.
6. `npx -y claude-token-optimizer diff` shows the token delta between CLAUDE.md and CLAUDE.md.bak.

Other commands:

- `companions` lists other token-saving tools and whether they are installed.
- `hooks install --all` copies the hook templates into `.claude/hooks/`, and `hooks settings` prints the block to merge into settings.json. Use these on a project that already has CLAUDE.md; `init --hooks` only installs hooks on a fresh init. `hooks remove <name> --yes` removes one.
- `watch` is a live dashboard that never exits. Do not run it from an agent.

`--file <path>` on `compress`, `prune` and `diff` targets a markdown file other than CLAUDE.md.

### Prompts and exit codes

| Command | Asks | Flag that skips it |
| --- | --- | --- |
| `init` | project info (free text), then "Set up hooks?" | `--yes`. A detected or given framework skips only the project info |
| `compress` | "Apply changes? [y/N]" | `--yes`, or `--dry-run` to never write |
| `prune` | one "[Y/n]" per section | `--yes`, or `--dry-run` |
| `hooks remove` | "Remove hook?" | `--yes` |

Always pass the skip flag. With stdin closed (`</dev/null`) a pending prompt ends the process with exit 0, sometimes after writing part of the work. With stdin an open pipe, the prompt waits forever.

Exit 0 does not prove a write happened. Check the file state instead: the target changed and `<file>.bak` exists for `compress` and `prune`, and CLAUDE.md exists after `init`.

## Work on this repo

ESM, Node 20+, four runtime dependencies (`@anthropic-ai/tokenizer`, `chalk`, `commander`, `glob`). Do not add more.

Layout:

- `bin/cto.js` is the entry point and calls `run()` in `src/cli.js`.
- `src/cli.js` declares every command and flag with commander.
- `src/commands/` has one file per command: init, measure, audit, compress, prune, diff, watch, hooks, companions, update.
- `src/lib/` holds shared code: `frameworks.js` (patterns and detection), `scanner.js` (finds auto-loaded files), `tokenizer.js` (token counting).
- `templates/hooks/` holds the hook scripts that `cto hooks install` copies into user projects.
- `examples/` has a COMMON_MISTAKES starter per framework.
- `tests/` has `*.test.js` files run by `node:test`.

Run tests with `npm test` (same as `node --test tests/*.test.js`). Run one file with `node --test tests/compress.test.js`. Try the CLI with `node bin/cto.js <cmd>`.

Patterns to follow:

- Put logic in small exported pure functions and keep the command function a thin wrapper that prints and writes.
- Unit test the pure functions. For command behaviour, spawn `bin/cto.js` with `spawnSync` in a temp directory, as `tests/compress.test.js` and `tests/prune.test.js` do.
- A command that prompts needs a flag that skips the prompt, with a test that runs it with empty stdin.
- A new command goes in `src/commands/`, is registered in `src/cli.js`, and gets `tests/<name>.test.js`.

Docs: README.md, QUICK_START.md, UNIVERSAL_SETUP.md, CONTRIBUTING.md.
