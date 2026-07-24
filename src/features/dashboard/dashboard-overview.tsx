"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, Building2, Calculator, ChartNoAxesCombined, CreditCard, Landmark, ListChecks, PiggyBank, RotateCcw, Save, ShieldCheck, Sparkles, Target, WalletCards } from "lucide-react";
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
import { FinancialProductGuide } from "./financial-product-guide";
import { NetSalaryCalculator } from "./net-salary-calculator";
import { YearEndTaxCalculator } from "./year-end-tax-calculator";
import {
  getFinanceScenarioStorageKey,
  loadFinanceScenario,
  saveFinanceScenario,
} from "./finance-scenario-storage";

const goalAmount = 100_000_000;
export const localFinanceScenarioOwner = "local-demo-profile";
type DashboardCategory = "overview" | "input" | "calculators" | "products" | "insights";
type MoneyWorkspace = "cash-flow" | "expenses" | "assets" | "loans";
type SaveStatus = "saved" | "dirty" | "failed";

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

type StarterAction = {
  label: string;
  detail: string;
  href: string;
  tone: "mint" | "lilac" | "coral" | "blue";
  icon: ReactNode;
};

function buildStarterActions(scenario: ReturnType<typeof calculateFinanceScenario>) {
  const monthlyNeed = scenario.monthlyNonLoanExpense + scenario.totalLoanPayment;
  const surplusRatio = scenario.monthlyIncome > 0 ? scenario.rawMonthlySurplus / scenario.monthlyIncome : 0;
  const expenseRatio = scenario.monthlyIncome > 0 ? scenario.monthlyNonLoanExpense / scenario.monthlyIncome : 0;
  const loanRatio = scenario.monthlyIncome > 0 ? scenario.totalLoanPayment / scenario.monthlyIncome : 0;
  const emergencyMonths = monthlyNeed > 0 ? scenario.totalAssetBalances / monthlyNeed : 0;
  const status = scenario.rawMonthlySurplus < 0
    ? {
        label: "적자 위험",
        headline: `이번 달 ${formatShortMoney(Math.abs(scenario.rawMonthlySurplus))} 부족`,
        detail: "지출 항목부터 줄여야 1억 계획이 무너지지 않습니다.",
        tone: "coral" as const,
      }
    : emergencyMonths < 3
      ? {
          label: "비상금 우선",
          headline: `비상금 ${emergencyMonths.toFixed(1)}개월`,
          detail: "최소 3개월 생활비를 먼저 확보하는 흐름이 안정적입니다.",
          tone: "blue" as const,
        }
      : surplusRatio >= 0.2
        ? {
            label: "저축 가능",
            headline: `월 ${formatShortMoney(scenario.rawMonthlySurplus)} 배분 가능`,
            detail: "여유금을 적금·파킹·대출상환 중 어디에 둘지 정하면 됩니다.",
            tone: "mint" as const,
          }
        : {
            label: "여유금 점검",
            headline: `월 ${formatShortMoney(scenario.rawMonthlySurplus)} 남음`,
            detail: "고정비와 생활비를 나눠 보면 저축 여력이 더 선명해집니다.",
            tone: "lilac" as const,
          };
  const expenseLabel = scenario.rawMonthlySurplus < 0 ? "지출 줄이기" : expenseRatio > 0.55 ? "고정비 점검" : "지출 항목 점검";
  const actions: StarterAction[] = [
    {
      label: "실수령액 확인",
      detail: "소득세·비과세를 맞춰 월수입을 정확하게 저장",
      href: "#finance-calculators",
      tone: "lilac",
      icon: <Calculator size={18} strokeWidth={1.9} />,
    },
    {
      label: expenseLabel,
      detail: expenseRatio > 0.55 ? "월급 대비 지출 비중이 높아 먼저 볼 항목" : "고정비와 생활비를 카테고리별로 정리",
      href: "#expense-management",
      tone: scenario.rawMonthlySurplus < 0 ? "coral" : "mint",
      icon: <ListChecks size={18} strokeWidth={1.9} />,
    },
    {
      label: "비상금 확인",
      detail: `현재 자산 기준 약 ${emergencyMonths.toFixed(1)}개월 버틸 수 있음`,
      href: "#finance-accounts",
      tone: "blue",
      icon: <ShieldCheck size={18} strokeWidth={1.9} />,
    },
    {
      label: loanRatio > 0.12 ? "대출 부담 점검" : "적금·계좌 점검",
      detail: loanRatio > 0.12 ? `월수입의 ${Math.round(loanRatio * 100)}%가 대출 납입` : "여유금이 어느 계좌로 가는지 확인",
      href: loanRatio > 0.12 ? "#finance-loans" : "#finance-accounts",
      tone: "lilac",
      icon: <PiggyBank size={18} strokeWidth={1.9} />,
    },
  ];

  return { status, actions, emergencyMonths, expenseRatio, loanRatio };
}

