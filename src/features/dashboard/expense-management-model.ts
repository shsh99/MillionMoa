export type ExpenseKind = "fixed" | "living" | "irregular";

export type ExpenseFrequency = "weekly" | "monthly" | "quarterly" | "annual" | "one-time";

export type ExpenseItem = {
  id: string;
  name: string;
  kind: ExpenseKind;
  categoryId: string;
  amount: number;
  frequency: ExpenseFrequency;
  paymentDay?: number;
  nextPaymentDate?: string;
  startDate: string;
  endDate?: string;
  autoRenewal: boolean;
  note?: string;
};

export const expenseCategories = [
  { id: "fixed.housing", kind: "fixed", name: "주거" },
  { id: "fixed.utilities", kind: "fixed", name: "공과금" },
  { id: "fixed.telecom", kind: "fixed", name: "통신" },
  { id: "fixed.insurance", kind: "fixed", name: "보험" },
  { id: "fixed.subscription", kind: "fixed", name: "구독" },
  { id: "fixed.other", kind: "fixed", name: "기타 고정비" },
  { id: "living.food", kind: "living", name: "식비" },
  { id: "living.transport", kind: "living", name: "교통" },
  { id: "living.shopping", kind: "living", name: "쇼핑" },
  { id: "living.leisure", kind: "living", name: "여가" },
  { id: "living.other", kind: "living", name: "기타 생활비" },
  { id: "irregular.medical", kind: "irregular", name: "의료" },
  { id: "irregular.education", kind: "irregular", name: "교육" },
  { id: "irregular.travel", kind: "irregular", name: "여행" },
  { id: "irregular.gift", kind: "irregular", name: "경조사" },
  { id: "irregular.tax", kind: "irregular", name: "세금" },
  { id: "irregular.other", kind: "irregular", name: "기타 비정기비" },
] as const satisfies ReadonlyArray<{ id: string; kind: ExpenseKind; name: string }>;

export function calculateMonthlyExpenseEquivalent(expense: ExpenseItem): number {
  switch (expense.frequency) {
    case "weekly": return expense.amount * 52 / 12;
    case "monthly": return expense.amount;
    case "quarterly": return expense.amount / 3;
    case "annual": return expense.amount / 12;
    case "one-time": return 0;
  }
}

export function calculateAnnualExpenseEquivalent(expense: ExpenseItem): number {
  switch (expense.frequency) {
    case "weekly": return expense.amount * 52;
    case "monthly": return expense.amount * 12;
    case "quarterly": return expense.amount * 4;
    case "annual": return expense.amount;
    case "one-time": return 0;
  }
}

export function calculateExpenseSummary(expenses: ExpenseItem[]) {
  const monthlyByKind: Record<ExpenseKind, number> = { fixed: 0, living: 0, irregular: 0 };
  let monthlyTotal = 0;
  let annualTotal = 0;

  for (const expense of expenses) {
    const monthly = calculateMonthlyExpenseEquivalent(expense);
    monthlyTotal += monthly;
    annualTotal += calculateAnnualExpenseEquivalent(expense);
    monthlyByKind[expense.kind] += monthly;
  }

  return {
    monthlyTotal: Math.round(monthlyTotal),
    annualTotal: Math.round(annualTotal),
    byKind: {
      fixed: Math.round(monthlyByKind.fixed),
      living: Math.round(monthlyByKind.living),
      irregular: Math.round(monthlyByKind.irregular),
    },
  };
}
