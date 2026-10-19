---
name: token-optimizer
description: Measure, audit, and shrink CLAUDE.md token usage. Use when the user asks about startup tokens, CLAUDE.md size, or context bloat.
---
Run `npx -y claude-token-optimizer measure` in the project root and report the token counts.
For structure problems run `npx -y claude-token-optimizer audit --json`.
To shrink CLAUDE.md, first show `npx -y claude-token-optimizer compress --dry-run`, and apply with `--yes` only after the user agrees.
