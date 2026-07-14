import { describe, expect, it } from "vitest";
import { compareScenarioProjections } from "./scenario-comparison";

describe("compareScenarioProjections", () => {
  it("ranks reachable scenarios and calculates months reduced versus base", () => {
    expect(
      compareScenarioProjections({
        goalAmount: 100_000_000,
        baseScenarioName: "base",
        scenarios: [
          {
            name: "base",
            accounts: [
              {
                name: "Current",
                balance: 10_000_000,
                monthlyContribution: 1_000_000,
                expectedAnnualReturnRate: 0,
              },
            ],
          },
          {
            name: "higher-saving",
            accounts: [
              {
                name: "Current",
                balance: 10_000_000,
                monthlyContribution: 1_200_000,
                expectedAnnualReturnRate: 0,
              },
            ],
          },
          {
            name: "lower-saving",
            accounts: [
              {
                name: "Current",
                balance: 10_000_000,
                monthlyContribution: 900_000,
                expectedAnnualReturnRate: 0,
              },
            ],
          },
        ],
      }),
    ).toEqual({
      status: "ok",
      fastestScenarioName: "higher-saving",
      baseScenarioName: "base",
      scenarios: [
        {
          name: "higher-saving",
          status: "reachable",
          monthsToGoal: 75,
          monthsReducedVsBase: 15,
        },
        {
          name: "base",
          status: "reachable",
          monthsToGoal: 90,
          monthsReducedVsBase: 0,
        },
        {
          name: "lower-saving",
          status: "reachable",
          monthsToGoal: 100,
          monthsReducedVsBase: -10,
        },
      ],
    });
  });

  it("keeps unavailable scenarios after reachable scenarios", () => {
    expect(
      compareScenarioProjections({
        goalAmount: 100_000_000,
        baseScenarioName: "base",
        scenarios: [
          {
            name: "base",
            accounts: [
              {
                name: "Current",
                balance: 10_000_000,
                monthlyContribution: 1_000_000,
                expectedAnnualReturnRate: 0,
              },
            ],
          },
          {
            name: "idle",
            accounts: [
              {
                name: "Idle",
                balance: 10_000_000,
                monthlyContribution: 0,
                expectedAnnualReturnRate: 0,
              },
            ],
          },
        ],
      }),
    ).toEqual({
      status: "ok",
      fastestScenarioName: "base",
      baseScenarioName: "base",
      scenarios: [
        {
          name: "base",
          status: "reachable",
          monthsToGoal: 90,
          monthsReducedVsBase: 0,
        },
        {
          name: "idle",
          status: "unavailable",
          reason: "no-progress",
          monthsToGoal: null,
          monthsReducedVsBase: null,
        },
      ],
    });
  });

  it("returns invalid when the base scenario is missing or unreachable", () => {
    expect(
      compareScenarioProjections({
        goalAmount: 100_000_000,
        baseScenarioName: "missing",
        scenarios: [
          {
            name: "candidate",
            accounts: [
              {
                name: "Current",
                balance: 10_000_000,
                monthlyContribution: 1_000_000,
                expectedAnnualReturnRate: 0,
              },
            ],
          },
        ],
      }),
    ).toEqual({
      status: "invalid",
      reason: "base-scenario-unavailable",
      fastestScenarioName: null,
      baseScenarioName: "missing",
      scenarios: [
        {
          name: "candidate",
          status: "reachable",
          monthsToGoal: 90,
          monthsReducedVsBase: null,
        },
      ],
    });
  });
});
