import { describe, expect, it } from "vitest";
import { calculateAllocationReturn } from "./allocation-return";

describe("calculateAllocationReturn", () => {
  it("aggregates account balances, contributions, and weighted returns", () => {
    expect(
      calculateAllocationReturn({
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
      status: "ok",
      totalBalance: 40_000_000,
      totalMonthlyContribution: 1_500_000,
      balanceWeightedAnnualReturnRate: 0.05,
      contributionWeightedAnnualReturnRate: 0.04666666666666667,
    });
  });

  it("returns empty status for no accounts", () => {
    expect(calculateAllocationReturn({ accounts: [] })).toEqual({
      status: "empty",
      totalBalance: 0,
      totalMonthlyContribution: 0,
      balanceWeightedAnnualReturnRate: 0,
      contributionWeightedAnnualReturnRate: 0,
    });
  });

  it("returns zero contribution weighted return when monthly contributions are zero", () => {
    expect(
      calculateAllocationReturn({
        accounts: [
          {
            name: "Existing savings",
            balance: 5_000_000,
            monthlyContribution: 0,
            expectedAnnualReturnRate: 0.03,
          },
        ],
      }),
    ).toEqual({
      status: "ok",
      totalBalance: 5_000_000,
      totalMonthlyContribution: 0,
      balanceWeightedAnnualReturnRate: 0.03,
      contributionWeightedAnnualReturnRate: 0,
    });
  });

  it("rejects negative balances or contributions", () => {
    expect(
      calculateAllocationReturn({
        accounts: [
          {
            name: "Invalid",
            balance: -1,
            monthlyContribution: 100_000,
            expectedAnnualReturnRate: 0.03,
          },
        ],
      }),
    ).toEqual({
      status: "invalid",
      reason: "negative-amount",
      totalBalance: null,
      totalMonthlyContribution: null,
      balanceWeightedAnnualReturnRate: null,
      contributionWeightedAnnualReturnRate: null,
    });
  });

  it("rejects return assumptions outside the simple model bounds", () => {
    expect(
      calculateAllocationReturn({
        accounts: [
          {
            name: "Unbounded",
            balance: 1_000_000,
            monthlyContribution: 100_000,
            expectedAnnualReturnRate: 0.75,
          },
        ],
      }),
    ).toEqual({
      status: "invalid",
      reason: "invalid-return-rate",
      totalBalance: null,
      totalMonthlyContribution: null,
      balanceWeightedAnnualReturnRate: null,
      contributionWeightedAnnualReturnRate: null,
    });
  });
});
