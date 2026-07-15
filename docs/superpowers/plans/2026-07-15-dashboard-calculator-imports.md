# Dashboard Calculator Imports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate dashboard feature calculator imports to the stable `@/lib/calculators` export surface.

**Architecture:** Update dashboard feature code only. Keep calculator internals using sibling imports to avoid circular dependencies. Do not change calculator behavior or UI copy.

**Tech Stack:** TypeScript, Vitest, React Testing Library.

---

## File Structure

- Update: `src/features/dashboard/goal-quick-planner.tsx`
  - Import `calculateMonthsToGoal` from `@/lib/calculators`.
- Create: `docs/superpowers/plans/2026-07-15-dashboard-calculator-imports.md`
  - Track this migration and verification.

## Task 1: Dashboard Import Migration

**Files:**
- Update: `src/features/dashboard/goal-quick-planner.tsx`
- Create: `docs/superpowers/plans/2026-07-15-dashboard-calculator-imports.md`

- [x] **Step 1: Verify current dashboard tests**

Run:

```bash
npm test -- src/features/dashboard/goal-quick-planner.test.tsx
```

Expected: tests pass before import migration.

- [x] **Step 2: Update import path**

Change `calculateMonthsToGoal` import from `@/lib/calculators/goal-timeline` to `@/lib/calculators`.

- [x] **Step 3: Verify focused tests**

Run:

```bash
npm test -- src/features/dashboard/goal-quick-planner.test.tsx src/lib/calculators/index.test.ts
```

Expected: tests pass.

- [x] **Step 4: Full verification**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all commands exit with code 0. `npm run build` may print the known Next workspace-root warning caused by the parent `C:\Users\ggg99\package-lock.json`.

- [x] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-07-15-dashboard-calculator-imports.md src/features/dashboard/goal-quick-planner.tsx
git commit -m "refactor: use calculator export surface in dashboard"
```

## Self-Review

- Scope: Dashboard import migration only.
- Behavior: No UI copy or calculator logic changes.
- Dependency hygiene: Calculator implementation files still import sibling modules directly, not the top-level barrel.
