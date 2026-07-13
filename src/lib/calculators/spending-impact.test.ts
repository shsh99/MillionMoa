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