function StarterChecklist({ scenario }: { scenario: ReturnType<typeof calculateFinanceScenario> }) {
  const starter = buildStarterActions(scenario);
  const statusToneClass = {
    mint: "bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary-strong)]",
    blue: "bg-[#eaf3f5] text-[#356c77]",
    lilac: "bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary-strong)]",
    coral: "bg-[var(--wallet-coral-soft)] text-[var(--wallet-coral)]",
  }[starter.status.tone];
  const actionToneClass = {
    mint: "bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary-strong)]",
    blue: "bg-[#eaf3f5] text-[#356c77]",
    lilac: "bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary-strong)]",
    coral: "bg-[var(--wallet-coral-soft)] text-[var(--wallet-coral)]",
  };

  return (
    <section aria-label="사회초년생 시작 체크" className="rounded-[32px] border border-[#e9edf5] bg-[var(--wallet-surface)] p-5 shadow-[0_18px_42px_rgba(70,82,118,0.08)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold text-[var(--wallet-primary)]">오늘 먼저 볼 것</p>
          <h2 className="mt-1 text-lg font-black text-[var(--wallet-ink)]" id="starter-check-title">이번 달 할 일</h2>
          <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-[var(--wallet-muted)]">{starter.status.headline}. {starter.status.detail}</p>
        </div>
        <span className={`inline-flex h-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${statusToneClass}`}>{starter.status.label}</span>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {starter.actions.map((action) => (
          <a key={action.label} href={action.href} className="group flex min-h-[78px] items-center gap-3 rounded-[22px] border border-transparent bg-[var(--wallet-surface-tint)] px-3 py-3 transition-[background-color,border-color,transform] hover:border-[var(--wallet-primary-soft)] hover:bg-white active:scale-[0.98]">
            <span className={`grid size-11 shrink-0 place-items-center rounded-[18px] ${actionToneClass[action.tone]}`}>{action.icon}</span>
            <span className="min-w-0 flex-1"><strong className="block text-sm font-extrabold text-[var(--wallet-ink)]">{action.label}</strong><span className="mt-1 block text-xs font-medium leading-5 text-[var(--wallet-muted)]">{action.detail}</span></span>
            <ArrowRight aria-hidden="true" className="shrink-0 text-[var(--wallet-muted)] transition-transform group-hover:translate-x-0.5" size={17} />
          </a>
        ))}
      </div>
    </section>
  );
}

