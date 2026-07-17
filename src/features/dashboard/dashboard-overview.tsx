"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Landmark, Target, WalletCards } from "lucide-react";
import { FinanceScenarioEditor } from "./finance-scenario-editor";
import {
  calculateFinanceScenario,
  calculateScenarioMonthsToGoal,
  createFinanceProjectionSeries,
  type FinanceScenarioInput,
} from "./finance-scenario-model";
import { FinanceVisualizations } from "./finance-visualizations";

const goalAmount = 100_000_000;

export const initialFinanceScenario: FinanceScenarioInput = {
  assets: [
    { id: "parking", name: "생활비 파킹통장", category: "parking", balance: 4_000_000, annualRate: 0.025 },
    { id: "savings", name: "청년 적금", category: "savings", balance: 6_000_000, annualRate: 0.045, monthlyContribution: 700_000 },
  ],
  loans: [
    { id: "student-loan", name: "학자금 대출", category: "student", principal: 3_000_000, annualRate: 0.017, remainingMonths: 36, repaymentMethod: "equal-payment" },
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

function Metric({ icon, label, value, warning = false, testId }: { icon: ReactNode; label: string; value: number; warning?: boolean; testId?: string }) {
  return (
    <div className="min-w-0 px-3 py-4 sm:px-5">
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><span aria-hidden="true">{icon}</span>{label}</dt>
      <dd className={`mt-2 break-words text-sm font-extrabold tabular-nums [overflow-wrap:anywhere] sm:text-base ${warning ? "text-amber-700" : "text-slate-900"}`} data-testid={testId}>{formatCurrency(value)}</dd>
    </div>
  );
}

function CashFlowInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <label className="text-sm font-bold text-slate-700" htmlFor={`cash-${label}`}>{label}</label>
      <div className="mt-2 flex h-12 items-center rounded-xl border border-slate-200 bg-white px-3 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
        <input id={`cash-${label}`} aria-label={label} className="min-w-0 flex-1 bg-transparent text-right text-base font-extrabold tabular-nums outline-none" inputMode="numeric" value={new Intl.NumberFormat("ko-KR").format(value / 10_000)} onChange={(event) => onChange(Math.max(0, Number(event.target.value.replace(/\D/g, "")) || 0) * 10_000)} />
        <span className="ml-1 text-sm font-semibold text-slate-500">만원</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2" aria-label={`${label} 빠른 입력`} role="group">
        {[10, 50, 100].map((amount) => <button key={amount} type="button" className="min-h-11 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700" onClick={() => onChange(value + amount * 10_000)}>+{amount}만</button>)}
      </div>
    </div>
  );
}

export function DashboardOverview({ referenceDate }: { referenceDate?: Date }) {
  const [input, setInput] = useState(initialFinanceScenario);
  const scenario = useMemo(() => calculateFinanceScenario(input), [input]);
  const projection = useMemo(() => createFinanceProjectionSeries(input), [input]);
  const monthsToGoal = useMemo(() => calculateScenarioMonthsToGoal(input, goalAmount), [input]);
  const progressPercent = Math.max(0, Math.min(100, Math.round((scenario.netWorth / goalAmount) * 100)));
  const remainingAmount = goalAmount - scenario.netWorth;

  return (
    <section aria-labelledby="dashboard-overview-title" className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-sm font-semibold text-slate-500">김기은님의 머니 플랜</p><h1 id="dashboard-overview-title" className="mt-1 break-keep text-xl font-black text-slate-950 sm:text-2xl">1억을 향한 자산 지도</h1></div>
        <span className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">실시간 시나리오</span>
      </header>

      <div className="grid gap-5">
        <section aria-label="자산 요약" className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-300">현재 순자산</p><Target aria-hidden="true" className="text-emerald-300" size={22} /></div>
            <p aria-live="polite" className={`mt-2 break-words text-[2.1rem] font-black leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-5xl ${scenario.netWorth < 0 ? "text-amber-300" : "text-white"}`} data-testid="overview-net-worth">{formatCurrency(scenario.netWorth)}</p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-700" role="progressbar" aria-label="1억 목표 달성률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><div className="h-full rounded-full bg-emerald-400 transition-[width]" style={{ width: `${progressPercent}%` }} /></div>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold text-slate-300">남은 목표 <strong className="ml-1 text-white">{formatShortMoney(remainingAmount)}</strong></span><span className="font-semibold text-slate-300">예상 <strong className="ml-1 text-emerald-300" data-testid="overview-goal-months">{formatExpectedMonth(monthsToGoal, referenceDate)}</strong></span></div>
          </div>
          <dl className="grid grid-cols-2 border-t border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-slate-200">
            <Metric icon={<ArrowDownToLine size={16} />} label="월 수입" value={scenario.monthlyIncome} />
            <Metric icon={<ArrowUpFromLine size={16} />} label="생활 지출" value={scenario.monthlyNonLoanExpense} />
            <Metric icon={<Landmark size={16} />} label="대출 납입" value={scenario.totalLoanPayment} />
            <div aria-live="polite"><Metric icon={<WalletCards size={16} />} label="상환 후 여유" value={scenario.rawMonthlySurplus} warning={scenario.rawMonthlySurplus < 0} testId="overview-monthly-surplus" /></div>
          </dl>
        </section>

        <section aria-labelledby="cash-flow-editor-title" className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(31,41,55,0.06)] sm:p-5" id="planner-cash-flow">
          <div className="mb-4"><h2 id="cash-flow-editor-title" className="text-lg font-black text-slate-950">월 현금흐름</h2><p className="mt-1 text-sm text-slate-500">만원 단위로 입력하고 빠른 금액은 누를 때마다 합산돼요</p></div>
          <div className="grid gap-3 sm:grid-cols-2"><CashFlowInput label="월 수입" value={input.monthlyIncome} onChange={(monthlyIncome) => setInput((current) => ({ ...current, monthlyIncome }))} /><CashFlowInput label="월 생활 지출" value={input.monthlyNonLoanExpense} onChange={(monthlyNonLoanExpense) => setInput((current) => ({ ...current, monthlyNonLoanExpense }))} /></div>
        </section>

        <FinanceScenarioEditor value={input} onChange={setInput} />
        <FinanceVisualizations assets={input.assets} loans={input.loans} scenario={scenario} projection={projection} />

        <details className="rounded-2xl border border-slate-200 bg-white">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-extrabold text-slate-800">계산 기준과 세금 안내</summary>
          <div className="grid gap-3 border-t border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600 sm:grid-cols-2">
            <p><strong className="block text-slate-900">수익률</strong>각 계좌에 입력한 연 수익률을 계좌별로 적용하며, 월 적자가 생기면 보유 자산을 먼저 소진합니다.</p>
            <p><strong className="block text-slate-900">세금·환급</strong>현재 전망은 세전 단순 추정입니다. 세액공제와 연말정산 환급은 실제 납부세액과 홈택스 자료를 기준으로 별도 확인해야 합니다.</p>
          </div>
        </details>

        <section className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium leading-6 text-emerald-950" aria-label="계산 안내">계좌 잔액과 대출 원금은 각각 합산하며, 순자산은 자산보다 부채가 많으면 음수로 표시합니다. 전망에는 대출 원금과 이자, 상환 방식, 월 적자까지 반영됩니다.</section>
      </div>
    </section>
  );
}
