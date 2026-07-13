export type AllocationAccountInput = {
  name: string;
  balance: number;
  monthlyContribution: number;
  expectedAnnualReturnRate: number;
};

export type AllocationReturnStatus = "ok" | "empty" | "invalid";

export type AllocationReturnReason = "negative-amount" | "invalid-return-rate";

export type AllocationReturnInput = {
  accounts: AllocationAccountInput[];
};

export type AllocationReturnResult = {
  status: AllocationReturnStatus;
  reason?: AllocationReturnReason;
  totalBalance: number | null;
  totalMonthlyContribution: number | null;
  balanceWeightedAnnualReturnRate: number | null;
  contributionWeightedAnnualReturnRate: number | null;
};

function weightedAverage(
  accounts: AllocationAccountInput[],
  weightKey: "balance" | "monthlyContribution",
): number {
  const totalWeight = accounts.reduce((sum, account) => sum + account[weightKey], 0);

  if (totalWeight === 0) {
    return 0;
  }

  const weightedReturn = accounts.reduce((sum, account) => {
    return sum + account.expectedAnnualReturnRate * account[weightKey];
  }, 0);

  return weightedReturn / totalWeight;
}

export function calculateAllocationReturn(input: AllocationReturnInput): AllocationReturnResult {
  if (input.accounts.length === 0) {
    return {
      status: "empty",
      totalBalance: 0,
      totalMonthlyContribution: 0,
      balanceWeightedAnnualReturnRate: 0,
      contributionWeightedAnnualReturnRate: 0,
    };
  }

  if (input.accounts.some((account) => account.balance < 0 || account.monthlyContribution < 0)) {
    return {
      status: "invalid",
      reason: "negative-amount",
      totalBalance: null,
      totalMonthlyContribution: null,
      balanceWeightedAnnualReturnRate: null,
      contributionWeightedAnnualReturnRate: null,
    };
  }

  if (
    input.accounts.some((account) => {
      return account.expectedAnnualReturnRate < -1 || account.expectedAnnualReturnRate > 0.5;
    })
  ) {
    return {
      status: "invalid",
      reason: "invalid-return-rate",
      totalBalance: null,
      totalMonthlyContribution: null,
      balanceWeightedAnnualReturnRate: null,
      contributionWeightedAnnualReturnRate: null,
    };
  }

  const totalBalance = input.accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalMonthlyContribution = input.accounts.reduce((sum, account) => {
    return sum + account.monthlyContribution;
  }, 0);

  return {
    status: "ok",
    totalBalance,
    totalMonthlyContribution,
    balanceWeightedAnnualReturnRate: weightedAverage(input.accounts, "balance"),
    contributionWeightedAnnualReturnRate: weightedAverage(input.accounts, "monthlyContribution"),
  };
}
