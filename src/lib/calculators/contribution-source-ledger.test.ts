import { describe, expect, it } from "vitest";
import { calculateContributionSourceLedger } from "./contribution-source-ledger";

describe("calculateContributionSourceLedger", () => {
  it("groups contribution sources by month and returns explicit totals", () => {
    expect(
      calculateContributionSourceLedger({
        sources: [
          {
            month: "2026-07",
            sourceId: "salary-day-bucket-transfer",
            kind: "salary-bucket-transfer",
            label: "Salary-day bucket transfer",
            amount: 500_000,
          },
          {
            month: "2026-07",
            sourceId: "actual-month-end-leftover",
            kind: "month-end-sweep",
            label: "Actual month-end leftover",
            amount: 120_000,
          },
          {
            month: "2026-08",
            sourceId: "salary-day-bucket-transfer",
            kind: "salary-bucket-transfer",
            label: "Salary-day bucket transfer",
            amount: 500_000,
          },
        ],
      }),
    ).toEqual({
      status: "ok",
      totalMonthlyContribution: 1_120_000,
      monthlyTotals: [
        {
          month: "2026-07",
          totalContribution: 620_000,
          sources: [
            {
              month: "2026-07",
              sourceId: "salary-day-bucket-transfer",
              kind: "salary-bucket-transfer",
              label: "Salary-day bucket transfer",
              amount: 500_000,
            },
            {
              month: "2026-07",
              sourceId: "actual-month-end-leftover",
              kind: "month-end-sweep",
              label: "Actual month-end leftover",
              amount: 120_000,
            },
          ],
        },
        {
          month: "2026-08",
          totalContribution: 500_000,
          sources: [
            {
              month: "2026-08",
              sourceId: "salary-day-bucket-transfer",
              kind: "salary-bucket-transfer",
              label: "Salary-day bucket transfer",
              amount: 500_000,
            },
          ],
        },
      ],
    });
  });

  it("rejects duplicate source IDs within the same month", () => {
    expect(
      calculateContributionSourceLedger({
        sources: [
          {
            month: "2026-07",
            sourceId: "actual-month-end-leftover",
            kind: "month-end-sweep",
            label: "Actual month-end leftover",
            amount: 120_000,
          },
          {
            month: "2026-07",
            sourceId: "actual-month-end-leftover",
            kind: "month-end-sweep",
            label: "Duplicate actual month-end leftover",
            amount: 80_000,
          },
        ],
      }),
    ).toEqual({
      status: "invalid",
      reason: "duplicate-source-for-month",
      totalMonthlyContribution: null,
      monthlyTotals: [],
    });
  });

  it("allows the same recurring source ID in different months", () => {
    expect(
      calculateContributionSourceLedger({
        sources: [
          {
            month: "2026-07",
            sourceId: "salary-day-bucket-transfer",
            kind: "salary-bucket-transfer",
            label: "Salary-day bucket transfer",
            amount: 500_000,
          },
          {
            month: "2026-08",
            sourceId: "salary-day-bucket-transfer",
            kind: "salary-bucket-transfer",
            label: "Salary-day bucket transfer",
            amount: 500_000,
          },
        ],
      }).status,
    ).toBe("ok");
  });

  it("returns ok with zero totals for empty sources", () => {
    expect(calculateContributionSourceLedger({ sources: [] })).toEqual({
      status: "empty",
      totalMonthlyContribution: 0,
      monthlyTotals: [],
    });
  });

  it("rejects negative contribution amounts", () => {
    expect(
      calculateContributionSourceLedger({
        sources: [
          {
            month: "2026-07",
            sourceId: "scenario-surplus",
            kind: "scenario-surplus",
            label: "Scenario surplus",
            amount: -1,
          },
        ],
      }),
    ).toEqual({
      status: "invalid",
      reason: "negative-amount",
      totalMonthlyContribution: null,
      monthlyTotals: [],
    });
  });

  it("rejects non-finite contribution amounts", () => {
    expect(
      calculateContributionSourceLedger({
        sources: [
          {
            month: "2026-07",
            sourceId: "scenario-surplus",
            kind: "scenario-surplus",
            label: "Scenario surplus",
            amount: Number.NaN,
          },
        ],
      }),
    ).toEqual({
      status: "invalid",
      reason: "invalid-number",
      totalMonthlyContribution: null,
      monthlyTotals: [],
    });
  });

  it("rejects non-integer KRW contribution amounts", () => {
    expect(
      calculateContributionSourceLedger({
        sources: [
          {
            month: "2026-07",
            sourceId: "scenario-surplus",
            kind: "scenario-surplus",
            label: "Scenario surplus",
            amount: 100_000.5,
          },
        ],
      }),
    ).toEqual({
      status: "invalid",
      reason: "non-integer-krw",
      totalMonthlyContribution: null,
      monthlyTotals: [],
    });
  });

  it("rejects invalid month keys", () => {
    expect(
      calculateContributionSourceLedger({
        sources: [
          {
            month: "2026-7",
            sourceId: "scenario-surplus",
            kind: "scenario-surplus",
            label: "Scenario surplus",
            amount: 100_000,
          },
        ],
      }),
    ).toEqual({
      status: "invalid",
      reason: "invalid-month",
      totalMonthlyContribution: null,
      monthlyTotals: [],
    });
  });

  it("rejects blank source IDs", () => {
    expect(
      calculateContributionSourceLedger({
        sources: [
          {
            month: "2026-07",
            sourceId: " ",
            kind: "manual",
            label: "Manual contribution",
            amount: 100_000,
          },
        ],
      }),
    ).toEqual({
      status: "invalid",
      reason: "blank-source-id",
      totalMonthlyContribution: null,
      monthlyTotals: [],
    });
  });

  it("keeps month totals consistent with the overall contribution total", () => {
    const result = calculateContributionSourceLedger({
      sources: [
        {
          month: "2026-07",
          sourceId: "salary-day-bucket-transfer",
          kind: "salary-bucket-transfer",
          label: "Salary-day bucket transfer",
          amount: 500_000,
        },
        {
          month: "2026-07",
          sourceId: "actual-month-end-leftover",
          kind: "month-end-sweep",
          label: "Actual month-end leftover",
          amount: 120_000,
        },
        {
          month: "2026-08",
          sourceId: "scenario-surplus",
          kind: "scenario-surplus",
          label: "Scenario surplus",
          amount: 80_000,
        },
      ],
    });

    expect(result.status).toBe("ok");
    expect(result.totalMonthlyContribution).toBe(700_000);
    expect(
      result.monthlyTotals.reduce((sum, month) => {
        return sum + month.totalContribution;
      }, 0),
    ).toBe(result.totalMonthlyContribution);
  });
});
