export type MonthEndSweepSource = "actual-month-end-leftover";

export type MonthEndSweepTargetInput = {
  key: string;
  label: string;
  requestedAmount: number;
};

export type MonthEndSweepStatus =
  | "fully-swept"
  | "partially-swept"
  | "unallocated"
  | "no-sweep"
  | "shortfall"
  | "invalid";

export type MonthEndSweepReason =
  | "insufficient-sweepable-cash"
  | "actual-cashflow-shortfall"
  | "negative-amount"
  | "invalid-number"
  | "non-integer-krw"
  | "duplicate-target";

export type MonthEndSweepInput = {
  actualIncomeReceived: number;
  actualExpensesPaid: number;
  plannedTransfersMade: number;
  reservedCash: number;
  targets: MonthEndSweepTargetInput[];
};

export type SweptMonthEndTarget = MonthEndSweepTargetInput & {
  sweptAmount: number;
  unmetAmount: number;
};

export type MonthEndSweepResult = {
  status: MonthEndSweepStatus;
  reason?: MonthEndSweepReason;
  source: MonthEndSweepSource;
  actualIncomeReceived: number;
  actualExpensesPaid: number;
  plannedTransfersMade: number;
  reservedCash: number;
  sweepableCash: number | null;
  shortfallAmount: number | null;
  totalRequested: number | null;
  totalSwept: number | null;
  unallocatedCash: number | null;
  unmetTargetAmount: number | null;
  targets: SweptMonthEndTarget[];
};

const MONTH_END_SWEEP_SOURCE: MonthEndSweepSource = "actual-month-end-leftover";

function hasDuplicateTargetKey(targets: MonthEndSweepTargetInput[]): boolean {
  const keys = new Set<string>();

  return targets.some((target) => {
    if (keys.has(target.key)) {
      return true;
    }

    keys.add(target.key);
    return false;
  });
}

function inputAmounts(input: MonthEndSweepInput): number[] {
  return [
    input.actualIncomeReceived,
    input.actualExpensesPaid,
    input.plannedTransfersMade,
    input.reservedCash,
    ...input.targets.map((target) => target.requestedAmount),
  ];
}

function invalidResult(
  input: MonthEndSweepInput,
  reason: MonthEndSweepReason,
): MonthEndSweepResult {
  return {
    status: "invalid",
    reason,
    source: MONTH_END_SWEEP_SOURCE,
    actualIncomeReceived: input.actualIncomeReceived,
    actualExpensesPaid: input.actualExpensesPaid,
    plannedTransfersMade: input.plannedTransfersMade,
    reservedCash: input.reservedCash,
    sweepableCash: null,
    shortfallAmount: null,
    totalRequested: null,
    totalSwept: null,
    unallocatedCash: null,
    unmetTargetAmount: null,
    targets: [],
  };
}

function allocateTargets(
  targets: MonthEndSweepTargetInput[],
  sweepableCash: number,
): SweptMonthEndTarget[] {
  let remainingCash = sweepableCash;

  return targets.map((target) => {
    const sweptAmount = Math.min(target.requestedAmount, remainingCash);
    remainingCash -= sweptAmount;

    return {
      ...target,
      sweptAmount,
      unmetAmount: target.requestedAmount - sweptAmount,
    };
  });
}

export function sweepMonthEndCash(input: MonthEndSweepInput): MonthEndSweepResult {
  const amounts = inputAmounts(input);

  if (
    amounts.some((amount) => {
      return !Number.isFinite(amount);
    })
  ) {
    return invalidResult(input, "invalid-number");
  }

  if (
    amounts.some((amount) => {
      return amount < 0;
    })
  ) {
    return invalidResult(input, "negative-amount");
  }

  if (
    amounts.some((amount) => {
      return !Number.isInteger(amount);
    })
  ) {
    return invalidResult(input, "non-integer-krw");
  }

  if (hasDuplicateTargetKey(input.targets)) {
    return invalidResult(input, "duplicate-target");
  }

  const rawSweepableCash =
    input.actualIncomeReceived -
    input.actualExpensesPaid -
    input.plannedTransfersMade -
    input.reservedCash;
  const shortfallAmount = Math.max(-rawSweepableCash, 0);
  const sweepableCash = Math.max(rawSweepableCash, 0);
  const totalRequested = input.targets.reduce((sum, target) => sum + target.requestedAmount, 0);
  const targets = allocateTargets(input.targets, sweepableCash);
  const totalSwept = targets.reduce((sum, target) => sum + target.sweptAmount, 0);
  const unmetTargetAmount = targets.reduce((sum, target) => sum + target.unmetAmount, 0);
  const unallocatedCash = sweepableCash - totalSwept;

  if (shortfallAmount > 0) {
    return {
      status: "shortfall",
      reason: "actual-cashflow-shortfall",
      source: MONTH_END_SWEEP_SOURCE,
      actualIncomeReceived: input.actualIncomeReceived,
      actualExpensesPaid: input.actualExpensesPaid,
      plannedTransfersMade: input.plannedTransfersMade,
      reservedCash: input.reservedCash,
      sweepableCash,
      shortfallAmount,
      totalRequested,
      totalSwept,
      unallocatedCash,
      unmetTargetAmount,
      targets,
    };
  }

  if (sweepableCash === 0) {
    return {
      status: "no-sweep",
      source: MONTH_END_SWEEP_SOURCE,
      actualIncomeReceived: input.actualIncomeReceived,
      actualExpensesPaid: input.actualExpensesPaid,
      plannedTransfersMade: input.plannedTransfersMade,
      reservedCash: input.reservedCash,
      sweepableCash,
      shortfallAmount,
      totalRequested,
      totalSwept,
      unallocatedCash,
      unmetTargetAmount,
      targets,
    };
  }

  if (totalSwept === 0) {
    return {
      status: "unallocated",
      source: MONTH_END_SWEEP_SOURCE,
      actualIncomeReceived: input.actualIncomeReceived,
      actualExpensesPaid: input.actualExpensesPaid,
      plannedTransfersMade: input.plannedTransfersMade,
      reservedCash: input.reservedCash,
      sweepableCash,
      shortfallAmount,
      totalRequested,
      totalSwept,
      unallocatedCash,
      unmetTargetAmount,
      targets,
    };
  }

  if (unmetTargetAmount > 0) {
    return {
      status: "partially-swept",
      reason: "insufficient-sweepable-cash",
      source: MONTH_END_SWEEP_SOURCE,
      actualIncomeReceived: input.actualIncomeReceived,
      actualExpensesPaid: input.actualExpensesPaid,
      plannedTransfersMade: input.plannedTransfersMade,
      reservedCash: input.reservedCash,
      sweepableCash,
      shortfallAmount,
      totalRequested,
      totalSwept,
      unallocatedCash,
      unmetTargetAmount,
      targets,
    };
  }

  return {
    status: "fully-swept",
    source: MONTH_END_SWEEP_SOURCE,
    actualIncomeReceived: input.actualIncomeReceived,
    actualExpensesPaid: input.actualExpensesPaid,
    plannedTransfersMade: input.plannedTransfersMade,
    reservedCash: input.reservedCash,
    sweepableCash,
    shortfallAmount,
    totalRequested,
    totalSwept,
    unallocatedCash,
    unmetTargetAmount,
    targets,
  };
}
