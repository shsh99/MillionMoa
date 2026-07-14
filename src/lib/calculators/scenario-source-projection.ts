import {
  calculateContributionSourceLedger,
  type ContributionSourceInput,
  type ContributionSourceLedgerReason,
} from "./contribution-source-ledger";
import {
  calculateScenarioProjection,
  type ScenarioProjectionReason,
  type ScenarioProjectionStatus,
} from "./scenario-projection";

export type SourceBackedScenarioAccountInput = {
  name: string;
  balance: number;
  expectedAnnualReturnRate: number;
  contributionSources: ContributionSourceInput[];
};

export type SourceBackedScenarioProjectionReason =
  | ContributionSourceLedgerReason
  | ScenarioProjectionReason
  | "source-month-mismatch";

export type SourceBackedScenarioProjectionInput = {
  goalAmount: number;
  month: string;
  accounts: SourceBackedScenarioAccountInput[];
  maxMonths?: number;
};

export type SourceBackedScenarioProjectionResult = {
  status: ScenarioProjectionStatus;
  month: string;
  reason?: SourceBackedScenarioProjectionReason;
  totalBalance: number | null;
  totalMonthlyContribution: number | null;
  projectedAnnualReturnRate: number | null;
  monthsToGoal: number | null;
};

function unavailableResult(
  input: SourceBackedScenarioProjectionInput,
  reason: SourceBackedScenarioProjectionReason,
): SourceBackedScenarioProjectionResult {
  return {
    status: "unavailable",
    month: input.month,
    reason,
    totalBalance: null,
    totalMonthlyContribution: null,
    projectedAnnualReturnRate: null,
    monthsToGoal: null,
  };
}

function sourceAmountForAccount(account: SourceBackedScenarioAccountInput): number {
  return account.contributionSources.reduce((sum, source) => {
    return sum + source.amount;
  }, 0);
}

export function calculateSourceBackedScenarioProjection(
  input: SourceBackedScenarioProjectionInput,
): SourceBackedScenarioProjectionResult {
  const sources = input.accounts.flatMap((account) => account.contributionSources);

  if (
    sources.some((source) => {
      return source.month !== input.month;
    })
  ) {
    return unavailableResult(input, "source-month-mismatch");
  }

  const ledger = calculateContributionSourceLedger({ sources });

  if (ledger.status === "invalid") {
    return unavailableResult(input, ledger.reason ?? "invalid-number");
  }

  const projection = calculateScenarioProjection({
    goalAmount: input.goalAmount,
    maxMonths: input.maxMonths,
    accounts: input.accounts.map((account) => {
      return {
        name: account.name,
        balance: account.balance,
        monthlyContribution: sourceAmountForAccount(account),
        expectedAnnualReturnRate: account.expectedAnnualReturnRate,
      };
    }),
  });

  return {
    status: projection.status,
    month: input.month,
    reason: projection.reason,
    totalBalance: projection.totalBalance,
    totalMonthlyContribution: projection.totalMonthlyContribution,
    projectedAnnualReturnRate: projection.projectedAnnualReturnRate,
    monthsToGoal: projection.monthsToGoal,
  };
}
