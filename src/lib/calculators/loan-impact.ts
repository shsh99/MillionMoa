import { calculateMonthsToGoal } from "./goal-timeline";

export type LoanImpactReason =
  | "invalid-number"
  | "negative-amount"
  | "non-integer-krw"
  | "invalid-loan-rate"
  | "invalid-term"
  | "payment-does-not-cover-interest"
  | "baseline-invalid-return-rate"
  | "baseline-max-months-exceeded"
  | "baseline-no-progress"
  | "changed-invalid-return-rate"
  | "changed-max-months-exceeded"
  | "changed-no-progress";

export type LoanImpactStatus = "available" | "unavailable";

export type LoanImpactInput = {
  principal: number;
  annualInterestRate: number;
  remainingTermMonths: number;
  extraMonthlyPayment?: number;
  currentAmount: number;
  goalAmount: number;
  baselineMonthlyContribution: number;
  annualReturnRate: number;
  maxMonths?: number;
};

export type LoanImpactResult = {
  status: LoanImpactStatus;
  reason?: LoanImpactReason;
  scheduledMonthlyPayment: number | null;
  totalMonthlyLoanPayment: number | null;
  firstMonthInterest: number | null;
  totalInterest: number | null;
  totalPayment: number | null;
  payoffMonths: number | null;
  changedMonthlyContribution: number | null;
  baselineMonthsToGoal: number | null;
  changedMonthsToGoal: number | null;
  monthsDelayed: number | null;
};

const maxAnnualLoanRate = 1;

function unavailable(reason: LoanImpactReason): LoanImpactResult {
  return {
    status: "unavailable",
    reason,
    scheduledMonthlyPayment: null,
    totalMonthlyLoanPayment: null,
    firstMonthInterest: null,
    totalInterest: null,
    totalPayment: null,
    payoffMonths: null,
    changedMonthlyContribution: null,
    baselineMonthsToGoal: null,
    changedMonthsToGoal: null,
    monthsDelayed: null,
  };
}

function roundWon(value: number) {
  return Math.round(value);
}

function scheduledPayment(principal: number, monthlyRate: number, remainingTermMonths: number) {
  if (principal === 0) {
    return 0;
  }

  if (monthlyRate === 0) {
    return principal / remainingTermMonths;
  }

  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -remainingTermMonths));
}

function unavailableTimelineReason(
  side: "baseline" | "changed",
  reason: "invalid-return-rate" | "max-months-exceeded" | "no-progress" | undefined,
): LoanImpactReason {
  return `${side}-${reason ?? "max-months-exceeded"}` as LoanImpactReason;
}

function calculateMonthsToGoalWithLoanRecovery({
  annualReturnRate,
  baselineMonthlyContribution,
  changedMonthlyContribution,
  currentAmount,
  goalAmount,
  maxMonths,
  payoffMonths,
}: {
  annualReturnRate: number;
  baselineMonthlyContribution: number;
  changedMonthlyContribution: number;
  currentAmount: number;
  goalAmount: number;
  maxMonths?: number;
  payoffMonths: number;
}) {
  const limit = maxMonths ?? 1_200;

  if (annualReturnRate < -1 || annualReturnRate > 0.5) {
    return { months: null, reached: false, reason: "invalid-return-rate" as const };
  }

  if (currentAmount >= goalAmount) {
    return { months: 0, reached: true };
  }

  if (baselineMonthlyContribution <= 0 && annualReturnRate <= 0) {
    return { months: null, reached: false, reason: "no-progress" as const };
  }

  const monthlyRate = annualReturnRate / 12;
  let balance = currentAmount;

  for (let month = 1; month <= limit; month += 1) {
    const monthlyContribution = month <= payoffMonths ? changedMonthlyContribution : baselineMonthlyContribution;

    balance = balance * (1 + monthlyRate) + monthlyContribution;

    if (balance >= goalAmount) {
      return { months: month, reached: true };
    }
  }

  return { months: null, reached: false, reason: "max-months-exceeded" as const };
}

