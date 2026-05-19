---
name: ship
description: Agent closing workflow. Lints, builds, commits, and pushes the branch. Never creates PRs or marks items [x].
---

# /ship — agent closing workflow

Invoke this at the end of every agent session (frontend, services, devops).

## What /ship does

1. Run `npm run lint` — must pass with zero errors.
2. Run `npm run build` — must pass with zero TypeScript errors.
3. Commit any remaining changes with a conventional commit message.
4. Push the branch to origin.

## What /ship does NOT do

- Does not run `gh pr create` or `gh pr merge` — the coordinator creates PRs.
- Does not delete branches.

## Fail-loud rule

If lint or build fails, `/ship` stops. Do not push. Report the failure and wait for guidance. Never use `--no-verify` to bypass.

## Work type detection

| Changed files | Scope |
|---------------|-------|
| `src/components/**`, `src/pages/**`, `src/index.css` | `ui` |
| `src/services/**`, `src/contexts/**`, `src/hooks/**`, `src/types/**`, `src/constants/**`, `src/config/**` | `services` |
| `vite.config.ts`, `tailwind.config.js`, `tsconfig*.json`, `package.json`, `.env.example` | `config` |

## Verification

```bash
npm run lint    # Zero ESLint errors
npm run build   # Zero TypeScript errors, clean Vite build
```

Both must pass before committing.

## Commit format

```
feat(ui): add saved listings empty state
fix(services): guard Supabase call in report service
chore(config): update Tailwind content paths
```

Valid types: `feat`, `fix`, `refactor`, `chore`, `docs`
Valid scopes: `ui`, `services`, `config`, `docs`

## On failure

Report which step failed with the exact error output. Do not push. Do not attempt workarounds that bypass the failure.
