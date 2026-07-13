import { describe, expect, it } from "vitest";
import { calculateMonthsToGoal } from "./goal-timeline";

describe("calculateMonthsToGoal", () => {
  it("returns zero months when the goal is already reached", () => {
    expect(
      calculateMonthsToGoal({
        currentAmount: 100_000_000,
        goalAmount: 100_000_000,
        monthlyContribution: 1_000_000,
        annualReturnRate: 0.03,
      }),
    ).toEqual({ months: 0, reached: true });
  });

  it("calculates months with monthly contributions and no return", () => {
    expect(
      calculateMonthsToGoal({
        currentAmount: 10_000_000,
        goalAmount: 100_000_000,
        monthlyContribution: 1_000_000,
        annualReturnRate: 0,
      }),
    ).toEqual({ months: 90, reached: true });
  });

  it("marks the goal unreachable when contribution is zero and return cannot bridge the gap", () => {
    expect(
      calculateMonthsToGoal({
        currentAmount: 10_000_000,
        goalAmount: 100_000_000,
        monthlyContribution: 0,
        annualReturnRate: 0,
      }),
    ).toEqual({ months: null, reached: false, reason: "no-progress" });
  });

  it("rejects annual return rates outside the simple model bounds", () => {
    expect(
      calculateMonthsToGoal({
        currentAmount: 10_000_000,
        goalAmount: 100_000_000,
        monthlyContribution: 1_000_000,
        annualReturnRate: -25,
      }),
    ).toEqual({ months: null, reached: false, reason: "invalid-return-rate" });
  });

  it("marks goals as outside the model horizon when max months are exceeded", () => {
    expect(
      calculateMonthsToGoal({
        currentAmount: 10_000_000,
        goalAmount: 100_000_000,
        monthlyContribution: 1,
        annualReturnRate: 0,
        maxMonths: 12,
      }),
    ).toEqual({ months: null, reached: false, reason: "max-months-exceeded" });
  });
});