function CashFlowMiniBars({ scenario }: { scenario: ReturnType<typeof calculateFinanceScenario> }) {
  const monthlyIncome = Math.max(1, scenario.monthlyIncome);
  const rows = [
    { label: "생활 지출", value: scenario.monthlyNonLoanExpense, color: "var(--wallet-coral)" },
    { label: "대출 납입", value: scenario.totalLoanPayment, color: "var(--wallet-warning)" },
    { label: "남는 돈", value: Math.max(0, scenario.rawMonthlySurplus), color: "var(--wallet-primary)" },
  ];

  return (
    <div className="grid gap-3 rounded-2xl bg-[var(--wallet-surface-tint)] p-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex justify-between gap-3 text-xs font-bold text-[var(--wallet-muted)]">
            <span>{row.label}</span>
            <span className="tabular-nums text-[var(--wallet-ink)]">{formatCurrency(row.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round((row.value / monthlyIncome) * 100))}%`, backgroundColor: row.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthlyFlowOverview({ scenario }: { scenario: ReturnType<typeof calculateFinanceScenario> }) {
  const income = Math.max(1, scenario.monthlyIncome);
  const expensePercent = Math.min(100, Math.max(0, (scenario.monthlyNonLoanExpense / income) * 100));
  const loanPercent = Math.min(100 - expensePercent, Math.max(0, (scenario.totalLoanPayment / income) * 100));
  const surplusPercent = Math.max(0, 100 - expensePercent - loanPercent);
  const expenseEnd = expensePercent;
  const loanEnd = expensePercent + loanPercent;

  return (
    <section aria-labelledby="monthly-flow-title" className="rounded-[32px] border border-[#e9edf5] bg-[var(--wallet-surface)] p-5 shadow-[0_18px_42px_rgba(70,82,118,0.08)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[var(--wallet-primary)]">월급 사용 비율</p>
          <h2 className="mt-1 text-lg font-black text-[var(--wallet-ink)]" id="monthly-flow-title">월급 흐름</h2>
        </div>
        <a className="grid size-10 place-items-center rounded-full bg-[var(--wallet-surface-tint)] text-[var(--wallet-muted)] hover:text-[var(--wallet-primary)]" href="#planner-cash-flow" aria-label="월 현금흐름 입력으로 이동">
          <ArrowRight aria-hidden="true" size={19} />
        </a>
      </div>
      <div className="mt-5 flex items-center gap-6">
        <div
          aria-label="월 수입 사용 비율"
          className="relative grid size-32 shrink-0 place-items-center rounded-full"
          role="img"
          style={{ background: `conic-gradient(var(--wallet-coral) 0 ${expenseEnd}%, var(--wallet-warning) ${expenseEnd}% ${loanEnd}%, var(--wallet-mint) ${loanEnd}% 100%)` }}
        >
          <div className="grid size-[88px] place-items-center rounded-full bg-white text-center shadow-[0_0_0_1px_var(--wallet-line)]">
            <span className="text-[11px] font-bold text-[var(--wallet-muted)]">남는 돈</span>
            <strong className={`block text-sm font-black ${scenario.rawMonthlySurplus < 0 ? "text-[var(--wallet-coral)]" : "text-[var(--wallet-primary-strong)]"}`}>{formatShortMoney(scenario.rawMonthlySurplus)}</strong>
          </div>
        </div>
        <dl className="min-w-0 flex-1 space-y-3 text-sm">
          {[
            { label: "생활 지출", value: expensePercent, color: "bg-[var(--wallet-coral)]" },
            { label: "대출 납입", value: loanPercent, color: "bg-[var(--wallet-warning)]" },
            { label: "저축 가능", value: surplusPercent, color: "bg-[var(--wallet-mint)]" },
          ].map((item) => (
            <div className="flex items-center justify-between gap-3" key={item.label}>
              <dt className="flex min-w-0 items-center gap-2 font-semibold text-[var(--wallet-muted)]"><span className={`size-2.5 rounded-full ${item.color}`} />{item.label}</dt>
              <dd className="font-black text-[var(--wallet-ink)]">{Math.round(item.value)}%</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function FinancialAccountSnapshot({ input }: { input: FinanceScenarioInput }) {
  return (
    <section aria-labelledby="account-snapshot-title" className="rounded-[32px] border border-[#e9edf5] bg-[var(--wallet-surface)] p-5 shadow-[0_18px_42px_rgba(70,82,118,0.08)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[var(--wallet-primary)]">보유 중인 돈</p>
          <h2 className="mt-1 text-lg font-black text-[var(--wallet-ink)]" id="account-snapshot-title">계좌와 대출</h2>
        </div>
        <a className="text-xs font-extrabold text-[var(--wallet-primary)] hover:underline" href="#finance-accounts">전체 관리</a>
      </div>
      <div className="mt-4 divide-y divide-[var(--wallet-line)]">
        {input.assets.map((asset) => (
          <div className="flex min-h-16 items-center gap-3 py-3" key={asset.id}>
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary)]"><CreditCard aria-hidden="true" size={20} /></span>
            <div className="min-w-0 flex-1"><strong className="block truncate text-sm font-extrabold text-[var(--wallet-ink)]">{asset.name}</strong><span className="mt-0.5 block text-xs font-semibold text-[var(--wallet-muted)]">연 {((asset.annualRate ?? 0) * 100).toFixed(1)}%</span></div>
            <span className="shrink-0 text-sm font-black text-[var(--wallet-ink)]">{formatShortMoney(asset.balance)}</span>
          </div>
        ))}
        {input.loans.map((loan) => (
          <div className="flex min-h-16 items-center gap-3 py-3" key={loan.id}>
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--wallet-coral-soft)] text-[var(--wallet-coral)]"><Building2 aria-hidden="true" size={20} /></span>
            <div className="min-w-0 flex-1"><strong className="block truncate text-sm font-extrabold text-[var(--wallet-ink)]">{loan.name}</strong><span className="mt-0.5 block text-xs font-semibold text-[var(--wallet-muted)]">남은 {loan.remainingMonths}개월 · 연 {(loan.annualRate * 100).toFixed(1)}%</span></div>
            <span className="shrink-0 text-sm font-black text-[var(--wallet-coral)]">-{formatShortMoney(loan.principal)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function categoryFromHash(hash: string): DashboardCategory {
  if (["#planner-cash-flow", "#expense-management", "#finance-accounts", "#finance-assets", "#finance-loans-input"].includes(hash)) return "input";
  if (hash === "#finance-calculators") return "calculators";
  if (hash === "#finance-products") return "products";
  if (hash === "#finance-loans") return "insights";
  return "overview";
}

function moneyWorkspaceFromHash(hash: string): MoneyWorkspace {
  if (hash === "#expense-management") return "expenses";
  if (hash === "#finance-accounts" || hash === "#finance-assets") return "assets";
  if (hash === "#finance-loans-input") return "loans";
  return "cash-flow";
}

const moneyWorkspaceItems: Array<{ id: MoneyWorkspace; label: string; detail: string; href: string; icon: ReactNode }> = [
  { id: "cash-flow", label: "현금흐름", detail: "월급과 여유금", href: "#planner-cash-flow", icon: <ArrowDownToLine size={17} strokeWidth={1.9} /> },
  { id: "expenses", label: "지출", detail: "고정비·생활비", href: "#expense-management", icon: <ListChecks size={17} strokeWidth={1.9} /> },
  { id: "assets", label: "자산", detail: "통장·적금", href: "#finance-assets", icon: <Landmark size={17} strokeWidth={1.9} /> },
  { id: "loans", label: "대출", detail: "원금·이자", href: "#finance-loans-input", icon: <Building2 size={17} strokeWidth={1.9} /> },
];

function MoneyWorkspaceNavigator({ activeWorkspace }: { activeWorkspace: MoneyWorkspace }) {
  return (
    <nav aria-label="입력 작업공간" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {moneyWorkspaceItems.map((item) => (
        <a
          aria-current={activeWorkspace === item.id ? "location" : undefined}
          className={`flex min-h-[4.25rem] min-w-0 items-center gap-3 rounded-[20px] border px-3 text-left transition-[background-color,border-color,transform] active:scale-[0.98] ${
            activeWorkspace === item.id
              ? "border-[var(--wallet-primary)] bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary-strong)]"
              : "border-[var(--wallet-line)] bg-[var(--wallet-surface)] text-[var(--wallet-muted)] hover:border-[var(--wallet-primary-soft)] hover:bg-[var(--wallet-surface-tint)]"
          }`}
          href={item.href}
          key={item.id}
        >
          <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${activeWorkspace === item.id ? "bg-white" : "bg-[var(--wallet-surface-tint)]"}`}>{item.icon}</span>
          <span className="min-w-0">
            <span className="block text-sm font-extrabold">{item.label}</span>
            <span className="mt-0.5 block truncate text-[11px] font-semibold">{item.detail}</span>
          </span>
        </a>
      ))}
    </nav>
  );
}

