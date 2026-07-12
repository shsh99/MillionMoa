export type GoalTimelineInput = {
  currentAmount: number;
  goalAmount: number;
  monthlyContribution: number;
  annualReturnRate: number;
  maxMonths?: number;
};

export type GoalTimelineResult = {
  months: number | null;
  reached: boolean;
};

export function calculateMonthsToGoal(input: GoalTimelineInput): GoalTimelineResult {
  const maxMonths = input.maxMonths ?? 1_200;

  if (input.currentAmount >= input.goalAmount) {
    return { months: 0, reached: true };
  }

  if (input.monthlyContribution <= 0 && input.annualReturnRate <= 0) {
    return { months: null, reached: false };
  }

  const monthlyRate = input.annualReturnRate / 12;
  let balance = input.currentAmount;

  for (let month = 1; month <= maxMonths; month += 1) {
    balance = balance * (1 + monthlyRate) + input.monthlyContribution;

    if (balance >= input.goalAmount) {
      return { months: month, reached: true };
    }
  }

  return { months: null, reached: false };
}
