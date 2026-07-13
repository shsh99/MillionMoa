# Spending Impact Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure calculator that compares a baseline monthly contribution against a changed contribution and reports how many months the goal timeline is shortened or delayed.

**Architecture:** Implement `calculateSpendingImpact` in `src/lib/calculators/spending-impact.ts` by composing the existing `calculateMonthsToGoal` calculator. Keep this module UI-free and return explicit comparison status so downstream screens can avoid presenting impossible or invalid scenarios as recommendations.

**Tech Stack:** TypeScript, Vitest.

---

## File Structure

- Create: `src/lib/calculators/spending-impact.ts`
  - Exports `calculateSpendingImpact(input)`.
  - Calls `calculateMonthsToGoal` for baseline and changed contribution scenarios.
  - Returns `monthsReduced` as a positive number when the changed scenario is faster and a negative number when it is slower.
- Create: `src/lib/calculators/spending-impact.test.ts`
  - Covers shortened, delayed, unchanged, and comparison-unavailable cases.

## Task 1: Spending Impact Calculator

**Files:**
- Create: `src/lib/calculators/spending-impact.test.ts`
- Create: `src/lib/calculators/spending-impact.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/calculators/spending-impact.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateSpendingImpact } from "./spending-impact";

describe("calculateSpendingImpact", () => {
  it("reports months shortened when monthly contribution increases", () => {
    expect(
      calculateSpendingImpact({
        currentAmount: 10_000_000,
        goalAmount: 100_000_000,
        baselineMonthlyContribution: 1_000_000,
        changedMonthlyContribution: 1_200_000,
        annualReturnRate: 0,
      }),
    ).toEqual({
      status: "shortened",
      baselineMonths: 90,
      changedMonths: 75,
      monthsReduced: 15,
    });
  });

  it("reports months delayed when monthly contribution decreases", () => {
    expect(
      calculateSpendingImpact({
        currentAmount: 10_000_000,
        goalAmount: 100_000_000,
        baselineMonthlyContribution: 1_000_000,
        changedMonthlyContribution: 900_000,
        annualReturnRate: 0,
      }),
    ).toEqual({
      status: "delayed",
      baselineMonths: 90,
      changedMonths: 100,
      monthsReduced: -10,
    });
  });

  it("reports unchanged when both contribution scenarios take the same months", () => {
    expect(
      calculateSpendingImpact({
        currentAmount: 10_000_000,
        goalAmount: 100_000_000,
        baselineMonthlyContribution: 1_000_000,
        changedMonthlyContribution: 1_000_000,
        annualReturnRate: 0,
      }),
    ).toEqual({
      status: "unchanged",
      baselineMonths: 90,
      changedMonths: 90,
      monthsReduced: 0,
    });
  });

  it("marks the comparison unavailable when either scenario cannot reach the goal", () => {
    expect(
      calculateSpendingImpact({
        currentAmount: 10_000_000,
        goalAmount: 100_000_000,
        baselineMonthlyContribution: 1_000_000,
        changedMonthlyContribution: 0,
        annualReturnRate: 0,
      }),
    ).toEqual({
      status: "unavailable",
      reason: "changed-no-progress",
      baselineMonths: 90,
      changedMonths: null,
      monthsReduced: null,
    });
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/lib/calculators/spending-impact.test.ts
```

Expected: fails because `./spending-impact` does not exist.

- [ ] **Step 3: Create minimal implementation**

Create `src/lib/calculators/spending-impact.ts`:

```ts
import { calculateMonthsToGoal } from "./goal-timeline";

export type SpendingImpactStatus = "shortened" | "delayed" | "unchanged" | "unavailable";

export type SpendingImpactReason =
  | "baseline-invalid-return-rate"
  | "baseline-max-months-exceeded"
  | "baseline-no-progress"
  | "changed-invalid-return-rate"
  | "changed-max-months-exceeded"
  | "changed-no-progress";

export type SpendingImpactInput = {
  currentAmount: number;
  goalAmount: number;
  baselineMonthlyContribution: number;
  changedMonthlyContribution: number;
  annualReturnRate: number;
  maxMonths?: number;
};

export type SpendingImpactResult = {
  status: SpendingImpactStatus;
  reason?: SpendingImpactReason;
  baselineMonths: number | null;
  changedMonths: number | null;
  monthsReduced: number | null;
};

function mapUnavailableReason(
  side: "baseline" | "changed",
  reason: "invalid-return-rate" | "max-months-exceeded" | "no-progress" | undefined,
): SpendingImpactReason {
  return `${side}-${reason ?? "max-months-exceeded"}` as SpendingImpactReason;
}

export function calculateSpendingImpact(input: SpendingImpactInput): SpendingImpactResult {
  const baseTimelineInput = {
    currentAmount: input.currentAmount,
    goalAmount: input.goalAmount,
    annualReturnRate: input.annualReturnRate,
    maxMonths: input.maxMonths,
  };

  const baseline = calculateMonthsToGoal({
    ...baseTimelineInput,
    monthlyContribution: input.baselineMonthlyContribution,
  });
  const changed = calculateMonthsToGoal({
    ...baseTimelineInput,
    monthlyContribution: input.changedMonthlyContribution,
  });

  if (!baseline.reached || baseline.months === null) {
    return {
      status: "unavailable",
      reason: mapUnavailableReason("baseline", baseline.reason),
      baselineMonths: baseline.months,
      changedMonths: changed.months,
      monthsReduced: null,
    };
  }

  if (!changed.reached || changed.months === null) {
    return {
      status: "unavailable",
      reason: mapUnavailableReason("changed", changed.reason),
      baselineMonths: baseline.months,
      changedMonths: changed.months,
      monthsReduced: null,
    };
  }

  const monthsReduced = baseline.months - changed.months;

  return {
    status: monthsReduced > 0 ? "shortened" : monthsReduced < 0 ? "delayed" : "unchanged",
    baselineMonths: baseline.months,
    changedMonths: changed.months,
    monthsReduced,
  };
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/calculators/spending-impact.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Full verification**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all commands exit with code 0. `npm run build` may print the known Next workspace-root warning caused by the parent `C:\Users\ggg99\package-lock.json`.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/plans/2026-07-13-spending-impact-calculator.md src/lib/calculators/spending-impact.ts src/lib/calculators/spending-impact.test.ts
git commit -m "feat: add spending impact calculator"
```

## Self-Review

- Spec coverage: Implements the spending impact calculator required by the goal simulator and dashboard planning flow.
- Placeholder scan: No TBD/TODO placeholders.
- Type consistency: `monthsReduced` is positive for a shorter timeline, negative for delay, zero for unchanged, and null when comparison is unavailable.