function MoneyWorkspaceHeader({
  activeWorkspace,
  onSave,
  onRetry,
  savedAt,
  saveStatus,
}: {
  activeWorkspace: MoneyWorkspace;
  onSave: () => void;
  onRetry: () => void;
  savedAt: string | null;
  saveStatus: SaveStatus;
}) {
  const item = moneyWorkspaceItems.find((entry) => entry.id === activeWorkspace) ?? moneyWorkspaceItems[0];
  const statusLabel = saveStatus === "failed" ? "저장 실패" : saveStatus === "dirty" ? "저장 필요" : "저장됨";
  const savedTime = savedAt ? new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" }).format(new Date(savedAt)) : null;

  return (
    <div className="sticky top-3 z-10 rounded-[24px] border border-[var(--wallet-line)] bg-white/95 px-4 py-3 shadow-[0_12px_28px_rgba(31,41,55,0.08)] backdrop-blur supports-[not(backdrop-filter:blur(1px))]:bg-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[var(--wallet-primary)]">입력 작업공간</p>
          <h2 className="mt-0.5 text-xl font-extrabold text-[var(--wallet-ink)]">{item.label}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            aria-label="저장 상태"
            className={`inline-flex min-h-10 items-center rounded-full px-3 text-xs font-extrabold ${
              saveStatus === "failed"
                ? "bg-[var(--wallet-coral-soft)] text-[var(--wallet-coral)]"
                : "bg-[var(--wallet-mint-soft)] text-[#14806d]"
            }`}
            data-testid="finance-save-status"
            role="status"
          >
            {statusLabel}{savedTime ? ` · ${savedTime}` : ""}
          </span>
          {saveStatus === "failed" && (
            <button aria-label="저장 재시도" className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-extrabold text-[var(--wallet-coral)] hover:bg-[var(--wallet-coral-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-coral)]" onClick={onRetry} type="button">
              <RotateCcw aria-hidden="true" size={15} />재시도
            </button>
          )}
          <button aria-label="현재 계획 저장" className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[var(--wallet-primary)] px-4 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(79,91,213,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)] focus-visible:ring-offset-2" onClick={onSave} type="button">
            <Save aria-hidden="true" size={15} />저장
          </button>
        </div>
      </div>
    </div>
  );
}

