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
