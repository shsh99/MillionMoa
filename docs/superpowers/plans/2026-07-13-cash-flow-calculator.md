# Cash Flow Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure cash-flow calculator that turns monthly income, fixed costs, variable spending, and reserves into investable surplus and saving-rate metrics.

**Architecture:** Keep the calculator in `src/lib/calculators/cash-flow.ts` as a pure function with no UI, persistence, policy, or formatting dependencies. Return explicit status and reason fields so downstream UI can distinguish valid surplus, negative cash flow, and invalid input.

**Tech Stack:** TypeScript, Vitest.

---

## File Structure

- Create: `src/lib/calculators/cash-flow.ts`
  - Exports `calculateMonthlyCashFlow(input)`.
  - Uses KRW integer-like numbers as input and returns raw numeric calculation results.
- Create: `src/lib/calculators/cash-flow.test.ts`
  - Covers normal surplus, negative cash flow, zero income, and invalid negative amount behavior.

## Task 1: Cash Flow Calculator

**Files:**
- Create: `src/lib/calculators/cash-flow.test.ts`
- Create: `src/lib/calculators/cash-flow.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/calculators/cash-flow.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateMonthlyCashFlow } from "./cash-flow";

describe("calculateMonthlyCashFlow", () => {
  it("calculates investable surplus and saving rate from monthly cash flow", () => {
    expect(
      calculateMonthlyCashFlow({
        monthlyIncome: 3_000_000,
        fixedCosts: 900_000,
        variableSpending: 700_000,
        reserveContribution: 300_000,
      }),
    ).toEqual({
      status: "surplus",
      monthlyIncome: 3_000_000,
      totalOutflow: 1_900_000,
      investableSurplus: 1_100_000,
      savingRate: 0.36666666666666664,
    });
  });

  it("marks negative cash flow when outflow exceeds income", () => {
    expect(
      calculateMonthlyCashFlow({
        monthlyIncome: 2_000_000,
        fixedCosts: 1_200_000,
        variableSpending: 900_000,
        reserveContribution: 100_000,
      }),
    ).toEqual({
      status: "deficit",
      reason: "negative-cash-flow",
      monthlyIncome: 2_000_000,
      totalOutflow: 2_200_000,
      investableSurplus: -200_000,
      savingRate: -0.1,
    });
  });

  it("returns zero saving rate when income is zero and outflow is zero", () => {
    expect(
      calculateMonthlyCashFlow({
        monthlyIncome: 0,
        fixedCosts: 0,
        variableSpending: 0,
        reserveContribution: 0,
      }),
    ).toEqual({
      status: "balanced",
      monthlyIncome: 0,
      totalOutflow: 0,
      investableSurplus: 0,
      savingRate: 0,
    });
  });

  it("rejects negative input amounts", () => {
    expect(
      calculateMonthlyCashFlow({
        monthlyIncome: 3_000_000,
        fixedCosts: -1,
        variableSpending: 700_000,
        reserveContribution: 300_000,
      }),
    ).toEqual({
      status: "invalid",
      reason: "negative-input",
      monthlyIncome: 3_000_000,
      totalOutflow: null,
      investableSurplus: null,
      savingRate: null,
    });
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/lib/calculators/cash-flow.test.ts
```

Expected: fails because `./cash-flow` does not exist.

- [ ] **Step 3: Create minimal implementation**

Create `src/lib/calculators/cash-flow.ts`:

```ts
export type CashFlowStatus = "surplus" | "balanced" | "deficit" | "invalid";

export type CashFlowReason = "negative-cash-flow" | "negative-input";

export type MonthlyCashFlowInput = {
  monthlyIncome: number;
  fixedCosts: number;
  variableSpending: number;
  reserveContribution: number;
};

export type MonthlyCashFlowResult = {
  status: CashFlowStatus;
  reason?: CashFlowReason;
  monthlyIncome: number;
  totalOutflow: number | null;
  investableSurplus: number | null;
  savingRate: number | null;
};

export function calculateMonthlyCashFlow(input: MonthlyCashFlowInput): MonthlyCashFlowResult {
  const amounts = [
    input.monthlyIncome,
    input.fixedCosts,
    input.variableSpending,
    input.reserveContribution,
  ];

  if (amounts.some((amount) => amount < 0)) {
    return {
      status: "invalid",
      reason: "negative-input",
      monthlyIncome: input.monthlyIncome,
      totalOutflow: null,
      investableSurplus: null,
      savingRate: null,
    };
  }

  const totalOutflow = input.fixedCosts + input.variableSpending + input.reserveContribution;
  const investableSurplus = input.monthlyIncome - totalOutflow;
  const savingRate = input.monthlyIncome === 0 ? 0 : investableSurplus / input.monthlyIncome;

  if (investableSurplus < 0) {
    return {
      status: "deficit",
      reason: "negative-cash-flow",
      monthlyIncome: input.monthlyIncome,
      totalOutflow,
      investableSurplus,
      savingRate,
    };
  }

  return {
    status: investableSurplus === 0 ? "balanced" : "surplus",
    monthlyIncome: input.monthlyIncome,
    totalOutflow,
    investableSurplus,
    savingRate,
  };
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/calculators/cash-flow.test.ts
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
git add docs/superpowers/plans/2026-07-13-cash-flow-calculator.md src/lib/calculators/cash-flow.ts src/lib/calculators/cash-flow.test.ts
git commit -m "feat: add cash flow calculator"
```

## Self-Review

- Spec coverage: This implements only the first pure cash-flow calculator needed before salary, account allocation, or fastest-path work.
- Placeholder scan: No TBD/TODO placeholders.
- Type consistency: `calculateMonthlyCashFlow` returns explicit status, optional reason, and raw numeric metrics.