function InputWorkspaceSummary({
  input,
  scenario,
  saveStatus,
}: {
  input: FinanceScenarioInput;
  scenario: ReturnType<typeof calculateFinanceScenario>;
  saveStatus: SaveStatus;
}) {
  const saveLabel = saveStatus === "failed" ? "저장 실패" : saveStatus === "dirty" ? "저장 필요" : "저장됨";
  const summaryItems = [
    {
      label: "월 여유금",
      value: formatShortMoney(scenario.rawMonthlySurplus),
      detail: scenario.rawMonthlySurplus < 0 ? "이번 달 부족" : "상환 후 남는 돈",
      href: "#planner-cash-flow",
      icon: <WalletCards aria-hidden="true" size={18} strokeWidth={1.9} />,
      tone: scenario.rawMonthlySurplus < 0 ? "coral" : "mint",
    },
    {
      label: "총 자산",
      value: formatShortMoney(scenario.totalAssetBalances),
      detail: `${input.assets.length}개 계좌`,
      href: "#finance-assets",
      icon: <Landmark aria-hidden="true" size={18} strokeWidth={1.9} />,
      tone: "blue",
    },
    {
      label: "대출 원금",
      value: formatShortMoney(scenario.totalLoanPrincipals),
      detail: `${input.loans.length}건 관리`,
      href: "#finance-loans-input",
      icon: <Building2 aria-hidden="true" size={18} strokeWidth={1.9} />,
      tone: "coral",
    },
    {
      label: "저장 상태",
      value: saveLabel,
      detail: saveStatus === "failed" ? "재시도 필요" : "이 기기에 보관",
      href: "#planner-cash-flow",
      icon: <ShieldCheck aria-hidden="true" size={18} strokeWidth={1.9} />,
      tone: saveStatus === "failed" ? "coral" : "mint",
    },
  ];
  const toneClass = {
    blue: "bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary-strong)]",
    mint: "bg-[var(--wallet-mint-soft)] text-[#0c7d67]",
    coral: "bg-[var(--wallet-coral-soft)] text-[var(--wallet-coral)]",
  };

  return (
    <section aria-label="입력 요약" className="grid gap-2 rounded-[26px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] p-2 shadow-[var(--wallet-shadow)] sm:grid-cols-2 xl:grid-cols-4">
      {summaryItems.map((item) => (
        <a
          aria-label={`${item.label} ${item.value} ${item.detail}`}
          className="group flex min-h-[5.5rem] min-w-0 items-center gap-3 rounded-[22px] bg-[var(--wallet-surface-tint)] px-3 py-3 transition-[background-color,transform] hover:bg-white active:scale-[0.98]"
          href={item.href}
          key={item.label}
        >
          <span className={`grid size-11 shrink-0 place-items-center rounded-[18px] ${toneClass[item.tone as keyof typeof toneClass]}`}>{item.icon}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-extrabold text-[var(--wallet-muted)]">{item.label}</span>
            <strong className={`mt-1 block truncate text-base font-black tabular-nums ${item.tone === "coral" && item.label !== "대출 원금" ? "text-[var(--wallet-coral)]" : "text-[var(--wallet-ink)]"}`}>{item.value}</strong>
            <span className="mt-0.5 block truncate text-[11px] font-bold text-[var(--wallet-muted)]">{item.detail}</span>
          </span>
          <ArrowRight aria-hidden="true" className="shrink-0 text-[var(--wallet-muted)] transition-transform group-hover:translate-x-0.5" size={16} />
        </a>
      ))}
    </section>
  );
}

