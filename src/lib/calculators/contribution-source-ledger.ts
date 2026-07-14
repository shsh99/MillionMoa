export type ContributionSourceKind =
  | "salary-bucket-transfer"
  | "month-end-sweep"
  | "scenario-surplus"
  | "bonus"
  | "tax-refund"
  | "manual";

export type ContributionSourceInput = {
  month: string;
  sourceId: string;
  kind: ContributionSourceKind;
  label: string;
  amount: number;
};

export type ContributionSourceLedgerStatus = "ok" | "empty" | "invalid";

export type ContributionSourceLedgerReason =
  | "duplicate-source-for-month"
  | "blank-source-id"
  | "invalid-month"
  | "invalid-number"
  | "negative-amount"
  | "non-integer-krw";

export type MonthlyContributionTotal = {
  month: string;
  totalContribution: number;
  sources: ContributionSourceInput[];
};

export type ContributionSourceLedgerInput = {
  sources: ContributionSourceInput[];
};

export type ContributionSourceLedgerResult = {
  status: ContributionSourceLedgerStatus;
  reason?: ContributionSourceLedgerReason;
  totalMonthlyContribution: number | null;
  monthlyTotals: MonthlyContributionTotal[];
};

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function invalidResult(reason: ContributionSourceLedgerReason): ContributionSourceLedgerResult {
  return {
    status: "invalid",
    reason,
    totalMonthlyContribution: null,
    monthlyTotals: [],
  };
}

function hasDuplicateSourceForMonth(sources: ContributionSourceInput[]): boolean {
  const sourceKeys = new Set<string>();

  return sources.some((source) => {
    const key = `${source.month}:${source.sourceId}`;

    if (sourceKeys.has(key)) {
      return true;
    }

    sourceKeys.add(key);
    return false;
  });
}

function toMonthlyTotals(sources: ContributionSourceInput[]): MonthlyContributionTotal[] {
  const monthlyTotals = new Map<string, MonthlyContributionTotal>();

  for (const source of sources) {
    const existing = monthlyTotals.get(source.month);

    if (existing) {
      existing.totalContribution += source.amount;
      existing.sources.push(source);
      continue;
    }

    monthlyTotals.set(source.month, {
      month: source.month,
      totalContribution: source.amount,
      sources: [source],
    });
  }

  return [...monthlyTotals.values()].sort((left, right) => left.month.localeCompare(right.month));
}

export function calculateContributionSourceLedger(
  input: ContributionSourceLedgerInput,
): ContributionSourceLedgerResult {
  if (input.sources.length === 0) {
    return {
      status: "empty",
      totalMonthlyContribution: 0,
      monthlyTotals: [],
    };
  }

  if (
    input.sources.some((source) => {
      return !Number.isFinite(source.amount);
    })
  ) {
    return invalidResult("invalid-number");
  }

  if (
    input.sources.some((source) => {
      return source.amount < 0;
    })
  ) {
    return invalidResult("negative-amount");
  }

  if (
    input.sources.some((source) => {
      return !Number.isInteger(source.amount);
    })
  ) {
    return invalidResult("non-integer-krw");
  }

  if (
    input.sources.some((source) => {
      return !MONTH_KEY_PATTERN.test(source.month);
    })
  ) {
    return invalidResult("invalid-month");
  }

  if (
    input.sources.some((source) => {
      return source.sourceId.trim().length === 0;
    })
  ) {
    return invalidResult("blank-source-id");
  }

  if (hasDuplicateSourceForMonth(input.sources)) {
    return invalidResult("duplicate-source-for-month");
  }

  const monthlyTotals = toMonthlyTotals(input.sources);

  return {
    status: "ok",
    totalMonthlyContribution: monthlyTotals.reduce((sum, month) => {
      return sum + month.totalContribution;
    }, 0),
    monthlyTotals,
  };
}
