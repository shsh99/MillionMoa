# Categorized Expense Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single monthly expense amount with persistent fixed, living, and irregular expense items whose recurring equivalents drive dashboard cash flow.

**Architecture:** A focused expense model owns category metadata and recurrence calculations. `FinanceScenarioInput` stores canonical expense items and keeps `monthlyNonLoanExpense` as a derived compatibility field. Storage moves to version 2 and migrates version 1 totals into one legacy monthly item. A controlled editor plugs into `DashboardOverview` and uses the existing `MoneyInput` and wallet visual tokens.

**Tech Stack:** Next.js 15, React 19, TypeScript, Zod, Tailwind CSS, Lucide React, Vitest, Testing Library.

---

### Task 1: Expense domain model

**Files:**
- Create: `src/features/dashboard/expense-management-model.ts`
- Create: `src/features/dashboard/expense-management-model.test.ts`

- [ ] **Step 1: Write failing recurrence and grouping tests**

Cover monthly, weekly (`amount * 52 / 12`), quarterly (`amount / 3`), annual (`amount / 12`), one-time exclusion, aggregate rounding, and fixed/living/irregular subtotals.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/features/dashboard/expense-management-model.test.ts`
Expected: FAIL because the expense model exports do not exist.

- [ ] **Step 3: Implement the minimal typed model**

Define `ExpenseKind`, `ExpenseFrequency`, `ExpenseItem`, stable Korean category metadata, `calculateMonthlyExpenseEquivalent`, `calculateAnnualExpenseEquivalent`, `calculateExpenseSummary`, and an ISO date validator. Money remains integer KRW; only final totals are rounded.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/features/dashboard/expense-management-model.test.ts`
Expected: all expense model tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/expense-management-model.ts src/features/dashboard/expense-management-model.test.ts
git commit -m "feat: add categorized expense model"
```

### Task 2: Scenario schema and storage migration

**Files:**
- Modify: `src/features/dashboard/finance-scenario-model.ts`
- Modify: `src/features/dashboard/finance-scenario-model.test.ts`
- Modify: `src/features/dashboard/finance-scenario-storage.ts`
- Modify: `src/features/dashboard/finance-scenario-storage.test.ts`

- [ ] **Step 1: Write failing scenario and migration tests**

Require `expenses` in version 2 scenarios, derive `monthlyNonLoanExpense` from recurring items, reject invalid amounts/dates/category-kind pairs, save a version 2 envelope, load version 2, and migrate a version 1 aggregate into one `living.other` monthly item without changing the old total.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/features/dashboard/finance-scenario-model.test.ts src/features/dashboard/finance-scenario-storage.test.ts`
Expected: FAIL on missing expense schema and version 2 migration.

- [ ] **Step 3: Implement schema integration and migration**

Add bounded expense arrays, validate the expense contract with Zod, calculate scenario expenses through the expense summary, and support reading both version 1 and version 2 envelopes while writing only version 2. Preserve owner-scoped keys and payload limits.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/features/dashboard/finance-scenario-model.test.ts src/features/dashboard/finance-scenario-storage.test.ts`
Expected: scenario and storage tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/finance-scenario-model.ts src/features/dashboard/finance-scenario-model.test.ts src/features/dashboard/finance-scenario-storage.ts src/features/dashboard/finance-scenario-storage.test.ts
git commit -m "feat: persist categorized expenses"
```

### Task 3: Responsive expense editor

**Files:**
- Create: `src/features/dashboard/expense-management-editor.tsx`
- Create: `src/features/dashboard/expense-management-editor.test.tsx`

- [ ] **Step 1: Write failing interaction tests**

Cover three accessible kind tabs, category subtotals, add, edit, cumulative quick amounts, frequency-dependent scheduling fields, duplicate, confirmed undo-delete, empty state, and immutable `onChange` output.

- [ ] **Step 2: Run the component test and verify RED**

Run: `npm test -- src/features/dashboard/expense-management-editor.test.tsx`
Expected: FAIL because the editor does not exist.

- [ ] **Step 3: Implement the wallet-style editor**

Use a flat item list with borders and one unframed selected-item editor. Reuse `MoneyInput`, Lucide icons, 44px controls, persistent labels, real tabs, visible focus, `aria-live`, and an undo action. Mobile is one column; desktop uses list/editor columns. Do not add nested cards or horizontal scrolling.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/features/dashboard/expense-management-editor.test.tsx`
Expected: all editor tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/expense-management-editor.tsx src/features/dashboard/expense-management-editor.test.tsx
git commit -m "feat: add expense management editor"
```

### Task 4: Dashboard integration

**Files:**
- Modify: `src/features/dashboard/dashboard-overview.tsx`
- Modify: `src/features/dashboard/dashboard-overview.test.tsx`

- [ ] **Step 1: Write failing integration tests**

Assert that sample expense items render, the derived expense total replaces direct aggregate editing, expense changes update surplus and goal projections exactly once, and reloading restores the item list.

- [ ] **Step 2: Run the integration test and verify RED**

Run: `npm test -- src/features/dashboard/dashboard-overview.test.tsx`
Expected: FAIL because expense management is not connected.

- [ ] **Step 3: Integrate canonical expenses**

Seed representative housing, telecom, food, transport, and subscription items. Place the editor below monthly cash flow, show the derived recurring total as read-only, and pass scenario changes through the existing hydration-safe persistence flow.

- [ ] **Step 4: Run focused and full verification**

Run: `npm test -- src/features/dashboard/dashboard-overview.test.tsx && npm test -- --run && npm run lint && npm run typecheck`
Expected: all commands pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/dashboard-overview.tsx src/features/dashboard/dashboard-overview.test.tsx
git commit -m "feat: connect expenses to dashboard cash flow"
```

### Task 5: Review, browser QA, and integration

**Files:**
- Review all files changed by Tasks 1-4.

- [ ] **Step 1: Run independent spec and quality reviews**

Require no unresolved Critical or Important findings. Verify user-scoped persistence, no double counting, destructive-action recovery, keyboard operation, and no nested-card regression.

- [ ] **Step 2: Run production verification**

Run: `npm test -- --run`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`.
Expected: all commands pass.

- [ ] **Step 3: Browser QA**

Verify at 390x844 and 1440x900: no page overflow, tabs and editor work, quick amount buttons accumulate, delete can be undone, expense totals change cash-flow surplus, reload persists items, charts render, and console has no errors.

- [ ] **Step 4: PR automation**

Push `feat/expense-management`, open a template-based PR to `dev`, record review evidence, squash merge after checks, update local `dev`, and create the next `feat/*` branch.
