import { describe, expect, it } from "vitest";
import { sweepMonthEndCash } from "./month-end-sweep";

describe("sweepMonthEndCash", () => {
  it("calculates actual month-end leftover and sweeps it into targets in order", () => {
    expect(
      sweepMonthEndCash({
        actualIncomeReceived: 3_000_000,
        actualExpensesPaid: 1_800_000,
        plannedTransfersMade: 500_000,
        reservedCash: 0,
        targets: [
          { key: "emergency-fund", label: "Emergency fund", requestedAmount: 300_000 },
          { key: "savings-deposit", label: "Savings deposit", requestedAmount: 250_000 },
          { key: "general-investment", label: "General investment", requestedAmount: 150_000 },
        ],
      }),
    ).toEqual({
      status: "fully-swept",
      source: "actual-month-end-leftover",
      actualIncomeReceived: 3_000_000,
      actualExpensesPaid: 1_800_000,
      plannedTransfersMade: 500_000,
      reservedCash: 0,
      sweepableCash: 700_000,
      shortfallAmount: 0,
      totalRequested: 700_000,
      totalSwept: 700_000,
      unallocatedCash: 0,
      unmetTargetAmount: 0,
      targets: [
        {
          key: "emergency-fund",
          label: "Emergency fund",
          requestedAmount: 300_000,
          sweptAmount: 300_000,
          unmetAmount: 0,
        },
        {
          key: "savings-deposit",
          label: "Savings deposit",
          requestedAmount: 250_000,
          sweptAmount: 250_000,
          unmetAmount: 0,
        },
        {
          key: "general-investment",
          label: "General investment",
          requestedAmount: 150_000,
          sweptAmount: 150_000,
          unmetAmount: 0,
        },
      ],
    });
  });

  it("does not sweep planned payday surplus when actual expenses consume it", () => {
    const result = sweepMonthEndCash({
      actualIncomeReceived: 3_000_000,
      actualExpensesPaid: 2_900_000,
      plannedTransfersMade: 100_000,
      reservedCash: 0,
      targets: [{ key: "savings-deposit", label: "Savings deposit", requestedAmount: 100_000 }],
    });

    expect(result.status).toBe("no-sweep");
    expect(result.sweepableCash).toBe(0);
    expect(result.totalSwept).toBe(0);
    expect(result.unmetTargetAmount).toBe(100_000);
  });

  it("marks partially swept when actual leftover cannot cover every target", () => {
    expect(
      sweepMonthEndCash({
        actualIncomeReceived: 2_000_000,
        actualExpensesPaid: 1_350_000,
        plannedTransfersMade: 200_000,
        reservedCash: 0,
        targets: [
          { key: "emergency-fund", label: "Emergency fund", requestedAmount: 300_000 },
          { key: "savings-deposit", label: "Savings deposit", requestedAmount: 250_000 },
          { key: "isa", label: "ISA", requestedAmount: 200_000 },
        ],
      }),
    ).toEqual({
      status: "partially-swept",
      reason: "insufficient-sweepable-cash",
      source: "actual-month-end-leftover",
      actualIncomeReceived: 2_000_000,
      actualExpensesPaid: 1_350_000,
      plannedTransfersMade: 200_000,
      reservedCash: 0,
      sweepableCash: 450_000,
      shortfallAmount: 0,
      totalRequested: 750_000,
      totalSwept: 450_000,
      unallocatedCash: 0,
      unmetTargetAmount: 300_000,
      targets: [
        {
          key: "emergency-fund",
          label: "Emergency fund",
          requestedAmount: 300_000,
          sweptAmount: 300_000,
          unmetAmount: 0,
        },
        {
          key: "savings-deposit",
          label: "Savings deposit",
          requestedAmount: 250_000,
          sweptAmount: 150_000,
          unmetAmount: 100_000,
        },
        {
          key: "isa",
          label: "ISA",
          requestedAmount: 200_000,
          sweptAmount: 0,
          unmetAmount: 200_000,
        },
      ],
    });
  });

  it("reports unallocated cash when actual leftover exceeds target requests", () => {
    expect(
      sweepMonthEndCash({
        actualIncomeReceived: 1_200_000,
        actualExpensesPaid: 500_000,
        plannedTransfersMade: 200_000,
        reservedCash: 0,
        targets: [
          { key: "emergency-fund", label: "Emergency fund", requestedAmount: 200_000 },
          { key: "savings-deposit", label: "Savings deposit", requestedAmount: 100_000 },
        ],
      }),
    ).toEqual({
      status: "fully-swept",
      source: "actual-month-end-leftover",
      actualIncomeReceived: 1_200_000,
      actualExpensesPaid: 500_000,
      plannedTransfersMade: 200_000,
      reservedCash: 0,
      sweepableCash: 500_000,
      shortfallAmount: 0,
      totalRequested: 300_000,
      totalSwept: 300_000,
      unallocatedCash: 200_000,
      unmetTargetAmount: 0,
      targets: [
        {
          key: "emergency-fund",
          label: "Emergency fund",
          requestedAmount: 200_000,
          sweptAmount: 200_000,
          unmetAmount: 0,
        },
        {
          key: "savings-deposit",
          label: "Savings deposit",
          requestedAmount: 100_000,
          sweptAmount: 100_000,
          unmetAmount: 0,
        },
      ],
    });
  });

  it("marks shortfall when actual expenses and transfers exceed income", () => {
    expect(
      sweepMonthEndCash({
        actualIncomeReceived: 2_000_000,
        actualExpensesPaid: 2_300_000,
        plannedTransfersMade: 0,
        reservedCash: 0,
        targets: [{ key: "emergency-fund", label: "Emergency fund", requestedAmount: 100_000 }],
      }),
    ).toEqual({
      status: "shortfall",
      reason: "actual-cashflow-shortfall",
      source: "actual-month-end-leftover",
      actualIncomeReceived: 2_000_000,
      actualExpensesPaid: 2_300_000,
      plannedTransfersMade: 0,
      reservedCash: 0,
      sweepableCash: 0,
      shortfallAmount: 300_000,
      totalRequested: 100_000,
      totalSwept: 0,
      unallocatedCash: 0,
      unmetTargetAmount: 100_000,
      targets: [
        {
          key: "emergency-fund",
          label: "Emergency fund",
          requestedAmount: 100_000,
          sweptAmount: 0,
          unmetAmount: 100_000,
        },
      ],
    });
  });

  it("marks unallocated when there is sweepable cash but no targets", () => {
    expect(
      sweepMonthEndCash({
        actualIncomeReceived: 300_000,
        actualExpensesPaid: 100_000,
        plannedTransfersMade: 0,
        reservedCash: 80_000,
        targets: [],
      }),
    ).toEqual({
      status: "unallocated",
      source: "actual-month-end-leftover",
      actualIncomeReceived: 300_000,
      actualExpensesPaid: 100_000,
      plannedTransfersMade: 0,
      reservedCash: 80_000,
      sweepableCash: 120_000,
      shortfallAmount: 0,
      totalRequested: 0,
      totalSwept: 0,
      unallocatedCash: 120_000,
      unmetTargetAmount: 0,
      targets: [],
    });
  });

  it("rejects negative input amounts", () => {
    expect(
      sweepMonthEndCash({
        actualIncomeReceived: 100_000,
        actualExpensesPaid: 0,
        plannedTransfersMade: 0,
        reservedCash: 0,
        targets: [{ key: "emergency-fund", label: "Emergency fund", requestedAmount: -1 }],
      }),
    ).toEqual({
      status: "invalid",
      reason: "negative-amount",
      source: "actual-month-end-leftover",
      actualIncomeReceived: 100_000,
      actualExpensesPaid: 0,
      plannedTransfersMade: 0,
      reservedCash: 0,
      sweepableCash: null,
      shortfallAmount: null,
      totalRequested: null,
      totalSwept: null,
      unallocatedCash: null,
      unmetTargetAmount: null,
      targets: [],
    });
  });

  it("rejects non-finite amounts", () => {
    expect(
      sweepMonthEndCash({
        actualIncomeReceived: Number.POSITIVE_INFINITY,
        actualExpensesPaid: 0,
        plannedTransfersMade: 0,
        reservedCash: 0,
        targets: [{ key: "emergency-fund", label: "Emergency fund", requestedAmount: 100_000 }],
      }),
    ).toEqual({
      status: "invalid",
      reason: "invalid-number",
      source: "actual-month-end-leftover",
      actualIncomeReceived: Number.POSITIVE_INFINITY,
      actualExpensesPaid: 0,
      plannedTransfersMade: 0,
      reservedCash: 0,
      sweepableCash: null,
      shortfallAmount: null,
      totalRequested: null,
      totalSwept: null,
      unallocatedCash: null,
      unmetTargetAmount: null,
      targets: [],
    });
  });

  it("rejects non-integer KRW amounts", () => {
    expect(
      sweepMonthEndCash({
        actualIncomeReceived: 100_000.5,
        actualExpensesPaid: 0,
        plannedTransfersMade: 0,
        reservedCash: 0,
        targets: [{ key: "emergency-fund", label: "Emergency fund", requestedAmount: 100_000 }],
      }),
    ).toEqual({
      status: "invalid",
      reason: "non-integer-krw",
      source: "actual-month-end-leftover",
      actualIncomeReceived: 100_000.5,
      actualExpensesPaid: 0,
      plannedTransfersMade: 0,
      reservedCash: 0,
      sweepableCash: null,
      shortfallAmount: null,
      totalRequested: null,
      totalSwept: null,
      unallocatedCash: null,
      unmetTargetAmount: null,
      targets: [],
    });
  });

  it("rejects duplicate target keys", () => {
    expect(
      sweepMonthEndCash({
        actualIncomeReceived: 200_000,
        actualExpensesPaid: 0,
        plannedTransfersMade: 0,
        reservedCash: 0,
        targets: [
          { key: "emergency-fund", label: "Emergency fund", requestedAmount: 100_000 },
          { key: "emergency-fund", label: "Emergency fund duplicate", requestedAmount: 50_000 },
        ],
      }),
    ).toEqual({
      status: "invalid",
      reason: "duplicate-target",
      source: "actual-month-end-leftover",
      actualIncomeReceived: 200_000,
      actualExpensesPaid: 0,
      plannedTransfersMade: 0,
      reservedCash: 0,
      sweepableCash: null,
      shortfallAmount: null,
      totalRequested: null,
      totalSwept: null,
      unallocatedCash: null,
      unmetTargetAmount: null,
      targets: [],
    });
  });

  it("keeps swept and unallocated totals explicit for cash invariant checks", () => {
    const result = sweepMonthEndCash({
      actualIncomeReceived: 1_000_000,
      actualExpensesPaid: 200_000,
      plannedTransfersMade: 150_000,
      reservedCash: 0,
      targets: [
        { key: "emergency-fund", label: "Emergency fund", requestedAmount: 300_000 },
        { key: "savings-deposit", label: "Savings deposit", requestedAmount: 200_000 },
      ],
    });

    expect(result.status).toBe("fully-swept");
    expect(result.sweepableCash).toBe(650_000);
    expect(result.totalSwept).toBe(500_000);
    expect(result.unallocatedCash).toBe(150_000);
    expect((result.totalSwept ?? 0) + (result.unallocatedCash ?? 0)).toBe(
      result.sweepableCash,
    );
  });
});