export function calculateLoanImpact(input: LoanImpactInput): LoanImpactResult {
  const extraMonthlyPayment = input.extraMonthlyPayment ?? 0;
  const krwAmounts = [
    input.principal,
    extraMonthlyPayment,
    input.currentAmount,
    input.goalAmount,
    input.baselineMonthlyContribution,
  ];
  const numericInputs = [
    ...krwAmounts,
    input.annualInterestRate,
    input.remainingTermMonths,
    input.annualReturnRate,
    input.maxMonths ?? 1,
  ];

  if (numericInputs.some((amount) => !Number.isFinite(amount))) {
    return unavailable("invalid-number");
  }

  if (
    input.principal < 0 ||
    extraMonthlyPayment < 0 ||
    input.goalAmount < 0 ||
    input.baselineMonthlyContribution < 0
  ) {
    return unavailable("negative-amount");
  }

  if (krwAmounts.some((amount) => !Number.isInteger(amount))) {
    return unavailable("non-integer-krw");
  }

  if (input.annualInterestRate < 0 || input.annualInterestRate > maxAnnualLoanRate) {
    return unavailable("invalid-loan-rate");
  }

  if (!Number.isInteger(input.remainingTermMonths) || input.remainingTermMonths <= 0) {
    return unavailable("invalid-term");
  }

  const monthlyRate = input.annualInterestRate / 12;
  const scheduledMonthlyPayment = roundWon(
    scheduledPayment(input.principal, monthlyRate, input.remainingTermMonths),
  );
  const totalMonthlyLoanPayment = scheduledMonthlyPayment + extraMonthlyPayment;
  const firstMonthInterest = roundWon(input.principal * monthlyRate);

  if (input.principal > 0 && totalMonthlyLoanPayment <= firstMonthInterest) {
    return unavailable("payment-does-not-cover-interest");
  }

  let balance = input.principal;
  let totalInterest = 0;
  let totalPayment = 0;
  let payoffMonths = 0;

  while (balance > 0 && payoffMonths < input.remainingTermMonths) {
    const interest = balance * monthlyRate;
    const payment = Math.min(totalMonthlyLoanPayment, balance + interest);
    const principalPaid = payment - interest;

    totalInterest += interest;
    totalPayment += payment;
    balance = Math.max(0, balance - principalPaid);
    payoffMonths += 1;
  }

  const changedMonthlyContribution = Math.max(0, input.baselineMonthlyContribution - totalMonthlyLoanPayment);
  const baseTimelineInput = {
    currentAmount: input.currentAmount,
    goalAmount: input.goalAmount,
    annualReturnRate: input.annualReturnRate,
    maxMonths: input.maxMonths,
  };
  const baselineTimeline = calculateMonthsToGoal({
    ...baseTimelineInput,
    monthlyContribution: input.baselineMonthlyContribution,
  });
  const changedTimeline = calculateMonthsToGoalWithLoanRecovery({
    ...baseTimelineInput,
    baselineMonthlyContribution: input.baselineMonthlyContribution,
    changedMonthlyContribution,
    payoffMonths,
  });

  if (!baselineTimeline.reached || baselineTimeline.months === null) {
    return {
      ...unavailable(unavailableTimelineReason("baseline", baselineTimeline.reason)),
      scheduledMonthlyPayment,
      totalMonthlyLoanPayment,
      firstMonthInterest,
      totalInterest: roundWon(totalInterest),
      totalPayment: roundWon(totalPayment),
      payoffMonths,
      changedMonthlyContribution,
      baselineMonthsToGoal: baselineTimeline.months,
      changedMonthsToGoal: changedTimeline.months,
    };
  }

  if (!changedTimeline.reached || changedTimeline.months === null) {
    return {
      ...unavailable(unavailableTimelineReason("changed", changedTimeline.reason)),
      scheduledMonthlyPayment,
      totalMonthlyLoanPayment,
      firstMonthInterest,
      totalInterest: roundWon(totalInterest),
      totalPayment: roundWon(totalPayment),
      payoffMonths,
      changedMonthlyContribution,
      baselineMonthsToGoal: baselineTimeline.months,
      changedMonthsToGoal: changedTimeline.months,
    };
  }

  return {
    status: "available",
    scheduledMonthlyPayment,
    totalMonthlyLoanPayment,
    firstMonthInterest,
    totalInterest: roundWon(totalInterest),
    totalPayment: roundWon(totalPayment),
    payoffMonths,
    changedMonthlyContribution,
    baselineMonthsToGoal: baselineTimeline.months,
    changedMonthsToGoal: changedTimeline.months,
    monthsDelayed: changedTimeline.months - baselineTimeline.months,
  };
}
