# Scenario Comparison Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure scenario comparison calculator that evaluates multiple user-defined account scenarios and identifies the fastest reachable projection without presenting it as investment advice.

**Architecture:** Implement `compareScenarioProjections` in `src/lib/calculators/scenario-comparison.ts` by composing `calculateScenarioProjection`. Keep this as a deterministic comparison layer over user inputs; it ranks reachable scenarios by months to goal and reports base-scenario deltas.

**Tech Stack:** TypeScript, Vitest.

---

## File Structure

- Create: `src/lib/calculators/scenario-comparison.ts`
  - Exports `compareScenarioProjections(input)`.
  - Accepts named scenarios, a `baseScenarioName`, and `goalAmount`.
  - Returns every scenario result plus the fastest reachable scenario name.
- Create: `src/lib/calculators/scenario-comparison.test.ts`
  - Covers fastest scenario ranking, base delta calculation, unavailable scenarios, and missing base handling.

## Task 1: Scenario Comparison Calculator

**Files:**
- Create: `src/lib/calculators/scenario-comparison.test.ts`
- Create: `src/lib/calculators/scenario-comparison.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/calculators/scenario-comparison.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { compareScenarioProjections } from "./scenario-comparison";

describe("compareScenarioProjections", () => {
  it("ranks reachable scenarios and calculates months reduced versus base", () => {
    expect(
      compareScenarioProjections({
        goalAmount: 100_000_000,
        baseScenarioName: "base",
        scenarios: [
          {
            name: "base",
            accounts: [
              {
                name: "Current",
                balance: 10_000_000,
                monthlyContribution: 1_000_000,
                expectedAnnualReturnRate: 0,
              },
            ],
          },
          {
            name: "higher-saving",
            accounts: [
              {
                name: "Current",
                balance: 10_000_000,
                monthlyContribution: 1_200_000,
                expectedAnnualReturnRate: 0,
              },
            ],
          },
          {
            name: "lower-saving",
            accounts: [
              {
                name: "Current",
                balance: 10_000_000,
                monthlyContribution: 900_000,
                expectedAnnualReturnRate: 0,
              },
            ],
          },
        ],
      }),
    ).toEqual({
      status: "ok",
      fastestScenarioName: "higher-saving",
      baseScenarioName: "base",
      scenarios: [
        {
          name: "higher-saving",
          status: "reachable",
          monthsToGoal: 75,
          monthsReducedVsBase: 15,
        },
        {
          name: "base",
          status: "reachable",
          monthsToGoal: 90,
          monthsReducedVsBase: 0,
        },
        {
          name: "lower-saving",
          status: "reachable",
          monthsToGoal: 100,
          monthsReducedVsBase: -10,
        },
      ],
    });
  });

  it("keeps unavailable scenarios after reachable scenarios", () => {
    expect(
      compareScenarioProjections({
        goalAmount: 100_000_000,
        baseScenarioName: "base",
        scenarios: [
          {
            name: "base",
            accounts: [
              {
                name: "Current",
                balance: 10_000_000,
                monthlyContribution: 1_000_000,
                expectedAnnualReturnRate: 0,
              },
            ],
          },
          {
            name: "idle",
            accounts: [
              {
                name: "Idle",
                balance: 10_000_000,
                monthlyContribution: 0,
                expectedAnnualReturnRate: 0,
              },
            ],
          },
        ],
      }),
    ).toEqual({
      status: "ok",
      fastestScenarioName: "base",
      baseScenarioName: "base",
      scenarios: [
        {
          name: "base",
          status: "reachable",
          monthsToGoal: 90,
          monthsReducedVsBase: 0,
        },
        {
          name: "idle",
          status: "unavailable",
          reason: "no-progress",
          monthsToGoal: null,
          monthsReducedVsBase: null,
        },
      ],
    });
  });

  it("returns invalid when the base scenario is missing or unreachable", () => {
    expect(
      compareScenarioProjections({
        goalAmount: 100_000_000,
        baseScenarioName: "missing",
        scenarios: [
          {
            name: "candidate",
            accounts: [
              {
                name: "Current",
                balance: 10_000_000,
                monthlyContribution: 1_000_000,
                expectedAnnualReturnRate: 0,
              },
            ],
          },
        ],
      }),
    ).toEqual({
      status: "invalid",
      reason: "base-scenario-unavailable",
      fastestScenarioName: null,
      baseScenarioName: "missing",
      scenarios: [
        {
          name: "candidate",
          status: "reachable",
          monthsToGoal: 90,
          monthsReducedVsBase: null,
        },
      ],
    });
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/lib/calculators/scenario-comparison.test.ts
```

