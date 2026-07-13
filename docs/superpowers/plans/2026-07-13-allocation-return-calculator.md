# Allocation Return Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure account allocation calculator that aggregates balances, monthly contributions, and expected annual returns across manually entered accounts.

**Architecture:** Implement `calculateAllocationReturn` in `src/lib/calculators/allocation-return.ts`. Keep it independent from UI, account persistence, and tax treatment; this calculator only aggregates user-entered assumptions and reports invalid inputs explicitly.

**Tech Stack:** TypeScript, Vitest.

---

## File Structure

- Create: `src/lib/calculators/allocation-return.ts`
  - Exports `calculateAllocationReturn(input)`.
  - Aggregates total balance and monthly contribution.
  - Calculates balance-weighted and contribution-weighted annual return rates.
- Create: `src/lib/calculators/allocation-return.test.ts`
  - Covers mixed accounts, empty account lists, zero contribution weighting, negative values, and out-of-range returns.

## Task 1: Allocation Return Calculator

**Files:**
- Create: `src/lib/calculators/allocation-return.test.ts`
- Create: `src/lib/calculators/allocation-return.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/calculators/allocation-return.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateAllocationReturn } from "./allocation-return";

describe("calculateAllocationReturn", () => {
  it("aggregates account balances, contributions, and weighted returns", () => {
    expect(
      calculateAllocationReturn({
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
      status: "ok",
      totalBalance: 40_000_000,
      totalMonthlyContribution: 1_500_000,
      balanceWeightedAnnualReturnRate: 0.05,
      contributionWeightedAnnualReturnRate: 0.04666666666666667,
    });
  });

  it("returns empty status for no accounts", () => {
    expect(calculateAllocationReturn({ accounts: [] })).toEqual({
      status: "empty",
      totalBalance: 0,
      totalMonthlyContribution: 0,
      balanceWeightedAnnualReturnRate: 0,
      contributionWeightedAnnualReturnRate: 0,
    });
  });

  it("returns zero contribution weighted return when monthly contributions are zero", () => {
    expect(
      calculateAllocationReturn({
        accounts: [
          {
            name: "Existing savings",
            balance: 5_000_000,
            monthlyContribution: 0,
            expectedAnnualReturnRate: 0.03,
          },
        ],
      }),
    ).toEqual({
      status: "ok",
      totalBalance: 5_000_000,
      totalMonthlyContribution: 0,
      balanceWeightedAnnualReturnRate: 0.03,
      contributionWeightedAnnualReturnRate: 0,
    });
  });

  it("rejects negative balances or contributions", () => {
    expect(
      calculateAllocationReturn({
        accounts: [
          {
            name: "Invalid",
            balance: -1,
            monthlyContribution: 100_000,
            expectedAnnualReturnRate: 0.03,
          },
        ],
      }),
    ).toEqual({
      status: "invalid",
      reason: "negative-amount",
      totalBalance: null,
      totalMonthlyContribution: null,
      balanceWeightedAnnualReturnRate: null,
      contributionWeightedAnnualReturnRate: null,
    });
  });

  it("rejects return assumptions outside the simple model bounds", () => {
    expect(
      calculateAllocationReturn({
        accounts: [
          {
            name: "Unbounded",
            balance: 1_000_000,
            monthlyContribution: 100_000,
            expectedAnnualReturnRate: 0.75,
          },
        ],
      }),
    ).toEqual({
      status: "invalid",
      reason: "invalid-return-rate",
      totalBalance: null,
      totalMonthlyContribution: null,
      balanceWeightedAnnualReturnRate: null,
      contributionWeightedAnnualReturnRate: null,
    });
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/lib/calculators/allocation-return.test.ts
```

Expected: fails because `./allocation-return` does not exist.

- [ ] **Step 3: Create minimal implementation**

Create `src/lib/calculators/allocation-return.ts`:

```ts
export type AllocationAccountInput = {
  name: string;
  balance: number;
  monthlyContribution: number;
  expectedAnnualReturnRate: number;
};

export type AllocationReturnStatus = "ok" | "empty" | "invalid";

export type AllocationReturnReason = "negative-amount" | "invalid-return-rate";

export type AllocationReturnInput = {
  accounts: AllocationAccountInput[];
};

export type AllocationReturnResult = {
  status: AllocationReturnStatus;
  reason?: AllocationReturnReason;
  totalBalance: number | null;
  totalMonthlyContribution: number | null;
  balanceWeightedAnnualReturnRate: number | null;
  contributionWeightedAnnualReturnRate: number | null;
};

function weightedAverage(
  accounts: AllocationAccountInput[],
  weightKey: "balance" | "monthlyContribution",
): number {
  const totalWeight = accounts.reduce((sum, account) => sum + account[weightKey], 0);

  if (totalWeight === 0) {
    return 0;
  }

  return accounts.reduce((sum, account) => {
    return sum + account.expectedAnnualReturnRate * (account[weightKey] / totalWeight);
  }, 0);
}

export function calculateAllocationReturn(input: AllocationReturnInput): AllocationReturnResult {
  if (input.accounts.length === 0) {
    return {
      status: "empty",
      totalBalance: 0,
      totalMonthlyContribution: 0,
      balanceWeightedAnnualReturnRate: 0,
      contributionWeightedAnnualReturnRate: 0,
    };
  }

  if (input.accounts.some((account) => account.balance < 0 || account.monthlyContribution < 0)) {
    return {
      status: "invalid",
      reason: "negative-amount",
      totalBalance: null,
      totalMonthlyContribution: null,
      balanceWeightedAnnualReturnRate: null,
      contributionWeightedAnnualReturnRate: null,
    };
  }

  if (
    input.accounts.some((account) => {
      return account.expectedAnnualReturnRate < -1 || account.expectedAnnualReturnRate > 0.5;
    })
  ) {
    return {
      status: "invalid",
      reason: "invalid-return-rate",
      totalBalance: null,
      totalMonthlyContribution: null,
      balanceWeightedAnnualReturnRate: null,
      contributionWeightedAnnualReturnRate: null,
    };
  }

  const totalBalance = input.accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalMonthlyContribution = input.accounts.reduce((sum, account) => {
    return sum + account.monthlyContribution;
  }, 0);

  return {
    status: "ok",
    totalBalance,
    totalMonthlyContribution,
    balanceWeightedAnnualReturnRate: weightedAverage(input.accounts, "balance"),
    contributionWeightedAnnualReturnRate: weightedAverage(input.accounts, "monthlyContribution"),
  };
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/calculators/allocation-return.test.ts
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
git add docs/superpowers/plans/2026-07-13-allocation-return-calculator.md src/lib/calculators/allocation-return.ts src/lib/calculators/allocation-return.test.ts
git commit -m "feat: add allocation return calculator"
```

## Self-Review

- Spec coverage: Implements the account allocation calculator needed before scenario and fastest-path calculation.
- Placeholder scan: No TBD/TODO placeholders.
- Type consistency: Annual returns are decimals, matching existing goal timeline and spending-impact calculators.
