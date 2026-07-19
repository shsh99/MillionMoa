"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Calculator, ChartNoAxesCombined, Landmark, ListChecks, PiggyBank, ShieldCheck, Sparkles, Target, WalletCards } from "lucide-react";
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
    <section aria-label="사회초년생 시작 체크" className="rounded-[24px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] p-5 shadow-[var(--wallet-shadow)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusToneClass}`}>{starter.status.label}</p>
          <h2 className="mt-3 text-lg font-extrabold text-[var(--wallet-ink)]" id="starter-check-title">이번 달 시작 체크</h2>
          <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-[var(--wallet-muted)]">{starter.status.headline}. {starter.status.detail}</p>
        </div>
        <dl className="grid shrink-0 grid-cols-2 gap-2 text-xs font-bold text-[var(--wallet-muted)] sm:w-56">
          <div className="rounded-2xl bg-[var(--wallet-surface-tint)] px-3 py-2.5"><dt>지출 비중</dt><dd className="mt-1 text-sm font-extrabold text-[var(--wallet-ink)]">{Math.round(starter.expenseRatio * 100)}%</dd></div>
          <div className="rounded-2xl bg-[var(--wallet-surface-tint)] px-3 py-2.5"><dt>비상금</dt><dd className="mt-1 text-sm font-extrabold text-[var(--wallet-ink)]">{starter.emergencyMonths.toFixed(1)}개월</dd></div>
        </dl>
      </div>
      <div className="mt-5 grid border-t border-[var(--wallet-line)] sm:grid-cols-2 lg:grid-cols-4">
        {starter.actions.map((action) => (
          <a key={action.label} href={action.href} className="group flex min-h-20 items-start gap-3 border-b border-[var(--wallet-line)] py-3.5 transition-colors hover:bg-[var(--wallet-surface-tint)] active:bg-[var(--wallet-primary-soft)] sm:px-3 lg:border-b-0">
            <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${actionToneClass[action.tone]}`}>{action.icon}</span>
            <span className="min-w-0"><strong className="block text-sm font-extrabold text-[var(--wallet-ink)]">{action.label}</strong><span className="mt-1 block text-xs font-medium leading-5 text-[var(--wallet-muted)]">{action.detail}</span></span>
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

function categoryFromHash(hash: string): DashboardCategory {
  if (["#planner-cash-flow", "#expense-management", "#finance-accounts"].includes(hash)) return "input";
  if (hash === "#finance-calculators") return "calculators";
  if (hash === "#finance-products") return "products";
  if (hash === "#finance-loans") return "insights";
  return "overview";
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
    <nav aria-label="대시보드 카테고리" className="sticky top-[60px] z-20 -mx-4 border-y border-[var(--wallet-line)] bg-[var(--wallet-page)]/94 px-4 py-2 backdrop-blur-xl sm:static sm:mx-0 sm:rounded-[20px] sm:border sm:bg-[var(--wallet-surface)] sm:p-1.5 sm:shadow-[var(--wallet-shadow)]">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            aria-current={activeCategory === item.category ? "location" : undefined}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 text-xs font-extrabold transition-[background-color,color,transform] active:scale-[0.98] sm:flex-row sm:justify-start sm:gap-2 sm:px-3 sm:text-sm ${
              activeCategory === item.category
                ? "bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary-strong)]"
                : "text-[var(--wallet-muted)] hover:bg-[var(--wallet-surface-tint)] hover:text-[var(--wallet-ink)]"
            }`}
          >
            <span aria-hidden="true" className={`grid size-7 shrink-0 place-items-center rounded-xl ${activeCategory === item.category ? "bg-[var(--wallet-surface)]" : ""}`}>{item.icon}</span>
            <span className="min-w-0">
              <span className="block">{item.label}</span>
              <span className="hidden truncate text-[11px] font-medium text-[var(--wallet-muted)] sm:block">{item.detail}</span>
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
  const [activeCategory, setActiveCategory] = useState<DashboardCategory>("overview");
  const [activeHash, setActiveHash] = useState("");
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
  const isNetWorthNegative = scenario.netWorth < 0;

  return (
    <section aria-labelledby="dashboard-overview-title" className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-sm font-medium text-[var(--wallet-muted)]">김기은님의 머니 플랜</p><h1 id="dashboard-overview-title" className="mt-1 break-keep text-xl font-extrabold text-[var(--wallet-ink)] sm:text-2xl">1억을 향한 자산 지도</h1></div>
        <span className="shrink-0 rounded-full bg-[var(--wallet-primary-soft)] px-3 py-2 text-xs font-bold text-[var(--wallet-primary-strong)]">오늘 기준</span>
      </header>

      {storageNotice && <p role="status" className="mb-4 rounded-2xl bg-[var(--wallet-coral-soft)] px-4 py-3 text-sm font-semibold text-[#9a4f58]">{storageNotice}</p>}

      <div className="grid gap-5">
        <CategoryNavigator activeCategory={activeCategory} />

        {activeCategory === "overview" && (
          <>
            <section aria-label="자산 요약" className="overflow-hidden rounded-[24px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] text-[var(--wallet-ink)] shadow-[var(--wallet-shadow)]">
              <div className="p-5 sm:p-7">
                <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[var(--wallet-muted)]">현재 순자산</p><span className="grid size-10 place-items-center rounded-2xl bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary-strong)]"><Target aria-hidden="true" size={21} /></span></div>
                <p aria-live="polite" className={`mt-2 break-words text-[2.25rem] font-extrabold leading-tight tabular-nums [overflow-wrap:anywhere] sm:text-5xl ${scenario.netWorth < 0 ? "text-[var(--wallet-coral)]" : "text-[var(--wallet-ink)]"}`} data-testid="overview-net-worth">{formatCurrency(scenario.netWorth)}</p>
                <div className="mt-5 grid grid-cols-3 divide-x divide-[var(--wallet-line)] border-y border-[var(--wallet-line)] py-3 text-xs font-semibold text-[var(--wallet-muted)]">
                  <div className="min-w-0 px-2 first:pl-0 sm:px-4"><span className="block">보유 자산</span><strong className="mt-1 block break-words text-sm font-extrabold text-[var(--wallet-ink)]">{formatShortMoney(scenario.totalAssetBalances)}</strong></div>
                  <div className="min-w-0 px-2 sm:px-4"><span className="block">등록 부채</span><strong className="mt-1 block break-words text-sm font-extrabold text-[var(--wallet-coral)]">{formatShortMoney(scenario.totalLiabilities)}</strong></div>
                  <div className="min-w-0 px-2 last:pr-0 sm:px-4"><span className="block">월 여유</span><strong className={`mt-1 block break-words text-sm font-extrabold ${scenario.rawMonthlySurplus < 0 ? "text-[var(--wallet-coral)]" : "text-[var(--wallet-primary-strong)]"}`}>{formatShortMoney(scenario.rawMonthlySurplus)}</strong></div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--wallet-line)]" role="progressbar" aria-label={isNetWorthNegative ? "부채 초과 상태" : "1억 목표 달성률"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><div className="h-full rounded-full bg-[var(--wallet-primary)] transition-[width] motion-reduce:transition-none" style={{ width: `${isNetWorthNegative ? 0 : progressPercent}%` }} /></div>
                <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium text-[var(--wallet-muted)]">{isNetWorthNegative ? "부채 초과" : "남은 목표"} <strong className="ml-1 font-extrabold text-[var(--wallet-ink)]">{isNetWorthNegative ? formatShortMoney(Math.abs(scenario.netWorth)) : formatShortMoney(remainingAmount)}</strong></span><span className="font-medium text-[var(--wallet-muted)]">예상 <strong className="ml-1 font-extrabold text-[var(--wallet-primary-strong)]" data-testid="overview-goal-months">{formatExpectedMonth(monthsToGoal, referenceDate)}</strong></span></div>
              </div>
              <dl className="grid grid-cols-2 border-t border-[var(--wallet-line)] bg-[var(--wallet-surface)] sm:grid-cols-4 sm:divide-x sm:divide-[var(--wallet-line)]">
                <Metric icon={<ArrowDownToLine size={16} />} label="월 수입" value={scenario.monthlyIncome} />
                <Metric icon={<ArrowUpFromLine size={16} />} label="생활 지출" value={scenario.monthlyNonLoanExpense} testId="overview-monthly-expense" />
                <Metric icon={<Landmark size={16} />} label="대출 납입" value={scenario.totalLoanPayment} />
                <div aria-live="polite"><Metric icon={<WalletCards size={16} />} label="상환 후 여유" value={scenario.rawMonthlySurplus} warning={scenario.rawMonthlySurplus < 0} testId="overview-monthly-surplus" /></div>
              </dl>
            </section>

            <StarterChecklist scenario={scenario} />

            <section className="rounded-[22px] bg-[var(--wallet-mint-soft)] p-4 text-sm font-medium leading-6 text-[#205f52]" aria-label="계산 안내">계좌 잔액과 대출 원금은 각각 합산하며, 순자산은 자산보다 부채가 많으면 음수로 표시합니다. 전망에는 대출 원금과 이자, 상환 방식, 월 적자까지 반영됩니다.</section>
          </>
        )}

        {activeCategory === "input" && (
          <>
            <section aria-labelledby="cash-flow-editor-title" className="scroll-mt-36 rounded-[22px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] p-4 shadow-[var(--wallet-shadow)] sm:p-5" id="planner-cash-flow">
              <div className="mb-4"><h2 id="cash-flow-editor-title" className="text-lg font-black text-[var(--wallet-ink)]">월 현금흐름</h2></div>
              {hydrated ? (
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(14rem,0.7fr)]">
                  <MoneyInput id="monthly-income" label="월 수입" value={input.monthlyIncome} onChange={(monthlyIncome) => updateInput((current) => ({ ...current, monthlyIncome }))} quickAmountMode="adjust" quickAmountsManwon={[10, 50, 100]} />
                  <div className="flex min-h-28 flex-col justify-center border-t border-[var(--wallet-line)] py-4 sm:border-l sm:border-t-0 sm:pl-5">
                    <p className="text-sm font-bold text-[var(--wallet-muted)]">항목별 월 지출</p>
                    <p className="mt-2 text-2xl font-black tabular-nums text-[var(--wallet-ink)]">{formatCurrency(scenario.monthlyNonLoanExpense)}</p>
                    <a className="mt-2 w-fit text-sm font-bold text-[var(--wallet-primary-strong)] underline-offset-4 hover:underline" href="#expense-management">세부 내역 관리</a>
                    <div className="mt-4"><CashFlowMiniBars scenario={scenario} /></div>
                  </div>
                </div>
              ) : (
                <div aria-busy="true" className="min-h-36 border-t border-[var(--wallet-line)] pt-5 text-sm font-semibold text-[var(--wallet-muted)]" role="status">계획 불러오는 중</div>
              )}
            </section>

            <div className="scroll-mt-36" id="expense-management">
              {hydrated ? <ExpenseManagementEditor value={input.expenses} onChange={(expenses) => updateInput((current) => ({ ...current, expenses }))} /> : null}
            </div>

            <div className="scroll-mt-36" id="finance-accounts">
              {hydrated ? (
                <FinanceScenarioEditor value={input} onChange={replaceInput} />
              ) : (
                <section aria-busy="true" aria-label="금융 계정 불러오는 중" className="min-h-44 rounded-[22px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] p-5 text-sm font-semibold text-[var(--wallet-muted)] shadow-[var(--wallet-shadow)]">계획 불러오는 중</section>
              )}
            </div>
          </>
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
    </section>
  );
}