function CategoryNavigator({ activeCategory }: { activeCategory: DashboardCategory }) {
  const items = [
    { category: "overview", label: "요약", detail: "현재 상태", href: "#dashboard-overview-title", icon: <Target size={17} strokeWidth={1.9} /> },
    { category: "input", label: "입력", detail: "월급·지출·계좌", href: "#planner-cash-flow", icon: <WalletCards size={17} strokeWidth={1.9} /> },
    { category: "calculators", label: "계산", detail: "세금·연말정산", href: "#finance-calculators", icon: <Calculator size={17} strokeWidth={1.9} /> },
    { category: "products", label: "상품", detail: "청년혜택", href: "#finance-products", icon: <Sparkles size={17} strokeWidth={1.9} /> },
    { category: "insights", label: "그래프", detail: "자산·대출", href: "#finance-loans", icon: <ChartNoAxesCombined size={17} strokeWidth={1.9} /> },
  ];

  return (
    <nav aria-label="대시보드 카테고리" className="sticky top-24 hidden self-start rounded-[28px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] p-3 shadow-[var(--wallet-shadow)] md:block">
      <p className="px-3 pb-2 pt-1 text-[11px] font-black text-[var(--wallet-muted)]">돈 관리 메뉴</p>
      <div className="grid gap-1.5">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            aria-current={activeCategory === item.category ? "location" : undefined}
            className={`flex min-h-[58px] min-w-0 items-center gap-3 rounded-[18px] px-3 text-sm font-extrabold transition-[background-color,color,transform] active:scale-[0.98] ${
              activeCategory === item.category
                ? "bg-[var(--wallet-primary)] text-white shadow-[0_8px_18px_rgba(79,91,213,0.2)]"
                : "text-[var(--wallet-muted)] hover:bg-[var(--wallet-surface-tint)] hover:text-[var(--wallet-ink)]"
            }`}
          >
            <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-xl ${activeCategory === item.category ? "bg-white/16" : "bg-[var(--wallet-surface-tint)]"}`}>{item.icon}</span>
            <span className="min-w-0">
              <span className="block">{item.label}</span>
              <span className={`block truncate text-[11px] font-medium ${activeCategory === item.category ? "text-white/70" : "text-[var(--wallet-muted)]"}`}>{item.detail}</span>
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}

export function DashboardOverview({ referenceDate }: { referenceDate?: Date }) {
  const [input, setInput] = useState(initialFinanceScenario);
  const [hydrated, setHydrated] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<DashboardCategory>("overview");
  const [activeHash, setActiveHash] = useState("");
  const [activeMoneyWorkspace, setActiveMoneyWorkspace] = useState<MoneyWorkspace>("cash-flow");
  const [activeCalculator, setActiveCalculator] = useState<"salary" | "year-end">("salary");
  const inputRef = useRef(initialFinanceScenario);
  const calculatorTabRefs = useRef<{ salary: HTMLButtonElement | null; "year-end": HTMLButtonElement | null }>({ salary: null, "year-end": null });

  const activateCalculatorTab = (next: "salary" | "year-end") => {
    setActiveCalculator(next);
    window.requestAnimationFrame(() => calculatorTabRefs.current[next]?.focus());
  };

  const handleCalculatorTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: "salary" | "year-end") => {
    let next: "salary" | "year-end" | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = current === "salary" ? "year-end" : "salary";
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = current === "salary" ? "year-end" : "salary";
    if (event.key === "Home") next = "salary";
    if (event.key === "End") next = "year-end";
    if (!next) return;
    event.preventDefault();
    activateCalculatorTab(next);
  };

  useEffect(() => {
    const syncCategory = () => {
      setActiveCategory(categoryFromHash(window.location.hash));
      setActiveHash(window.location.hash);
      setActiveMoneyWorkspace(moneyWorkspaceFromHash(window.location.hash));
    };

    syncCategory();
    window.addEventListener("hashchange", syncCategory);
    return () => window.removeEventListener("hashchange", syncCategory);
  }, []);

  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    if (!targetId) return;

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!target) return;

      target.scrollIntoView?.({ block: "start" });
      const focusTarget = target.matches("h1, h2, h3")
        ? target
        : target.querySelector("h1, h2, h3");
      if (focusTarget instanceof HTMLElement) {
        focusTarget.tabIndex = -1;
        focusTarget.classList.add("dashboard-focus-target");
        focusTarget.focus({ preventScroll: true });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeCategory, activeHash]);

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
    setSavedAt(loaded.savedAt ?? null);
    if (accessFailed || (hadStoredValue && loaded.source === "fallback")) {
      setStorageNotice("저장된 계획을 불러오지 못해 기본값을 사용합니다.");
    }
    setHydrated(true);
  }, []);

  const persistInput = (scenarioInput: FinanceScenarioInput, nextSavedAt?: string) => {
    try {
      saveFinanceScenario(window.localStorage, localFinanceScenarioOwner, scenarioInput, nextSavedAt ? { savedAt: nextSavedAt } : {});
      setStorageNotice(null);
      setSaveStatus("saved");
      if (nextSavedAt) setSavedAt(nextSavedAt);
    } catch {
      setStorageNotice("변경 내용은 유지되지만 이 기기에 저장하지 못했습니다.");
      setSaveStatus("failed");
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
  const saveCurrentInput = () => {
    const nextSavedAt = new Date().toISOString();
    persistInput(inputRef.current, nextSavedAt);
  };
  const retryPersistInput = () => {
    persistInput(inputRef.current, savedAt ?? undefined);
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
  const isNetWorthNegative = scenario.netWorth < 0;

  return (
    <section aria-labelledby="dashboard-overview-title" className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 flex items-end justify-between gap-3 md:pl-[14.5rem]">
        <div className="min-w-0"><p className="text-sm font-semibold text-[var(--wallet-muted)]">안녕하세요, 김기은님</p><h1 id="dashboard-overview-title" className="mt-1 break-keep text-2xl font-black text-[var(--wallet-ink)] sm:text-[1.75rem]">1억을 향한 자산 지도</h1></div>
        <span className="shrink-0 rounded-full bg-[var(--wallet-mint-soft)] px-3 py-2 text-xs font-extrabold text-[#14806d]">오늘 기준</span>
      </header>

      {storageNotice && <p role="status" className="mb-4 rounded-2xl bg-[var(--wallet-coral-soft)] px-4 py-3 text-sm font-semibold text-[#9a4f58]">{storageNotice}</p>}

      <div className="grid gap-5 md:grid-cols-[13rem_minmax(0,1fr)] md:items-start">
        <CategoryNavigator activeCategory={activeCategory} />
        <div className="grid min-w-0 gap-5">

        {activeCategory === "overview" && (
          <>
            <section aria-label="자산 요약" className="overflow-hidden rounded-[34px] border border-[#dde9f0] bg-[var(--wallet-surface)] text-[var(--wallet-ink)] shadow-[0_24px_58px_rgba(57,73,109,0.12)]">
              <div className="bg-[linear-gradient(145deg,#f3f7ff_0%,#effcf8_48%,#fff7f0_100%)] p-5 sm:p-7">
                <div className="flex items-center justify-between gap-3"><p className="text-sm font-extrabold text-[var(--wallet-primary-strong)]">나의 순자산</p><span className="grid size-11 place-items-center rounded-[18px] bg-[var(--wallet-primary)] text-white shadow-[0_8px_18px_rgba(79,91,213,0.2)]"><Target aria-hidden="true" size={21} /></span></div>
                <p aria-live="polite" className={`mt-3 break-words text-[2.25rem] font-black leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-5xl ${scenario.netWorth < 0 ? "text-[var(--wallet-coral)]" : "text-[var(--wallet-ink)]"}`} data-testid="overview-net-worth">{formatCurrency(scenario.netWorth)}</p>
                <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/80" role="progressbar" aria-label={isNetWorthNegative ? "부채 초과 상태" : "1억 목표 달성률"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><div className="h-full rounded-full bg-[var(--wallet-primary)] transition-[width] motion-reduce:transition-none" style={{ width: `${isNetWorthNegative ? 0 : progressPercent}%` }} /></div>
                <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold text-[var(--wallet-muted)]">{isNetWorthNegative ? "부채 초과" : "목표까지"} <strong className="ml-1 font-black text-[var(--wallet-ink)]">{isNetWorthNegative ? formatShortMoney(Math.abs(scenario.netWorth)) : formatShortMoney(remainingAmount)}</strong></span><span className="font-semibold text-[var(--wallet-muted)]">예상 <strong className="ml-1 font-black text-[var(--wallet-primary-strong)]" data-testid="overview-goal-months">{formatExpectedMonth(monthsToGoal, referenceDate)}</strong></span></div>
                <div className="mt-5 flex gap-2">
                  <a className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--wallet-primary)] px-4 text-sm font-black text-white shadow-[0_8px_18px_rgba(79,91,213,0.2)]" href="#finance-accounts">자산 입력</a>
                  <a className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 text-sm font-black text-[var(--wallet-primary-strong)]" href="#finance-loans">전망 보기</a>
                </div>
              </div>
              <dl className="grid grid-cols-2 bg-white sm:grid-cols-4 sm:divide-x sm:divide-[var(--wallet-line)]">
                <Metric icon={<ArrowDownToLine size={16} />} label="월 수입" value={scenario.monthlyIncome} />
                <Metric icon={<ArrowUpFromLine size={16} />} label="생활 지출" value={scenario.monthlyNonLoanExpense} testId="overview-monthly-expense" />
                <Metric icon={<Landmark size={16} />} label="대출 납입" value={scenario.totalLoanPayment} />
                <div aria-live="polite"><Metric icon={<WalletCards size={16} />} label="상환 후 여유" value={scenario.rawMonthlySurplus} warning={scenario.rawMonthlySurplus < 0} testId="overview-monthly-surplus" /></div>
              </dl>
            </section>

            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <MonthlyFlowOverview scenario={scenario} />
              <FinancialAccountSnapshot input={input} />
            </div>

            <StarterChecklist scenario={scenario} />

            <section className="flex items-start gap-3 rounded-[22px] bg-[var(--wallet-mint-soft)] p-4 text-sm font-semibold leading-6 text-[#246f62]" aria-label="계산 안내"><ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0" size={19} />계좌 잔액과 대출 원금은 각각 합산하며, 순자산은 자산보다 부채가 많으면 음수로 표시합니다. 전망에는 대출 원금과 이자, 상환 방식, 월 적자까지 반영됩니다.</section>
          </>
        )}

        {activeCategory === "input" && (
          <div className="grid gap-4">
            <MoneyWorkspaceNavigator activeWorkspace={activeMoneyWorkspace} />
            <MoneyWorkspaceHeader activeWorkspace={activeMoneyWorkspace} onRetry={retryPersistInput} onSave={saveCurrentInput} savedAt={savedAt} saveStatus={saveStatus} />
            {hydrated ? <InputWorkspaceSummary input={input} scenario={scenario} saveStatus={saveStatus} /> : null}

            {activeMoneyWorkspace === "cash-flow" && (
              <section aria-labelledby="cash-flow-editor-title" className="scroll-mt-36 rounded-[22px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] p-4 shadow-[var(--wallet-shadow)] sm:p-5" id="planner-cash-flow">
                <div className="mb-4"><h2 id="cash-flow-editor-title" className="text-lg font-extrabold text-[var(--wallet-ink)]">월 현금흐름</h2></div>
                {hydrated ? (
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(14rem,0.7fr)]">
                    <MoneyInput id="monthly-income" label="월 수입" value={input.monthlyIncome} onChange={(monthlyIncome) => updateInput((current) => ({ ...current, monthlyIncome }))} quickAmountMode="adjust" quickAmountsManwon={[10, 50, 100]} />
                    <div className="flex min-h-28 flex-col justify-center border-t border-[var(--wallet-line)] py-4 sm:border-l sm:border-t-0 sm:pl-5">
                      <p className="text-sm font-bold text-[var(--wallet-muted)]">항목별 월 지출</p>
                      <p className="mt-2 text-2xl font-extrabold tabular-nums text-[var(--wallet-ink)]">{formatCurrency(scenario.monthlyNonLoanExpense)}</p>
                      <a className="mt-2 w-fit text-sm font-bold text-[var(--wallet-primary-strong)] underline-offset-4 hover:underline" href="#expense-management">세부 내역 관리</a>
                      <div className="mt-4"><CashFlowMiniBars scenario={scenario} /></div>
                    </div>
                  </div>
                ) : (
                  <div aria-busy="true" className="min-h-36 border-t border-[var(--wallet-line)] pt-5 text-sm font-semibold text-[var(--wallet-muted)]" role="status">계획 불러오는 중</div>
                )}
              </section>
            )}

            {activeMoneyWorkspace === "expenses" && (
              <div className="scroll-mt-36" id="expense-management">
                {hydrated ? <ExpenseManagementEditor value={input.expenses} onChange={(expenses) => updateInput((current) => ({ ...current, expenses }))} /> : null}
              </div>
            )}

            {activeMoneyWorkspace === "assets" && (
              <section aria-labelledby="finance-assets-title" className="scroll-mt-36" id="finance-assets">
                <h2 className="sr-only" id="finance-assets-title">자산 계좌</h2>
                {hydrated ? (
                  <FinanceScenarioEditor mode="assets" value={input} onChange={replaceInput} />
                ) : (
                  <section aria-busy="true" aria-label="자산 계좌 불러오는 중" className="min-h-44 rounded-[22px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] p-5 text-sm font-semibold text-[var(--wallet-muted)] shadow-[var(--wallet-shadow)]">계획 불러오는 중</section>
                )}
              </section>
            )}

            {activeMoneyWorkspace === "loans" && (
              <section aria-labelledby="finance-loans-input-title" className="scroll-mt-36" id="finance-loans-input">
                <h2 className="sr-only" id="finance-loans-input-title">대출 관리</h2>
                {hydrated ? (
                  <FinanceScenarioEditor mode="loans" value={input} onChange={replaceInput} />
                ) : (
                  <section aria-busy="true" aria-label="대출 관리 불러오는 중" className="min-h-44 rounded-[22px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] p-5 text-sm font-semibold text-[var(--wallet-muted)] shadow-[var(--wallet-shadow)]">계획 불러오는 중</section>
                )}
              </section>
            )}
          </div>
        )}

        {activeCategory === "calculators" && (
          <div className="scroll-mt-36" id="finance-calculators">
            {hydrated ? (
              <div className="grid gap-4">
                <div aria-label="계산기 선택" className="grid grid-cols-2 gap-1 rounded-[18px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] p-1.5 shadow-[var(--wallet-shadow)]" role="tablist">
                  <button aria-controls="salary-calculator-panel" aria-selected={activeCalculator === "salary"} className={`min-h-12 rounded-[14px] px-3 text-sm font-extrabold transition-colors ${activeCalculator === "salary" ? "bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary-strong)]" : "text-[var(--wallet-muted)] hover:bg-[var(--wallet-surface-tint)]"}`} id="salary-calculator-tab" onClick={() => setActiveCalculator("salary")} onKeyDown={(event) => handleCalculatorTabKeyDown(event, "salary")} ref={(node) => { calculatorTabRefs.current.salary = node; }} role="tab" tabIndex={activeCalculator === "salary" ? 0 : -1} type="button">실수령액</button>
                  <button aria-controls="year-end-calculator-panel" aria-selected={activeCalculator === "year-end"} className={`min-h-12 rounded-[14px] px-3 text-sm font-extrabold transition-colors ${activeCalculator === "year-end" ? "bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary-strong)]" : "text-[var(--wallet-muted)] hover:bg-[var(--wallet-surface-tint)]"}`} id="year-end-calculator-tab" onClick={() => setActiveCalculator("year-end")} onKeyDown={(event) => handleCalculatorTabKeyDown(event, "year-end")} ref={(node) => { calculatorTabRefs.current["year-end"] = node; }} role="tab" tabIndex={activeCalculator === "year-end" ? 0 : -1} type="button">연말정산</button>
                </div>
                <div aria-labelledby="salary-calculator-tab" hidden={activeCalculator !== "salary"} id="salary-calculator-panel" role="tabpanel"><NetSalaryCalculator currentMonthlyIncome={input.monthlyIncome} onApply={(monthlyIncome) => updateInput((current) => ({ ...current, monthlyIncome }))} /></div>
                <div aria-labelledby="year-end-calculator-tab" hidden={activeCalculator !== "year-end"} id="year-end-calculator-panel" role="tabpanel"><YearEndTaxCalculator currentMonthlySurplus={scenario.rawMonthlySurplus} /></div>
              </div>
            ) : null}
          </div>
        )}

        {activeCategory === "products" && <FinancialProductGuide />}

        {activeCategory === "insights" && (
          <>
            <div className="scroll-mt-36" id="finance-loans">
              <FinanceVisualizations assets={input.assets} loans={input.loans} scenario={scenario} projection={projection} />
            </div>

            <details className="rounded-[22px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)]">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-extrabold text-slate-800">계산 기준과 세금 안내</summary>
              <div className="grid gap-3 border-t border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600 sm:grid-cols-2">
                <p><strong className="block text-slate-900">수익률</strong>각 계좌에 입력한 연 수익률을 계좌별로 적용하며, 월 적자가 생기면 보유 자산을 먼저 소진합니다.</p>
                <p><strong className="block text-slate-900">세금·환급</strong>현재 전망은 세전 단순 추정입니다. 세액공제와 연말정산 환급은 실제 납부세액과 홈택스 자료를 기준으로 별도 확인해야 합니다.</p>
              </div>
            </details>
          </>
        )}
        </div>
      </div>
    </section>
  );
}
