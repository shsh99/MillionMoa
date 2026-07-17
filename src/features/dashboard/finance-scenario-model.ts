import { z } from "zod";
import {
  calculateExpenseSummary,
  expenseCategories,
  type ExpenseItem,
} from "./expense-management-model";

export type AssetAccountCategory =
  | "checking"
  | "parking"
  | "savings"
  | "deposit"
  | "investment"
  | "deposit-bond"
  | "other";

export type LoanCategory =
  | "credit"
  | "jeonse"
  | "mortgage"
  | "student"
  | "card"
  | "other";

export type LoanRepaymentMethod = "equal-payment" | "equal-principal" | "bullet";

export type AssetAccount = {
  id: string;
  name: string;
  category: AssetAccountCategory;
  balance: number;
  annualRate?: number;
  monthlyContribution?: number;
  maturityMonth?: number;
};

export type Loan = {
  id: string;
  name: string;
  category: LoanCategory;
  principal: number;
  annualRate: number;
  remainingMonths: number;
  repaymentMethod: LoanRepaymentMethod;
};

export type FinanceScenarioInput = {
  assets: AssetAccount[];
  loans: Loan[];
  expenses: ExpenseItem[];
  manualLiabilities?: number;
  monthlyIncome: number;
  monthlyNonLoanExpense: number;
};

const nonNegativeIntegerSchema = z.number().int().nonnegative();
const isoDateSchema = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "must be a valid ISO date");

const categoryKindById = new Map<string, ExpenseItem["kind"]>(
  expenseCategories.map(({ id, kind }) => [id, kind]),
);

const expenseItemSchema: z.ZodType<ExpenseItem> = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(80),
  kind: z.enum(["fixed", "living", "irregular"]),
  categoryId: z.enum(expenseCategories.map(({ id }) => id) as [string, ...string[]]),
  amount: z.number().int().nonnegative().max(1_000_000_000_000),
  frequency: z.enum(["weekly", "monthly", "quarterly", "annual", "one-time"]),
  paymentDay: z.number().int().min(1).max(31).optional(),
  nextPaymentDate: isoDateSchema.optional(),
  startDate: isoDateSchema,
  endDate: isoDateSchema.optional(),
  autoRenewal: z.boolean(),
  note: z.string().max(500).optional(),
}).superRefine((expense, context) => {
  if (categoryKindById.get(expense.categoryId) !== expense.kind) {
    context.addIssue({ code: "custom", path: ["categoryId"], message: "category must match expense kind" });
  }
  if (expense.endDate !== undefined && expense.endDate < expense.startDate) {
    context.addIssue({ code: "custom", path: ["endDate"], message: "endDate must not precede startDate" });
  }
});

const assetAccountSchema = z.object({
  id: z.string().max(128),
  name: z.string().max(80),
  category: z.enum([
    "checking",
    "parking",
    "savings",
    "deposit",
    "investment",
    "deposit-bond",
    "other",
  ]),
  balance: nonNegativeIntegerSchema,
  annualRate: z.number().min(-1).max(1).optional(),
  monthlyContribution: nonNegativeIntegerSchema.optional(),
  maturityMonth: nonNegativeIntegerSchema.optional(),
});

const loanSchema = z.object({
  id: z.string().max(128),
  name: z.string().max(80),
  category: z.enum(["credit", "jeonse", "mortgage", "student", "card", "other"]),
  principal: nonNegativeIntegerSchema,
  annualRate: z.number().min(0).max(1),
  remainingMonths: z.number().int().min(1).max(1_200),
  repaymentMethod: z.enum(["equal-payment", "equal-principal", "bullet"]),
});

export const financeScenarioSchema: z.ZodType<FinanceScenarioInput> = z.object({
  assets: z.array(assetAccountSchema).max(100),
  loans: z.array(loanSchema).max(100),
  expenses: z.array(expenseItemSchema).max(500),
  manualLiabilities: nonNegativeIntegerSchema.optional(),
  monthlyIncome: nonNegativeIntegerSchema,
  monthlyNonLoanExpense: nonNegativeIntegerSchema,
});

export type LoanScheduleSummary = {
  loanId: string;
  firstMonthlyPayment: number;
  totalInterest: number;
};

export type FinanceProjectionPoint = {
  month: number;
  zero: 0;
  baseline: number;
  debtAdjusted: number;
};

const MAX_ANNUAL_RATE = 1;
const MAX_LOAN_TERM_MONTHS = 1_200;

