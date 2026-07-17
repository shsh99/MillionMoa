# Category Finance Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a category-based planner that derives net worth and monthly saving capacity while keeping loan-impact calculations usable on mobile.

**Architecture:** Add a focused category-model module for signed totals and immutable row operations. Refactor `GoalQuickPlanner` into a tabbed editor that consumes those pure helpers and feeds existing goal and loan calculators.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library

---

### Task 1: Category Model

**Files:**
- Create: `src/features/dashboard/finance-category-model.ts`
- Create: `src/features/dashboard/finance-category-model.test.ts`

- [ ] Write tests proving asset/liability and income/expense totals derive signed values, including negative net worth.
- [ ] Run `npm test -- --run src/features/dashboard/finance-category-model.test.ts` and confirm the missing-module failure.
- [ ] Implement typed rows, total derivation, immutable update, add, remove, and restore helpers.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Tabbed Category Editor

**Files:**
- Modify: `src/features/dashboard/goal-quick-planner.tsx`
- Modify: `src/features/dashboard/goal-quick-planner.test.tsx`

- [ ] Add tests for the four tabs, derived default totals, cumulative row quick buttons, custom row creation, removal, undo, and negative net worth.
- [ ] Run the focused component test and confirm the new assertions fail for missing category interactions.
- [ ] Replace flat money cards with a summary rail, semantic tabs, compact editable rows, preset add controls, and undo feedback.
- [ ] Feed derived net worth and monthly saving capacity into existing goal and loan calculators.
- [ ] Re-run focused model and component tests until green.

### Task 3: Dashboard Integration And Visual QA

**Files:**
- Modify: `src/features/dashboard/dashboard-overview.test.tsx`
- Modify only if required: `src/features/dashboard/dashboard-overview.tsx`
- Modify only if required: `src/app/globals.css`

- [ ] Update integration assertions to use category-derived inputs and tab navigation.
- [ ] Run dashboard tests and fix only integration regressions.
- [ ] Verify mobile and desktop layouts in the browser, including no horizontal overflow and 44px touch targets.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

### Task 4: Review And Integration

**Files:**
- Review all changed files from `git diff --check` and `git diff --stat`.

- [ ] Request independent frontend/QA review and resolve blocking findings.
- [ ] Commit the verified changes and push the feature branch.
- [ ] Open a PR to `dev` using the repository template, review checks, add review feedback, and squash merge.
- [ ] Fast-forward local `dev` and create the next `feat/*` branch.
