"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Landmark, Target, WalletCards } from "lucide-react";
import { MoneyInput } from "../../components/money-input";
import { ExpenseManagementEditor } from "./expense-management-editor";
import { FinanceScenarioEditor } from "./finance-scenario-editor";
import {
  calculateFinanceScenario,
  calculateScenarioMonthsToGoal,
  createFinanceProjectionSeries,
  type FinanceScenarioInput,
} from "./finance-scenario-model";
import { FinanceVisualizations } from "./finance-visualizations";
import {
  getFinanceScenarioStorageKey,
  loadFinanceScenario,
  saveFinanceScenario,
} from "./finance-scenario-storage";

const goalAmount = 100_000_000;
export const localFinanceScenarioOwner = "local-demo-profile";

export const initialFinanceScenario: FinanceScenarioInput = {
  assets: [
    { id: "parking", name: "생활비 파킹통장", category: "parking", balance: 4_000_000, annualRate: 0.025 },
    { id: "savings", name: "청년 적금", category: "savings", balance: 6_000_000, annualRate: 0.045, monthlyContribution: 700_000 },
  ],
  loans: [
    { id: "student-loan", name: "학자금 대출", category: "student", principal: 3_000_000, annualRate: 0.017, remainingMonths: 36, repaymentMethod: "equal-payment" },
  ],
  expenses: [
    { id: "rent", name: "월세", kind: "fixed", categoryId: "fixed.housing", amount: 700_000, frequency: "monthly", paymentDay: 25, startDate: "2026-01-01", autoRenewal: true },
    { id: "utilities", name: "공과금", kind: "fixed", categoryId: "fixed.utilities", amount: 400_000, frequency: "monthly", paymentDay: 20, startDate: "2026-01-01", autoRenewal: true },
    { id: "telecom", name: "통신비", kind: "fixed", categoryId: "fixed.telecom", amount: 100_000, frequency: "monthly", paymentDay: 15, startDate: "2026-01-01", autoRenewal: true },
    { id: "subscription", name: "구독 서비스", kind: "fixed", categoryId: "fixed.subscription", amount: 100_000, frequency: "monthly", paymentDay: 10, startDate: "2026-01-01", autoRenewal: true },
    { id: "food", name: "식비", kind: "living", categoryId: "living.food", amount: 700_000, frequency: "monthly", startDate: "2026-01-01", autoRenewal: false },
    { id: "transport", name: "교통비", kind: "living", categoryId: "living.transport", amount: 200_000, frequency: "monthly", startDate: "2026-01-01", autoRenewal: false },
  ],
  monthlyIncome: 3_200_000,
  monthlyNonLoanExpense: 2_200_000,
};