function assertNonNegativeKrw(value: number, label: string) {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer KRW amount`);
  }
}

function assertLoan(loan: Loan) {
  assertNonNegativeKrw(loan.principal, "loan principal");
  if (!Number.isFinite(loan.annualRate) || loan.annualRate < 0 || loan.annualRate > MAX_ANNUAL_RATE) {
    throw new RangeError("loan annualRate must be between 0 and 1");
  }
  if (
    !Number.isInteger(loan.remainingMonths)
    || loan.remainingMonths <= 0
    || loan.remainingMonths > MAX_LOAN_TERM_MONTHS
  ) {
    throw new RangeError("loan remainingMonths must be between 1 and 1200");
  }
  if (!["equal-payment", "equal-principal", "bullet"].includes(loan.repaymentMethod)) {
    throw new RangeError("loan repaymentMethod is unsupported");
  }
}

function equalPayment(principal: number, monthlyRate: number, months: number) {
  if (principal === 0) return 0;
  if (monthlyRate === 0) return principal / months;
  const growth = (1 + monthlyRate) ** months;
  return principal * monthlyRate * growth / (growth - 1);
}

function loanPaymentAtMonth(loan: Loan, month: number) {
  if (month < 1 || month > loan.remainingMonths || loan.principal === 0) return 0;
  const monthlyRate = loan.annualRate / 12;

  if (loan.repaymentMethod === "equal-payment") {
    return equalPayment(loan.principal, monthlyRate, loan.remainingMonths);
  }
  if (loan.repaymentMethod === "equal-principal") {
    const balance = loan.principal * (loan.remainingMonths - month + 1) / loan.remainingMonths;
    return loan.principal / loan.remainingMonths + balance * monthlyRate;
  }
  return loan.principal * monthlyRate + (month === loan.remainingMonths ? loan.principal : 0);
}

function loanBalanceAfterMonth(loan: Loan, elapsedMonths: number) {
  if (elapsedMonths <= 0) return loan.principal;
  if (elapsedMonths >= loan.remainingMonths) return 0;
  if (loan.repaymentMethod === "bullet") return loan.principal;
  if (loan.repaymentMethod === "equal-principal") {
    return loan.principal * (loan.remainingMonths - elapsedMonths) / loan.remainingMonths;
  }

  const monthlyRate = loan.annualRate / 12;
  if (monthlyRate === 0) {
    return loan.principal * (loan.remainingMonths - elapsedMonths) / loan.remainingMonths;
  }
  const payment = equalPayment(loan.principal, monthlyRate, loan.remainingMonths);
  return loan.principal * (1 + monthlyRate) ** elapsedMonths
    - payment * (((1 + monthlyRate) ** elapsedMonths - 1) / monthlyRate);
}

export function calculateLoanScheduleSummary(loan: Loan): LoanScheduleSummary {
  assertLoan(loan);
  let totalPayments = 0;
  for (let month = 1; month <= loan.remainingMonths; month += 1) {
    totalPayments += loanPaymentAtMonth(loan, month);
  }

  return {
    loanId: loan.id,
    firstMonthlyPayment: loanPaymentAtMonth(loan, 1),
    totalInterest: totalPayments - loan.principal,
  };
}

function validateScenario(input: FinanceScenarioInput) {
  assertNonNegativeKrw(input.manualLiabilities ?? 0, "manual liabilities");
  assertNonNegativeKrw(input.monthlyIncome, "monthly income");
  assertNonNegativeKrw(input.monthlyNonLoanExpense, "monthly non-loan expense");
  expenseItemSchema.array().max(500).parse(input.expenses);
  for (const asset of input.assets) {
    assertNonNegativeKrw(asset.balance, "asset balance");
    const annualRate = asset.annualRate ?? 0;
    if (!Number.isFinite(annualRate) || annualRate < -1 || annualRate > 1) {
      throw new RangeError("asset annualRate must be between -1 and 1");
    }
    assertNonNegativeKrw(asset.monthlyContribution ?? 0, "asset monthly contribution");
    if (
      asset.maturityMonth !== undefined
      && (!Number.isInteger(asset.maturityMonth) || asset.maturityMonth < 0)
    ) {
      throw new RangeError("asset maturityMonth must be a non-negative integer");
    }
  }
}

export function calculateFinanceScenario(
  input: FinanceScenarioInput,
  options: { referenceDate?: string } = {},
) {
  validateScenario(input);
  const monthlyNonLoanExpense = calculateExpenseSummary(
    input.expenses,
    options.referenceDate,
  ).monthlyTotal;
  const loanSummaries = input.loans.map(calculateLoanScheduleSummary);
  const totalAssetBalances = input.assets.reduce((total, asset) => total + asset.balance, 0);
  const totalLoanPrincipals = input.loans.reduce((total, loan) => total + loan.principal, 0);
  const totalLiabilities = totalLoanPrincipals + (input.manualLiabilities ?? 0);
  const totalLoanPayment = loanSummaries.reduce(
    (total, summary) => total + summary.firstMonthlyPayment,
    0,
  );
  const rawMonthlySurplus = input.monthlyIncome
    - monthlyNonLoanExpense
    - totalLoanPayment;

  return {
    totalAssetBalances,
    totalLoanPrincipals,
    totalLiabilities,
    netWorth: totalAssetBalances - totalLiabilities,
    monthlyIncome: input.monthlyIncome,
    monthlyNonLoanExpense,
    totalLoanPayment,
    rawMonthlySurplus,
    goalContribution: Math.max(0, rawMonthlySurplus),
    loanSummaries,
  };
}

type ProjectionState = {
  accountBalances: number[];
  cash: number;
};

function advanceProjectionState(
  state: ProjectionState,
  assets: AssetAccount[],
  month: number,
  cashFlow: number,
) {
  for (const [index, asset] of assets.entries()) {
    if (month <= (asset.maturityMonth ?? Number.POSITIVE_INFINITY)) {
      state.accountBalances[index] *= 1 + (asset.annualRate ?? 0) / 12;
    }
  }

  if (cashFlow <= 0) {
    let deficit = -cashFlow;
    const availableCash = Math.max(0, state.cash);
    const cashUsed = Math.min(availableCash, deficit);
    state.cash -= cashUsed;
    deficit -= cashUsed;
    for (let index = 0; index < state.accountBalances.length && deficit > 0; index += 1) {
      const used = Math.min(state.accountBalances[index], deficit);
      state.accountBalances[index] -= used;
      deficit -= used;
    }
    state.cash -= deficit;
    return;
  }

  if (state.cash < 0) {
    const debtRepaid = Math.min(cashFlow, -state.cash);
    state.cash += debtRepaid;
    cashFlow -= debtRepaid;
    if (cashFlow === 0) return;
  }

  const requestedContributions = assets.map((asset) => (
    month <= (asset.maturityMonth ?? Number.POSITIVE_INFINITY)
      ? (asset.monthlyContribution ?? 0)
      : 0
  ));
  const totalRequested = requestedContributions.reduce((total, amount) => total + amount, 0);
  const allocatedTotal = Math.min(cashFlow, totalRequested);

  if (totalRequested > 0) {
    for (const [index, requested] of requestedContributions.entries()) {
      state.accountBalances[index] += allocatedTotal * requested / totalRequested;
    }
  }
  state.cash += cashFlow - allocatedTotal;
}

function totalProjectedAssets(state: ProjectionState) {
  return state.cash + state.accountBalances.reduce((total, balance) => total + balance, 0);
}

export function createFinanceProjectionSeries(
  input: FinanceScenarioInput,
  options: { maxMonths?: number; intervalMonths?: number; referenceDate?: string } = {},
): FinanceProjectionPoint[] {
  calculateFinanceScenario(input, { referenceDate: options.referenceDate });
  const initialBalances = input.assets.map((asset) => asset.balance);
  const baselineState: ProjectionState = { accountBalances: [...initialBalances], cash: 0 };
  const debtAdjustedState: ProjectionState = { accountBalances: [...initialBalances], cash: 0 };
  const points: FinanceProjectionPoint[] = [];

  const maxMonths = options.maxMonths ?? 120;
  const intervalMonths = options.intervalMonths ?? 12;
  const referenceDate = options.referenceDate ?? new Date().toISOString().slice(0, 10);
  const referenceMonth = new Date(`${referenceDate.slice(0, 7)}-01T00:00:00.000Z`);
  if (Number.isNaN(referenceMonth.valueOf())) {
    throw new RangeError("reference date must be an ISO date or month");
  }
  if (!Number.isInteger(maxMonths) || maxMonths < 0 || maxMonths > 1_200) {
    throw new RangeError("projection maxMonths must be between 0 and 1200");
  }
  if (!Number.isInteger(intervalMonths) || intervalMonths <= 0) {
    throw new RangeError("projection intervalMonths must be a positive integer");
  }

  for (let month = 0; month <= maxMonths; month += 1) {
    if (month > 0) {
      const projectedMonth = new Date(Date.UTC(
        referenceMonth.getUTCFullYear(),
        referenceMonth.getUTCMonth() + month,
        1,
      )).toISOString().slice(0, 7);
      const monthlyNonLoanExpense = calculateExpenseSummary(
        input.expenses,
        projectedMonth,
      ).monthlyTotal;
      const preLoanCashFlow = input.monthlyIncome - monthlyNonLoanExpense;
      const loanPayment = input.loans.reduce(
        (total, loan) => total + loanPaymentAtMonth(loan, month),
        0,
      );
      advanceProjectionState(baselineState, input.assets, month, preLoanCashFlow);
      advanceProjectionState(
        debtAdjustedState,
        input.assets,
        month,
        preLoanCashFlow - loanPayment,
      );
    }

    if (month % intervalMonths === 0 || month === maxMonths) {
      const remainingLoanBalance = input.loans.reduce(
        (total, loan) => total + loanBalanceAfterMonth(loan, month),
        0,
      );
      points.push({
        month,
        zero: 0,
        baseline: totalProjectedAssets(baselineState),
        debtAdjusted: totalProjectedAssets(debtAdjustedState)
          - remainingLoanBalance
          - (input.manualLiabilities ?? 0),
      });
    }
  }

  return points;
}

export function calculateScenarioMonthsToGoal(
  input: FinanceScenarioInput,
  goalAmount: number,
  maxMonths = 1_200,
) {
  assertNonNegativeKrw(goalAmount, "goal amount");
  const series = createFinanceProjectionSeries(input, { maxMonths, intervalMonths: 1 });
  return series.find((point) => point.debtAdjusted >= goalAmount)?.month ?? null;
}
