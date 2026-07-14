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
        {
          key: "living-expense",
          label: "Living expense",
          amount: 700_000,
          shareOfIncome: 0.23333333333333334,
        },
        { key: "emergency-fund", label: "Emergency fund", amount: 300_000, shareOfIncome: 0.1 },
        {
          key: "savings-deposit",
          label: "Savings deposit",
          amount: 400_000,
          shareOfIncome: 0.13333333333333333,
        },
        { key: "isa", label: "ISA", amount: 300_000, shareOfIncome: 0.1 },
        { key: "irp", label: "IRP", amount: 100_000, shareOfIncome: 0.03333333333333333 },
        {
          key: "general-investment",
          label: "General investment",
          amount: 200_000,
          shareOfIncome: 0.06666666666666667,
        },
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
});