function formatCurrency(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}${new Intl.NumberFormat("ko-KR").format(Math.abs(Math.round(value)))}원`;
}

function formatShortMoney(value: number) {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  if (absolute >= 100_000_000) return `${sign}${(absolute / 100_000_000).toFixed(1).replace(/\.0$/, "")}억원`;
  return `${sign}${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(absolute / 10_000)}만원`;
}

export function formatExpectedMonth(months: number | null, referenceDate = new Date()) {
  if (months === null) return "계획 조정 필요";
  const expected = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + months, 1));
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", timeZone: "UTC" }).format(expected);
}

export function formatKoreanReferenceDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function Metric({ icon, label, value, warning = false, testId }: { icon: ReactNode; label: string; value: number; warning?: boolean; testId?: string }) {
  return (
    <div className="min-w-0 px-3 py-4 sm:px-5">
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-[var(--wallet-muted)]"><span aria-hidden="true">{icon}</span>{label}</dt>
      <dd className={`mt-2 break-words text-sm font-extrabold tabular-nums [overflow-wrap:anywhere] sm:text-base ${warning ? "text-[var(--wallet-coral)]" : "text-[var(--wallet-ink)]"}`} data-testid={testId}>{formatCurrency(value)}</dd>
    </div>
  );
}

export function DashboardOverview({ referenceDate }: { referenceDate?: Date }) {
  const [input, setInput] = useState(initialFinanceScenario);
  const [hydrated, setHydrated] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const inputRef = useRef(initialFinanceScenario);

  useEffect(() => {
    let hadStoredValue = false;
    let accessFailed = false;
    try {
      hadStoredValue = window.localStorage.getItem(getFinanceScenarioStorageKey(localFinanceScenarioOwner)) !== null;
    } catch {
      accessFailed = true;
    }
    const loaded = loadFinanceScenario(window.localStorage, localFinanceScenarioOwner, initialFinanceScenario);
    inputRef.current = loaded.scenario;
    setInput(loaded.scenario);
    if (accessFailed || (hadStoredValue && loaded.source === "fallback")) {
      setStorageNotice("저장된 계획을 불러오지 못해 기본값을 사용합니다.");
    }
    setHydrated(true);
  }, []);

  const persistInput = (scenarioInput: FinanceScenarioInput) => {
    try {
      saveFinanceScenario(window.localStorage, localFinanceScenarioOwner, scenarioInput);
      setStorageNotice(null);
    } catch {
      setStorageNotice("변경 내용은 유지되지만 이 기기에 저장하지 못했습니다.");
    }
  };
  const updateInput = (updater: (current: FinanceScenarioInput) => FinanceScenarioInput) => {
    const next = updater(inputRef.current);
    inputRef.current = next;
    setInput(next);
    persistInput(next);
  };
  const replaceInput = (scenarioInput: FinanceScenarioInput) => {
    inputRef.current = scenarioInput;
    setInput(scenarioInput);
    persistInput(scenarioInput);
  };
  const calculationReferenceDate = useMemo(
    () => formatKoreanReferenceDate(referenceDate ?? new Date()),
    [referenceDate],
  );
  const scenario = useMemo(() => calculateFinanceScenario(input, { referenceDate: calculationReferenceDate }), [calculationReferenceDate, input]);
  const projection = useMemo(() => createFinanceProjectionSeries(input, { referenceDate: calculationReferenceDate }), [calculationReferenceDate, input]);
  const monthsToGoal = useMemo(() => calculateScenarioMonthsToGoal(input, goalAmount, 1_200, calculationReferenceDate), [calculationReferenceDate, input]);
  const progressPercent = Math.max(0, Math.min(100, Math.round((scenario.netWorth / goalAmount) * 100)));
  const remainingAmount = goalAmount - scenario.netWorth;

  return (
    <section aria-labelledby="dashboard-overview-title" className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-sm font-semibold text-[var(--wallet-muted)]">김기은님의 머니 플랜</p><h1 id="dashboard-overview-title" className="mt-1 break-keep text-xl font-black text-[var(--wallet-ink)] sm:text-2xl">1억을 향한 자산 지도</h1></div>
        <span className="shrink-0 rounded-2xl bg-[var(--wallet-mint-soft)] px-3 py-2 text-xs font-bold text-[#247a65]">실시간 시나리오</span>
      </header>

      {storageNotice && <p role="status" className="mb-4 rounded-2xl bg-[var(--wallet-coral-soft)] px-4 py-3 text-sm font-semibold text-[#9a4f58]">{storageNotice}</p>}

      <div className="grid gap-5">
        <section aria-label="자산 요약" className="overflow-hidden rounded-[24px] border border-[#d8cff8] bg-[#7560c9] text-white shadow-[var(--wallet-shadow)]">
          <div className="p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[#eee9ff]">현재 순자산</p><span className="grid size-10 place-items-center rounded-2xl bg-white/15"><Target aria-hidden="true" className="text-[#b9f0df]" size={22} /></span></div>
            <p aria-live="polite" className={`mt-2 break-words text-[2.1rem] font-black leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-5xl ${scenario.netWorth < 0 ? "text-[#ffd1d4]" : "text-white"}`} data-testid="overview-net-worth">{formatCurrency(scenario.netWorth)}</p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label="1억 목표 달성률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><div className="h-full rounded-full bg-[#49bfa0] transition-[width]" style={{ width: `${progressPercent}%` }} /></div>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold text-[#eee9ff]">남은 목표 <strong className="ml-1 text-white">{formatShortMoney(remainingAmount)}</strong></span><span className="font-semibold text-[#eee9ff]">예상 <strong className="ml-1 text-[#b9f0df]" data-testid="overview-goal-months">{formatExpectedMonth(monthsToGoal, referenceDate)}</strong></span></div>
          </div>
          <dl className="grid grid-cols-2 border-t border-[var(--wallet-line)] bg-[var(--wallet-surface)] sm:grid-cols-4 sm:divide-x sm:divide-[var(--wallet-line)]">
            <Metric icon={<ArrowDownToLine size={16} />} label="월 수입" value={scenario.monthlyIncome} />
            <Metric icon={<ArrowUpFromLine size={16} />} label="생활 지출" value={scenario.monthlyNonLoanExpense} testId="overview-monthly-expense" />
            <Metric icon={<Landmark size={16} />} label="대출 납입" value={scenario.totalLoanPayment} />
            <div aria-live="polite"><Metric icon={<WalletCards size={16} />} label="상환 후 여유" value={scenario.rawMonthlySurplus} warning={scenario.rawMonthlySurplus < 0} testId="overview-monthly-surplus" /></div>
          </dl>
        </section>

        <section aria-labelledby="cash-flow-editor-title" className="scroll-mt-20 rounded-[22px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] p-4 shadow-[var(--wallet-shadow)] sm:p-5" id="planner-cash-flow">
          <div className="mb-4"><h2 id="cash-flow-editor-title" className="text-lg font-black text-[var(--wallet-ink)]">월 현금흐름</h2></div>
          {hydrated ? (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(14rem,0.7fr)]">
              <MoneyInput id="monthly-income" label="월 수입" value={input.monthlyIncome} onChange={(monthlyIncome) => updateInput((current) => ({ ...current, monthlyIncome }))} />
              <div className="flex min-h-28 flex-col justify-center border-t border-[var(--wallet-line)] py-4 sm:border-l sm:border-t-0 sm:pl-5">
                <p className="text-sm font-bold text-[var(--wallet-muted)]">항목별 월 지출</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-[var(--wallet-ink)]">{formatCurrency(scenario.monthlyNonLoanExpense)}</p>
                <a className="mt-2 w-fit text-sm font-bold text-[var(--wallet-primary-strong)] underline-offset-4 hover:underline" href="#expense-management">세부 내역 관리</a>
              </div>
            </div>
          ) : (
            <div aria-busy="true" className="min-h-36 border-t border-[var(--wallet-line)] pt-5 text-sm font-semibold text-[var(--wallet-muted)]" role="status">계획 불러오는 중</div>
          )}
        </section>

        <div className="scroll-mt-20" id="expense-management">
          {hydrated ? <ExpenseManagementEditor value={input.expenses} onChange={(expenses) => updateInput((current) => ({ ...current, expenses }))} /> : null}
        </div>

        <div className="scroll-mt-20" id="finance-accounts">
          {hydrated ? (
            <FinanceScenarioEditor value={input} onChange={replaceInput} />
          ) : (
            <section aria-busy="true" aria-label="금융 계정 불러오는 중" className="min-h-44 rounded-[22px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] p-5 text-sm font-semibold text-[var(--wallet-muted)] shadow-[var(--wallet-shadow)]">계획 불러오는 중</section>
          )}
        </div>
        <div className="scroll-mt-20" id="finance-loans">
          <FinanceVisualizations assets={input.assets} loans={input.loans} scenario={scenario} projection={projection} />
        </div>

        <details className="rounded-[22px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)]">
          <summary className="scroll-mt-20 cursor-pointer list-none px-5 py-4 text-sm font-extrabold text-slate-800" id="finance-calculators">계산 기준과 세금 안내</summary>
          <div className="grid gap-3 border-t border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600 sm:grid-cols-2">
            <p><strong className="block text-slate-900">수익률</strong>각 계좌에 입력한 연 수익률을 계좌별로 적용하며, 월 적자가 생기면 보유 자산을 먼저 소진합니다.</p>
            <p><strong className="block text-slate-900">세금·환급</strong>현재 전망은 세전 단순 추정입니다. 세액공제와 연말정산 환급은 실제 납부세액과 홈택스 자료를 기준으로 별도 확인해야 합니다.</p>
          </div>
        </details>

        <section className="rounded-[22px] bg-[var(--wallet-mint-soft)] p-4 text-sm font-medium leading-6 text-[#205f52]" aria-label="계산 안내">계좌 잔액과 대출 원금은 각각 합산하며, 순자산은 자산보다 부채가 많으면 음수로 표시합니다. 전망에는 대출 원금과 이자, 상환 방식, 월 적자까지 반영됩니다.</section>
      </div>
    </section>
  );
}
