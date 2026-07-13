import { describe, expect, it } from "vitest";
import { calculateScenarioProjection } from "./scenario-projection";

describe("calculateScenarioProjection", () => {
  it("projects a goal timeline from account allocation assumptions", () => {
    expect(
      calculateScenarioProjection({
        goalAmount: 100_000_000,
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
      status: "reachable",
      totalBalance: 40_000_000,
      totalMonthlyContribution: 1_500_000,
      projectedAnnualReturnRate: 0.05,
      monthsToGoal: 34,
    });
  });

  it("returns zero months when the account balance already reaches the goal", () => {
    expect(
      calculateScenarioProjection({
        goalAmount: 100_000_000,
        accounts: [
          {
            name: "Total assets",
            balance: 100_000_000,
            monthlyContribution: 0,
            expectedAnnualReturnRate: 0,
          },
        ],
      }),
    ).toEqual({
      status: "reachable",
      totalBalance: 100_000_000,
      totalMonthlyContribution: 0,
      projectedAnnualReturnRate: 0,
      monthsToGoal: 0,
    });
  });

  it("marks projection unavailable for an empty account list", () => {
    expect(
      calculateScenarioProjection({
        goalAmount: 100_000_000,
        accounts: [],
      }),
    ).toEqual({
      status: "unavailable",
      reason: "empty-allocation",
      totalBalance: 0,
      totalMonthlyContribution: 0,
      projectedAnnualReturnRate: 0,
      monthsToGoal: null,
    });
  });

  it("passes through invalid allocation reasons", () => {
    expect(
      calculateScenarioProjection({
        goalAmount: 100_000_000,
        accounts: [
          {
            name: "Invalid",
            balance: -1,
            monthlyContribution: 0,
            expectedAnnualReturnRate: 0.03,
          },
        ],
      }),
    ).toEqual({
      status: "unavailable",
      reason: "negative-amount",
      totalBalance: null,
      totalMonthlyContribution: null,
      projectedAnnualReturnRate: null,
      monthsToGoal: null,
    });
  });

  it("marks projection unavailable when the scenario makes no progress", () => {
    expect(
      calculateScenarioProjection({
        goalAmount: 100_000_000,
        accounts: [
          {
            name: "Idle cash",
            balance: 10_000_000,
            monthlyContribution: 0,
            expectedAnnualReturnRate: 0,
          },
        ],
      }),
    ).toEqual({
      status: "unavailable",
      reason: "no-progress",
      totalBalance: 10_000_000,
      totalMonthlyContribution: 0,
      projectedAnnualReturnRate: 0,
      monthsToGoal: null,
    });
  });
});
