# Calculator Export Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a stable calculator export surface so feature code can import pure finance calculators from `@/lib/calculators` instead of deep file paths.

**Architecture:** Add `index.ts` barrel files for `src/lib/calculators` and `src/lib/calculators/cash-allocation`. Export production calculator modules only; never export test files. Add a public import test that exercises representative calculators through the top-level surface.

**Tech Stack:** TypeScript, Vitest.

---

## File Structure

- Create: `src/lib/calculators/index.ts`
  - Exports all production calculator modules.
- Create: `src/lib/calculators/cash-allocation/index.ts`
  - Exports cash allocation calculators.
- Create: `src/lib/calculators/index.test.ts`
  - Verifies representative functions can be imported from `@/lib/calculators`.

## Task 1: Calculator Export Surface

**Files:**
- Create: `src/lib/calculators/index.test.ts`
- Create: `src/lib/calculators/index.ts`
- Create: `src/lib/calculators/cash-allocation/index.ts`

- [x] **Step 1: Write the failing test**

Create a test that imports calculator functions from `@/lib/calculators`.

- [x] **Step 2: Verify RED**

Run:

```bash
npm test -- src/lib/calculators/index.test.ts
```

Expected: fails because `src/lib/calculators/index.ts` does not exist.

- [x] **Step 3: Create minimal implementation**

Add barrel exports for production calculator modules.

- [x] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/calculators/index.test.ts
```

Expected: export surface test passes.

- [x] **Step 5: Full verification**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all commands exit with code 0. `npm run build` may print the known Next workspace-root warning caused by the parent `C:\Users\ggg99\package-lock.json`.

- [x] **Step 6: Commit**

```bash
git add docs/superpowers/plans/2026-07-14-calculator-export-surface.md src/lib/calculators/index.ts src/lib/calculators/index.test.ts src/lib/calculators/cash-allocation/index.ts
git commit -m "feat: add calculator export surface"
```

## Self-Review

- Scope: Public export files only; no calculator behavior changes.
- Test leakage: Barrel files export production modules, not `*.test.ts`.
- Stability: Top-level alias import is covered by a unit test.
