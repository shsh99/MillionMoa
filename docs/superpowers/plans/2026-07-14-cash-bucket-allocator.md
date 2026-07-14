# Cash Bucket Allocator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure cash bucket allocator that compares monthly take-home pay against user-defined paycheck bucket amounts.

**Architecture:** Implement `allocateCashBuckets` in `src/lib/calculators/cash-allocation/cash-bucket-allocator.ts`. Keep this calculator UI-free and policy-free; it only sums user-entered payday bucket amounts and returns unassigned or overallocated cash. Month-end sweep rules are explicitly out of scope for this task so projected salary surplus cannot be double-counted as actual leftover cash.

**Tech Stack:** TypeScript, Vitest.

---

## File Structure

- Create: `src/lib/calculators/cash-allocation/cash-bucket-allocator.ts`
  - Exports `allocateCashBuckets(input)`.
  - Uses explicit KRW numbers and does not format values.
  - Returns status, total assigned amount, unassigned cash, and per-bucket shares.
- Create: `src/lib/calculators/cash-allocation/cash-bucket-allocator.test.ts`
  - Covers surplus, balanced, overallocated, zero-income, invalid negative amount, non-finite number, non-integer KRW, and duplicate bucket cases.

## Task 1: Cash Bucket Allocator

**Files:**
- Create: `src/lib/calculators/cash-allocation/cash-bucket-allocator.test.ts`
- Create: `src/lib/calculators/cash-allocation/cash-bucket-allocator.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/calculators/cash-allocation/cash-bucket-allocator.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { allocateCashBuckets } from "./cash-bucket-allocator";

describe("allocateCashBuckets", () => {
  it("allocates monthly take-home pay into buckets and reports unassigned cash", () => {
    expect(
      allocateCashBuckets({
        monthlyTakeHomePay: 3_000_000,
        buckets: [
          { key: "fixed-costs", label: "Fixed costs", amount: 900_000 },
          { key: "living-expense", label: "Living expense", amount: 700_000 },
          { key: "emergency-fund", label: "Emergency fund", amount: 300_000 },
          { key: "savings-deposit", label: "Savings deposit", amount: 400_000 },
          { key: "isa", label: "ISA", amount: 300_000 },
          { key: "irp", label: "IRP", amount: 100_000 },
          { key: "general-investment", label: "General investment", amount: 200_000 },
        ],
      }),
    ).toEqual({
      status: "surplus",
      monthlyTakeHomePay: 3_000_000,
      totalAssigned: 2_900_000,
      unassignedCash: 100_000,
      overallocatedAmount: 0,
      buckets: [
        { key: "fixed-costs", label: "Fixed costs", amount: 900_000, shareOfIncome: 0.3 },
        { key: "living-expense", label: "Living expense", amount: 700_000, shareOfIncome: 0.23333333333333334 },
        { key: "emergency-fund", label: "Emergency fund", amount: 300_000, shareOfIncome: 0.1 },
        { key: "savings-deposit", label: "Savings deposit", amount: 400_000, shareOfIncome: 0.13333333333333333 },
        { key: "isa", label: "ISA", amount: 300_000, shareOfIncome: 0.1 },
        { key: "irp", label: "IRP", amount: 100_000, shareOfIncome: 0.03333333333333333 },
        { key: "general-investment", label: "General investment", amount: 200_000, shareOfIncome: 0.06666666666666667 },
      ],
    });
  });

  it("marks balanced when buckets exactly equal monthly take-home pay", () => {
    expect(
      allocateCashBuckets({
        monthlyTakeHomePay: 1_000_000,
        buckets: [
          { key: "living-expense", label: "Living expense", amount: 600_000 },
          { key: "savings-deposit", label: "Savings deposit", amount: 400_000 },
        ],
      }),
    ).toEqual({
      status: "balanced",
      monthlyTakeHomePay: 1_000_000,
      totalAssigned: 1_000_000,
      unassignedCash: 0,
      overallocatedAmount: 0,
      buckets: [
        { key: "living-expense", label: "Living expense", amount: 600_000, shareOfIncome: 0.6 },
        { key: "savings-deposit", label: "Savings deposit", amount: 400_000, shareOfIncome: 0.4 },
      ],
    });
  });

  it("marks overallocated when bucket amounts exceed monthly take-home pay", () => {
    expect(
      allocateCashBuckets({
        monthlyTakeHomePay: 1_000_000,
        buckets: [
          { key: "fixed-costs", label: "Fixed costs", amount: 800_000 },
          { key: "living-expense", label: "Living expense", amount: 500_000 },
        ],
      }),
    ).toEqual({
      status: "overallocated",
      reason: "assigned-exceeds-income",
      monthlyTakeHomePay: 1_000_000,
      totalAssigned: 1_300_000,
      unassignedCash: 0,
      overallocatedAmount: 300_000,
      buckets: [
        { key: "fixed-costs", label: "Fixed costs", amount: 800_000, shareOfIncome: 0.8 },
        { key: "living-expense", label: "Living expense", amount: 500_000, shareOfIncome: 0.5 },
      ],
    });
  });

  it("returns zero shares when monthly take-home pay is zero", () => {
    expect(
      allocateCashBuckets({
        monthlyTakeHomePay: 0,
        buckets: [{ key: "living-expense", label: "Living expense", amount: 0 }],
      }),
    ).toEqual({
      status: "balanced",
      monthlyTakeHomePay: 0,
      totalAssigned: 0,
      unassignedCash: 0,
      overallocatedAmount: 0,
      buckets: [{ key: "living-expense", label: "Living expense", amount: 0, shareOfIncome: 0 }],
    });
  });

  it("rejects negative income or bucket amounts", () => {
    expect(
      allocateCashBuckets({
        monthlyTakeHomePay: 1_000_000,
        buckets: [{ key: "living-expense", label: "Living expense", amount: -1 }],
      }),
    ).toEqual({
      status: "invalid",
      reason: "negative-amount",
      monthlyTakeHomePay: 1_000_000,
      totalAssigned: null,
      unassignedCash: null,
      overallocatedAmount: null,
      buckets: [],
    });
  });

  it("rejects non-finite amounts", () => {
    expect(
      allocateCashBuckets({
        monthlyTakeHomePay: Number.NaN,
        buckets: [{ key: "living-expense", label: "Living expense", amount: 100_000 }],
      }),
    ).toEqual({
      status: "invalid",
      reason: "invalid-number",
      monthlyTakeHomePay: Number.NaN,
      totalAssigned: null,
      unassignedCash: null,
      overallocatedAmount: null,
      buckets: [],
    });
  });

  it("keeps allocation totals explicit so callers can verify the cash invariant", () => {
    const result = allocateCashBuckets({
      monthlyTakeHomePay: 1_000_000,
      buckets: [
        { key: "fixed-costs", label: "Fixed costs", amount: 500_000 },
        { key: "living-expense", label: "Living expense", amount: 300_000 },
      ],
    });

    expect(result.status).toBe("surplus");
    expect(result.totalAssigned).toBe(800_000);
    expect(result.unassignedCash).toBe(200_000);
    expect((result.totalAssigned ?? 0) + (result.unassignedCash ?? 0)).toBe(
      result.monthlyTakeHomePay,
    );
  });

  it("rejects non-integer KRW amounts", () => {
    expect(
      allocateCashBuckets({
        monthlyTakeHomePay: 1_000_000,
        buckets: [{ key: "living-expense", label: "Living expense", amount: 100_000.5 }],
      }),
    ).toEqual({
      status: "invalid",
      reason: "non-integer-krw",
      monthlyTakeHomePay: 1_000_000,
      totalAssigned: null,
      unassignedCash: null,
      overallocatedAmount: null,
      buckets: [],
    });
  });

  it("rejects duplicate bucket keys", () => {
    expect(
      allocateCashBuckets({
        monthlyTakeHomePay: 1_000_000,
        buckets: [
          { key: "living-expense", label: "Living expense", amount: 400_000 },
          { key: "living-expense", label: "Living expense duplicate", amount: 100_000 },
        ],
      }),
    ).toEqual({
      status: "invalid",
      reason: "duplicate-bucket",
      monthlyTakeHomePay: 1_000_000,
      totalAssigned: null,
      unassignedCash: null,
      overallocatedAmount: null,
      buckets: [],
    });
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/lib/calculators/cash-allocation/cash-bucket-allocator.test.ts
```

