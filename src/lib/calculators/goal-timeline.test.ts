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
    ).toEqual({ months: null, reached: false });
  });
});
