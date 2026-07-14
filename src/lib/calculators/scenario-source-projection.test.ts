import { describe, expect, it } from "vitest";
import { calculateSourceBackedScenarioProjection } from "./scenario-source-projection";

describe("calculateSourceBackedScenarioProjection", () => {
  it("projects a goal timeline from account contribution sources for one month", () => {
    expect(
      calculateSourceBackedScenarioProjection({
        goalAmount: 100_000_000,
        month: "2026-07",
        accounts: [
          {
            name: "Parking",
            balance: 10_000_000,
            expectedAnnualReturnRate: 0.02,
            contributionSources: [
              {
                month: "2026-07",
                sourceId: "parking-salary-bucket",
                kind: "salary-bucket-transfer",
                label: "Parking salary bucket",
                amount: 500_000,
              },
            ],
          },
          {
            name: "ISA",
            balance: 30_000_000,
            expectedAnnualReturnRate: 0.06,
            contributionSources: [
              {
                month: "2026-07",
                sourceId: "isa-salary-bucket",
                kind: "salary-bucket-transfer",
                label: "ISA salary bucket",
                amount: 800_000,
              },
              {
                month: "2026-07",
                sourceId: "actual-month-end-leftover",
                kind: "month-end-sweep",
                label: "Actual month-end leftover",
                amount: 200_000,
              },
            ],
          },
        ],
      }),
    ).toEqual({
      status: "reachable",
      month: "2026-07",
      reason: undefined,
      totalBalance: 40_000_000,
      totalMonthlyContribution: 1_500_000,
      projectedAnnualReturnRate: 0.05,
      monthsToGoal: 34,
    });
  });

  it("rejects duplicate contribution source IDs across accounts for the same month", () => {
    expect(
      calculateSourceBackedScenarioProjection({
        goalAmount: 100_000_000,
        month: "2026-07",
        accounts: [
          {
            name: "ISA",
            balance: 30_000_000,
            expectedAnnualReturnRate: 0.06,
            contributionSources: [
              {
                month: "2026-07",
                sourceId: "actual-month-end-leftover",
                kind: "month-end-sweep",
                label: "Actual month-end leftover",
                amount: 200_000,
              },
            ],
          },
          {
            name: "General investment",
            balance: 5_000_000,
            expectedAnnualReturnRate: 0.05,
            contributionSources: [
              {
                month: "2026-07",
                sourceId: "actual-month-end-leftover",
                kind: "month-end-sweep",
                label: "Duplicate actual month-end leftover",
                amount: 100_000,
              },
            ],
          },
        ],
      }),
    ).toEqual({
      status: "unavailable",
      month: "2026-07",
      reason: "duplicate-source-for-month",
      totalBalance: null,
      totalMonthlyContribution: null,
      projectedAnnualReturnRate: null,
      monthsToGoal: null,
    });
  });

  it("rejects contribution sources outside the requested projection month", () => {
    expect(
      calculateSourceBackedScenarioProjection({
        goalAmount: 100_000_000,
        month: "2026-07",
        accounts: [
          {
            name: "ISA",
            balance: 30_000_000,
            expectedAnnualReturnRate: 0.06,
            contributionSources: [
              {
                month: "2026-08",
                sourceId: "isa-salary-bucket",
                kind: "salary-bucket-transfer",
                label: "ISA salary bucket",
                amount: 800_000,
              },
            ],
          },
        ],
      }),
    ).toEqual({
      status: "unavailable",
      month: "2026-07",
      reason: "source-month-mismatch",
      totalBalance: null,
      totalMonthlyContribution: null,
      projectedAnnualReturnRate: null,
      monthsToGoal: null,
    });
  });

  it("does not sum multiple months into one monthly contribution", () => {
    const result = calculateSourceBackedScenarioProjection({
      goalAmount: 100_000_000,
      month: "2026-07",
      accounts: [
        {
          name: "ISA",
          balance: 30_000_000,
          expectedAnnualReturnRate: 0.06,
          contributionSources: [
            {
              month: "2026-07",
              sourceId: "isa-july-bucket",
              kind: "salary-bucket-transfer",
              label: "ISA July bucket",
              amount: 800_000,
            },
            {
              month: "2026-08",
              sourceId: "isa-august-bucket",
              kind: "salary-bucket-transfer",
              label: "ISA August bucket",
              amount: 800_000,
            },
          ],
        },
      ],
    });

    expect(result.status).toBe("unavailable");
    expect(result.reason).toBe("source-month-mismatch");
    expect(result.totalMonthlyContribution).toBeNull();
  });

  it("passes through duplicate source IDs before projection can double-count them", () => {
    const result = calculateSourceBackedScenarioProjection({
      goalAmount: 100_000_000,
      month: "2026-07",
      accounts: [
        {
          name: "ISA",
          balance: 30_000_000,
          expectedAnnualReturnRate: 0.06,
          contributionSources: [
            {
              month: "2026-07",
              sourceId: "scenario-surplus",
              kind: "scenario-surplus",
              label: "Scenario surplus",
              amount: 100_000,
            },
            {
              month: "2026-07",
              sourceId: "scenario-surplus",
              kind: "scenario-surplus",
              label: "Duplicate scenario surplus",
              amount: 100_000,
            },
          ],
        },
      ],
    });

    expect(result.status).toBe("unavailable");
    expect(result.reason).toBe("duplicate-source-for-month");
    expect(result.totalMonthlyContribution).toBeNull();
  });

  it("passes through invalid source amount reasons from the contribution ledger", () => {
    expect(
      calculateSourceBackedScenarioProjection({
        goalAmount: 100_000_000,
        month: "2026-07",
        accounts: [
          {
            name: "ISA",
            balance: 30_000_000,
            expectedAnnualReturnRate: 0.06,
            contributionSources: [
              {
                month: "2026-07",
                sourceId: "isa-salary-bucket",
                kind: "salary-bucket-transfer",
                label: "ISA salary bucket",
                amount: 800_000.5,
              },
            ],
          },
        ],
      }),
    ).toEqual({
      status: "unavailable",
      month: "2026-07",
      reason: "non-integer-krw",
      totalBalance: null,
      totalMonthlyContribution: null,
      projectedAnnualReturnRate: null,
      monthsToGoal: null,
    });
  });

  it("propagates no-progress when validated source-backed accounts cannot reach the goal", () => {
    expect(
      calculateSourceBackedScenarioProjection({
        goalAmount: 100_000_000,
        month: "2026-07",
        accounts: [
          {
            name: "Idle cash",
            balance: 10_000_000,
            expectedAnnualReturnRate: 0,
            contributionSources: [],
          },
        ],
      }),
    ).toEqual({
      status: "unavailable",
      month: "2026-07",
      reason: "no-progress",
      totalBalance: 10_000_000,
      totalMonthlyContribution: 0,
      projectedAnnualReturnRate: 0,
      monthsToGoal: null,
    });
  });
});