Expected: fails because `./scenario-comparison` does not exist.

- [ ] **Step 3: Create minimal implementation**

Create `src/lib/calculators/scenario-comparison.ts`:

```ts
import { type AllocationAccountInput } from "./allocation-return";
import {
  calculateScenarioProjection,
  type ScenarioProjectionReason,
} from "./scenario-projection";

export type ScenarioComparisonInput = {
  goalAmount: number;
  baseScenarioName: string;
  scenarios: {
    name: string;
    accounts: AllocationAccountInput[];
  }[];
  maxMonths?: number;
};

export type ScenarioComparisonStatus = "ok" | "invalid";

export type ScenarioComparisonReason = "base-scenario-unavailable";

export type ComparedScenario = {
  name: string;
  status: "reachable" | "unavailable";
  reason?: ScenarioProjectionReason;
  monthsToGoal: number | null;
  monthsReducedVsBase: number | null;
};

export type ScenarioComparisonResult = {
  status: ScenarioComparisonStatus;
  reason?: ScenarioComparisonReason;
  fastestScenarioName: string | null;
  baseScenarioName: string;
  scenarios: ComparedScenario[];
};

function sortComparedScenarios(scenarios: ComparedScenario[]): ComparedScenario[] {
  return [...scenarios].sort((left, right) => {
    if (left.monthsToGoal === null && right.monthsToGoal === null) {
      return left.name.localeCompare(right.name);
    }

    if (left.monthsToGoal === null) {
      return 1;
    }

    if (right.monthsToGoal === null) {
      return -1;
    }

    return left.monthsToGoal - right.monthsToGoal || left.name.localeCompare(right.name);
  });
}

export function compareScenarioProjections(
  input: ScenarioComparisonInput,
): ScenarioComparisonResult {
  const projected = input.scenarios.map((scenario) => {
    const projection = calculateScenarioProjection({
      goalAmount: input.goalAmount,
      accounts: scenario.accounts,
      maxMonths: input.maxMonths,
    });

    return {
      name: scenario.name,
      projection,
    };
  });

  const base = projected.find((scenario) => {
    return scenario.name === input.baseScenarioName && scenario.projection.status === "reachable";
  });

  const compared = projected.map(({ name, projection }) => {
    if (projection.status === "unavailable") {
      return {
        name,
        status: projection.status,
        reason: projection.reason,
        monthsToGoal: null,
        monthsReducedVsBase: null,
      } satisfies ComparedScenario;
    }

    return {
      name,
      status: projection.status,
      monthsToGoal: projection.monthsToGoal,
      monthsReducedVsBase:
        base && projection.monthsToGoal !== null && base.projection.monthsToGoal !== null
          ? base.projection.monthsToGoal - projection.monthsToGoal
          : null,
    } satisfies ComparedScenario;
  });

  const sorted = sortComparedScenarios(compared);
  const fastest = sorted.find((scenario) => scenario.status === "reachable") ?? null;

  if (!base) {
    return {
      status: "invalid",
      reason: "base-scenario-unavailable",
      fastestScenarioName: null,
      baseScenarioName: input.baseScenarioName,
      scenarios: sorted,
    };
  }

  return {
    status: "ok",
    fastestScenarioName: fastest?.name ?? null,
    baseScenarioName: input.baseScenarioName,
    scenarios: sorted,
  };
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/calculators/scenario-comparison.test.ts
```

Expected: 3 tests pass.

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
git add docs/superpowers/plans/2026-07-14-scenario-comparison-calculator.md src/lib/calculators/scenario-comparison.ts src/lib/calculators/scenario-comparison.test.ts
git commit -m "feat: add scenario comparison calculator"
```

## Self-Review

- Spec coverage: Implements the scenario comparison calculator needed for conservative/base/optimistic scenario display.
- Placeholder scan: No TBD/TODO placeholders.
- Type consistency: Uses `AllocationAccountInput`, `ScenarioProjectionReason`, and `monthsReducedVsBase` sign semantics consistently.
