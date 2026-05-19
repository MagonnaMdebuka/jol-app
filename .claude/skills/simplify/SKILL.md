---
name: simplify
description: Code simplification. Applies craft standards to changed files — enforces file length, function length, handler thinness, type safety, and duplication limits.
---

# /simplify — craft simplification

Invoke on changed source files after verification passes. It is the structural quality gate.

## What /simplify does

For each changed source file (from `git diff origin/main...HEAD --name-only`):

1. Read the file.
2. Measure against craft targets (see checklist below).
3. Refactor violations — extract, split, rename, deduplicate. Do not change behaviour.
4. Re-run tests after changes. If tests fail, revert and investigate.

## What /simplify skips

- Test files (`**/__tests__/**`, `**/*.test.*`, `**/*.spec.*`)
- Config files (`*.config.*`, `*.json`, `*.yaml`, `*.yml`)
- Type declaration files (`*.d.ts`)
- Barrel exports (`**/index.ts` that only re-export)

## Craft checklist

### All TypeScript/TSX files

| # | Check | Target | Fix |
|---|-------|--------|-----|
| 1 | File length | Route ≤ 300, component ≤ 250 | Split file or extract services/hooks |
| 2 | Function length | No function body > 50 lines | Extract named functions |
| 3 | `as any` / `as unknown` | Every cast has inline justification | Add comment or eliminate |
| 4 | Duplicate blocks | No block of 15+ lines appears twice | Extract shared function |
| 5 | Non-null assertions | Every `!` has inline justification | Add comment or refactor |

### Route handler files (`packages/api/src/**`)

| # | Check | Target | Fix |
|---|-------|--------|-----|
| 6 | Handler body length | ≤ 30 lines per handler | Extract to service |
| 7 | Database queries in handler | No direct Prisma calls in route handlers | Move to service |

### React component files (`packages/portal/src/**/*.tsx`)

| # | Check | Target | Fix |
|---|-------|--------|-----|
| 6 | `useState` count | ≤ 5 per component | Extract custom hook or useReducer |
| 7 | Inline validation | No `if (field.length < N)` chains | Yup schema |
| 8 | Inline mutations | No `axios.post()` in component body | Extract to custom hook |

### Shell scripts (`scripts/**`, `.husky/**`)

| # | Check | Target | Fix |
|---|-------|--------|-----|
| 6 | Script length | ≤ 100 lines | Extract functions or split |
| 7 | Error handling | `set -euo pipefail` present | Add it |

## How to apply fixes

1. **Extract, do not delete.** Moving logic to a service is safe.
2. **One file at a time.** Simplify, test, confirm green, then move to the next.
3. **Preserve behaviour.** If a test fails, revert and try again.
4. **Commit separately.** `refactor(scope): simplify <summary>`.
