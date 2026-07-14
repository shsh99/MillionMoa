# Month-End Sweep Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure month-end sweep calculator that derives actual leftover cash from month-end actuals and allocates it into ordered sweep targets.

**Architecture:** Implement `sweepMonthEndCash` in `src/lib/calculators/cash-allocation/month-end-sweep.ts`. This calculator is separate from payday cash bucket planning: it uses actual income received, actual expenses paid, planned transfers already made, and reserved cash to derive sweepable month-end cash. It never accepts `allocateCashBuckets().unassignedCash` or projected monthly surplus as sweepable money.

**Tech Stack:** TypeScript, Vitest.

---

## File Structure

- Create: `src/lib/calculators/cash-allocation/month-end-sweep.ts`
  - Exports `sweepMonthEndCash(input)`.
  - Uses explicit KRW numbers and does not format values.
  - Allocates targets in input order from `source: "actual-month-end-leftover"`.
  - Returns swept, unmet, and unallocated amounts so callers can verify the cash invariant.
- Create: `src/lib/calculators/cash-allocation/month-end-sweep.test.ts`
  - Covers fully swept, planned surplus consumed by actual expenses, partial sweep, leftover after targets, shortfall, no target, invalid negative amount, non-finite number, non-integer KRW, duplicate target, and cash invariant cases.

## Task 1: Month-End Sweep Calculator

**Files:**
- Create: `src/lib/calculators/cash-allocation/month-end-sweep.test.ts`
- Create: `src/lib/calculators/cash-allocation/month-end-sweep.ts`

- [x] **Step 1: Write the failing test**

Create tests for ordered allocation from actual remaining cash only.

- [x] **Step 2: Verify RED**

Run:

```bash
npm test -- src/lib/calculators/cash-allocation/month-end-sweep.test.ts
```

Expected: fails because `./month-end-sweep` does not exist.

- [x] **Step 3: Create minimal implementation**

Implement validation, ordered sweep allocation, status selection, and explicit totals.

- [x] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/calculators/cash-allocation/month-end-sweep.test.ts
```

Expected: all month-end sweep tests pass.

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
git add docs/superpowers/plans/2026-07-14-month-end-sweep-calculator.md src/lib/calculators/cash-allocation/month-end-sweep.ts src/lib/calculators/cash-allocation/month-end-sweep.test.ts
git commit -m "feat: add month-end sweep calculator"
```

## Self-Review

- Spec coverage: Implements actual month-end leftover cash sweeps for the account flow planner.
- Double-counting guard: The calculator does not accept salary, planned bucket surplus, or projected surplus inputs.
- Safety wording: It returns neutral allocation facts and does not recommend investment products.
- Type consistency: All money values are raw KRW numbers; display formatting remains outside the calculator.