Expected: fails because `./cash-bucket-allocator` does not exist.

- [ ] **Step 3: Create minimal implementation**

Create `src/lib/calculators/cash-allocation/cash-bucket-allocator.ts`:

```ts
export type CashBucketInput = {
  key: string;
  label: string;
  amount: number;
};

export type CashBucketAllocationStatus = "surplus" | "balanced" | "overallocated" | "invalid";

export type CashBucketAllocationReason =
  | "assigned-exceeds-income"
  | "negative-amount"
  | "invalid-number"
  | "non-integer-krw"
  | "duplicate-bucket";

export type CashBucketAllocatorInput = {
  monthlyTakeHomePay: number;
  buckets: CashBucketInput[];
};

export type AllocatedCashBucket = CashBucketInput & {
  shareOfIncome: number;
};

export type CashBucketAllocatorResult = {
  status: CashBucketAllocationStatus;
  reason?: CashBucketAllocationReason;
  monthlyTakeHomePay: number;
  totalAssigned: number | null;
  unassignedCash: number | null;
  overallocatedAmount: number | null;
  buckets: AllocatedCashBucket[];
};

function calculateShareOfIncome(amount: number, monthlyTakeHomePay: number): number {
  if (monthlyTakeHomePay === 0) {
    return 0;
  }

  return amount / monthlyTakeHomePay;
}

function hasDuplicateBucketKey(buckets: CashBucketInput[]): boolean {
  const keys = new Set<string>();

  return buckets.some((bucket) => {
    if (keys.has(bucket.key)) {
      return true;
    }

    keys.add(bucket.key);
    return false;
  });
}

export function allocateCashBuckets(input: CashBucketAllocatorInput): CashBucketAllocatorResult {
  if (
    !Number.isFinite(input.monthlyTakeHomePay) ||
    input.buckets.some((bucket) => {
      return !Number.isFinite(bucket.amount);
    })
  ) {
    return {
      status: "invalid",
      reason: "invalid-number",
      monthlyTakeHomePay: input.monthlyTakeHomePay,
      totalAssigned: null,
      unassignedCash: null,
      overallocatedAmount: null,
      buckets: [],
    };
  }

  if (
    input.monthlyTakeHomePay < 0 ||
    input.buckets.some((bucket) => {
      return bucket.amount < 0;
    })
  ) {
    return {
      status: "invalid",
      reason: "negative-amount",
      monthlyTakeHomePay: input.monthlyTakeHomePay,
      totalAssigned: null,
      unassignedCash: null,
      overallocatedAmount: null,
      buckets: [],
    };
  }

  if (
    !Number.isInteger(input.monthlyTakeHomePay) ||
    input.buckets.some((bucket) => {
      return !Number.isInteger(bucket.amount);
    })
  ) {
    return {
      status: "invalid",
      reason: "non-integer-krw",
      monthlyTakeHomePay: input.monthlyTakeHomePay,
      totalAssigned: null,
      unassignedCash: null,
      overallocatedAmount: null,
      buckets: [],
    };
  }

  if (hasDuplicateBucketKey(input.buckets)) {
    return {
      status: "invalid",
      reason: "duplicate-bucket",
      monthlyTakeHomePay: input.monthlyTakeHomePay,
      totalAssigned: null,
      unassignedCash: null,
      overallocatedAmount: null,
      buckets: [],
    };
  }

  const totalAssigned = input.buckets.reduce((sum, bucket) => sum + bucket.amount, 0);
  const unassignedCash = Math.max(input.monthlyTakeHomePay - totalAssigned, 0);
  const overallocatedAmount = Math.max(totalAssigned - input.monthlyTakeHomePay, 0);
  const buckets = input.buckets.map((bucket) => {
    return {
      ...bucket,
      shareOfIncome: calculateShareOfIncome(bucket.amount, input.monthlyTakeHomePay),
    };
  });

  if (overallocatedAmount > 0) {
    return {
      status: "overallocated",
      reason: "assigned-exceeds-income",
      monthlyTakeHomePay: input.monthlyTakeHomePay,
      totalAssigned,
      unassignedCash,
      overallocatedAmount,
      buckets,
    };
  }

  return {
    status: unassignedCash === 0 ? "balanced" : "surplus",
    monthlyTakeHomePay: input.monthlyTakeHomePay,
    totalAssigned,
    unassignedCash,
    overallocatedAmount,
    buckets,
  };
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/calculators/cash-allocation/cash-bucket-allocator.test.ts
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
git add docs/superpowers/plans/2026-07-14-cash-bucket-allocator.md src/lib/calculators/cash-allocation/cash-bucket-allocator.ts src/lib/calculators/cash-allocation/cash-bucket-allocator.test.ts
git commit -m "feat: add cash bucket allocator"
```

## Self-Review

- Spec coverage: Implements the cash bucket allocator needed by the account flow planner.
- Sweep scope: Month-end sweep is intentionally excluded and should be implemented as a separate calculator using actual leftover cash inputs.
- Placeholder scan: No TBD/TODO placeholders.
- Type consistency: All money values are raw KRW numbers; display formatting remains outside the calculator.
