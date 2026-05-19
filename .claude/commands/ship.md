---
description: Agent pre-push gate — lint, build, commit, push. Run at the end of every agent session before handing off to the coordinator.
allowed-tools: Bash(npm run lint), Bash(npm run build), Bash(git *), Edit, Read, Glob
---

# /ship — Agent Pre-Push Gate

Run quality checks, commit, and push. Stop on first failure and report what broke.

## Steps

Execute in order. If any step fails, stop and report the error.

**Step 1 — Lint**
Run `npm run lint`. Must pass with zero errors.

**Step 2 — Build**
Run `npm run build`. Must pass with zero TypeScript errors.

**Step 3 — Commit**
Stage changed source files. Commit with a conventional commit message: `type(scope): description`.

Do not commit:
- `.env` files or any file containing secrets
- `dist/` build artefacts
- `node_modules/`

**Step 4 — Push**
Run `git push origin <branch>`.

## On failure

Report which step failed and paste the exact error. Do not push. Do not use `--no-verify`.

## What /ship does NOT do

- Does not create a PR — that is the coordinator's role
- Does not merge to `main`
- Does not delete branches
