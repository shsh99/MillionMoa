# Scenario Projection Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure scenario projection calculator that turns account allocation assumptions into an estimated goal timeline.

**Architecture:** Implement `calculateScenarioProjection` in `src/lib/calculators/scenario-projection.ts` by composing `calculateAllocationReturn` and `calculateMonthsToGoal`. Keep it UI-free and avoid product/tax advice; this calculator only projects a user-defined scenario from supplied account assumptions.

**Tech Stack:** TypeScript, Vitest.

---

## File Structure

- Create: `src/lib/calculators/scenario-projection.ts`
  - Exports `calculateScenarioProjection(input)`.
  - Aggregates account assumptions and then calculates months to a goal.
  - Returns explicit unavailable reasons for invalid allocation or unreachable goal timelines.
- Create: `src/lib/calculators/scenario-projection.test.ts`
  - Covers reachable projection, goal already reached, empty account list, invalid allocation, and no-progress timeline.

## Task 1: Scenario Projection Calculator

**Files:**
- Create: `src/lib/calculators/scenario-projection.test.ts`
- Create: `src/lib/calculators/scenario-projection.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/calculators/scenario-projection.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateScenarioProjection } from "./scenario-projection";

describe("calculateScenarioProjection", () => {
  it("projects a goal timeline from account allocation assumptions", () => {
    expect(
      calculateScenarioProjection({
        goalAmount: 100_000_000,
        accounts: [
          {
            name: "Parking",
            balance: 10_000_000,
            monthlyContribution: 500_000,
            expectedAnnualReturnRate: 0.02,
          },
          {
            name: "ISA",
            balance: 30_000_000,
            monthlyContribution: 1_000_000,
            expectedAnnualReturnRate: 0.06,
          },
        ],
      }),
    ).toEqual({
      status: "reachable",
      totalBalance: 40_000_000,
      totalMonthlyContribution: 1_500_000,
      projectedAnnualReturnRate: 0.05,
      monthsToGoal: 34,
    });
  });

  it("returns zero months when the account balance already reaches the goal", () => {
    expect(
      calculateScenarioProjection({
        goalAmount: 100_000_000,
        accounts: [
          {
            name: "Total assets",
            balance: 100_000_000,
            monthlyContribution: 0,
            expectedAnnualReturnRate: 0,
          },
        ],
      }),
    ).toEqual({
      status: "reachable",
      totalBalance: 100_000_000,
      totalMonthlyContribution: 0,
      projectedAnnualReturnRate: 0,
      monthsToGoal: 0,
    });
  });

  it("marks projection unavailable for an empty account list", () => {
    expect(
      calculateScenarioProjection({
        goalAmount: 100_000_000,
        accounts: [],
      }),
    ).toEqual({
      status: "unavailable",
      reason: "empty-allocation",
      totalBalance: 0,
      totalMonthlyContribution: 0,
      projectedAnnualReturnRate: 0,
      monthsToGoal: null,
    });
  });

  it("passes through invalid allocation reasons", () => {
    expect(
      calculateScenarioProjection({
        goalAmount: 100_000_000,
        accounts: [
          {
            name: "Invalid",
            balance: -1,
            monthlyContribution: 0,
            expectedAnnualReturnRate: 0.03,
          },
        ],
      }),
    ).toEqual({
      status: "unavailable",
      reason: "negative-amount",
      totalBalance: null,
      totalMonthlyContribution: null,
      projectedAnnualReturnRate: null,
      monthsToGoal: null,
    });
  });

  it("marks projection unavailable when the scenario makes no progress", () => {
    expect(
      calculateScenarioProjection({
        goalAmount: 100_000_000,
        accounts: [
          {
            name: "Idle cash",
            balance: 10_000_000,
            monthlyContribution: 0,
            expectedAnnualReturnRate: 0,
          },
        ],
      }),
    ).toEqual({
      status: "unavailable",
      reason: "no-progress",
      totalBalance: 10_000_000,
      totalMonthlyContribution: 0,
      projectedAnnualReturnRate: 0,
      monthsToGoal: null,
    });
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/lib/calculators/scenario-projection.test.ts
```

Expected: fails because `./scenario-projection` does not exist.

- [ ] **Step 3: Create minimal implementation**

Create `src/lib/calculators/scenario-projection.ts`:

```ts
import {
  AllocationAccountInput,
  calculateAllocationReturn,
} from "./allocation-return";
import { calculateMonthsToGoal } from "./goal-timeline";

export type ScenarioProjectionStatus = "reachable" | "unavailable";

export type ScenarioProjectionReason =
  | "empty-allocation"
  | "negative-amount"
  | "invalid-return-rate"
  | "max-months-exceeded"
  | "no-progress";

export type ScenarioProjectionInput = {
  goalAmount: number;
  accounts: AllocationAccountInput[];
  maxMonths?: number;
};

export type ScenarioProjectionResult = {
  status: ScenarioProjectionStatus;
  reason?: ScenarioProjectionReason;
  totalBalance: number | null;
  totalMonthlyContribution: number | null;
  projectedAnnualReturnRate: number | null;
  monthsToGoal: number | null;
};

export function calculateScenarioProjection(
  input: ScenarioProjectionInput,
): ScenarioProjectionResult {
  const allocation = calculateAllocationReturn({ accounts: input.accounts });

  if (allocation.status === "empty") {
    return {
      status: "unavailable",
      reason: "empty-allocation",
      totalBalance: allocation.totalBalance,
      totalMonthlyContribution: allocation.totalMonthlyContribution,
      projectedAnnualReturnRate: allocation.balanceWeightedAnnualReturnRate,
      monthsToGoal: null,
    };
  }

  if (allocation.status === "invalid") {
    return {
      status: "unavailable",
      reason: allocation.reason,
      totalBalance: null,
      totalMonthlyContribution: null,
      projectedAnnualReturnRate: null,
      monthsToGoal: null,
    };
  }

  const timeline = calculateMonthsToGoal({
    currentAmount: allocation.totalBalance,
    goalAmount: input.goalAmount,
    monthlyContribution: allocation.totalMonthlyContribution,
    annualReturnRate: allocation.balanceWeightedAnnualReturnRate,
    maxMonths: input.maxMonths,
  });

  if (!timeline.reached || timeline.months === null) {
    return {
      status: "unavailable",
      reason: timeline.reason,
      totalBalance: allocation.totalBalance,
      totalMonthlyContribution: allocation.totalMonthlyContribution,
      projectedAnnualReturnRate: allocation.balanceWeightedAnnualReturnRate,
      monthsToGoal: null,
    };
  }

  return {
    status: "reachable",
    totalBalance: allocation.totalBalance,
    totalMonthlyContribution: allocation.totalMonthlyContribution,
    projectedAnnualReturnRate: allocation.balanceWeightedAnnualReturnRate,
    monthsToGoal: timeline.months,
  };
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/calculators/scenario-projection.test.ts
```

Expected: 5 tests pass.

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
git add docs/superpowers/plans/2026-07-13-scenario-projection-calculator.md src/lib/calculators/scenario-projection.ts src/lib/calculators/scenario-projection.test.ts
git commit -m "feat: add scenario projection calculator"
```

## Self-Review

- Spec coverage: Implements the scenario calculator bridge between account allocation and goal timeline projection.
- Placeholder scan: No TBD/TODO placeholders.
- Type consistency: Uses `AllocationAccountInput`, decimal annual return rates, and `calculateMonthsToGoal` result semantics.
