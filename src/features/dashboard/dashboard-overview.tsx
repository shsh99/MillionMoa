import { calculateLoanImpact } from "@/lib/calculators";
import { GoalQuickPlanner } from "./goal-quick-planner";

const currentAssets = 10_000_000;
const monthlyTakeHome = 3_200_000;
const fixedCosts = 1_050_000;
const variableSpending = 850_000;
const reserveContribution = 300_000;
const monthlyContribution = 1_000_000;
const sampleLoanPrincipal = 30_000_000;
const sampleLoanRate = 0.045;
const sampleLoanTermMonths = 60;
const goalAmount = 100_000_000;

const loanImpact = calculateLoanImpact({
  principal: sampleLoanPrincipal,
  annualInterestRate: sampleLoanRate,
  remainingTermMonths: sampleLoanTermMonths,
  currentAmount: currentAssets,
  goalAmount,
  baselineMonthlyContribution: monthlyContribution,
  annualReturnRate: 0,
});

const remainingAmount = goalAmount - currentAssets;
const progressPercent = Math.round((currentAssets / goalAmount) * 100);
const spendAmount = fixedCosts + variableSpending;
const loanMonthlyPayment = loanImpact.totalMonthlyLoanPayment ?? 0;
const contributionAfterLoan = loanImpact.changedMonthlyContribution ?? monthlyContribution;

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function formatShortMoney(value: number) {
  if (value >= 100_000_000) {
    return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(value / 100_000_000)}억원`;
  }

  if (value >= 10_000_000) {
    return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(value / 10_000_000)}천만원`;
  }

  return `${new Intl.NumberFormat("ko-KR").format(value / 10_000)}만원`;
}

const quickModes = [
  { label: "이번 달", href: "#cash-flow-title" },
  { label: "목표", href: "#goal-quick-planner-title" },
  { label: "대출", href: "#loan-impact-title" },
  { label: "세금", href: "#readiness-title" },
];

const cashFlowRows = [
  { label: "실수령", amount: monthlyTakeHome, tone: "text-[#111827]" },
  { label: "생활비", amount: spendAmount, tone: "text-[#6b7280]" },
  { label: "비상금", amount: reserveContribution, tone: "text-[#6b7280]" },
  { label: "대출 상환", amount: loanMonthlyPayment, tone: "text-[#9a5b00]" },
  { label: "목표 계좌", amount: contributionAfterLoan, tone: "text-[#2563eb]" },
];

const allocationRows = [
  {
    label: "생활비 통장",
    amount: spendAmount,
    caption: "고정비와 변동비 잠금",
    percent: Math.round((spendAmount / monthlyTakeHome) * 100),
    icon: "생활",
  },
  {
    label: "비상금",
    amount: reserveContribution,
    caption: "CMA/파킹 자동 이체",
    percent: Math.round((reserveContribution / monthlyTakeHome) * 100),
    icon: "비상",
  },
  {
    label: "목표 계좌",
    amount: contributionAfterLoan,
    caption: "대출 상환 후 실제 가능액",
    percent: Math.round((contributionAfterLoan / monthlyTakeHome) * 100),
    icon: "목표",
  },
];

const readinessItems = [
  { label: "월급 통장 분리", value: "준비됨" },
  { label: "대출 영향", value: loanImpact.status === "available" ? "반영됨" : "확인 필요" },
  { label: "IRP/연금저축", value: "입력 필요" },
];

export function DashboardOverview() {
  return (
    <section
      aria-labelledby="dashboard-overview-title"
      className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8"
    >
      <div className="grid min-w-0 content-start gap-4">
        <div className="overflow-hidden rounded-lg border border-[#dbe3ef] bg-white shadow-[0_24px_80px_rgba(31,41,55,0.08)]">
          <div className="bg-[radial-gradient(circle_at_20%_0%,#e7f0ff_0,#ffffff_44%,#f7fbff_100%)] p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black text-[#2563eb]">김기은님</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#6b7280] ring-1 ring-[#dbe3ef]">
                    샘플 데이터
                  </span>
                </div>
                <h1
                  id="dashboard-overview-title"
                  className="mt-2 max-w-xl scroll-mt-24 text-2xl font-black tracking-normal text-[#111827] sm:text-4xl"
                >
                  1억 플랜 계좌
                </h1>
              </div>
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-xs font-black text-white shadow-[0_16px_34px_rgba(37,99,235,0.32)]">
                1억
              </span>
            </div>

            <div className="mt-7 rounded-lg border border-white/80 bg-white/80 p-5 shadow-[0_18px_60px_rgba(31,41,55,0.10)] backdrop-blur">
              <p className="text-sm font-bold text-[#6b7280]">현재 자산</p>
              <p className="mt-2 break-keep text-5xl font-black tracking-normal text-[#111827] sm:text-6xl">
                {formatCurrency(currentAssets)}
              </p>
              <div
                aria-label="1억 목표 달성률"
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={progressPercent}
                className="mt-6 h-2 overflow-hidden rounded-full bg-[#e5eaf2]"
                role="progressbar"
              >
                <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm font-black text-[#4b5563]">
                <span>{progressPercent}% 달성</span>
                <span>남은 금액 {formatShortMoney(remainingAmount)}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <a
                  className="flex min-h-11 items-center justify-center rounded-lg bg-[#2563eb] px-3 text-sm font-black text-white transition active:scale-[0.98]"
                  href="#goal-quick-planner-title"
                >
                  목표 조정
                </a>
                <a
                  className="flex min-h-11 items-center justify-center rounded-lg border border-[#cbd8ea] bg-white px-3 text-sm font-black text-[#2563eb] transition active:scale-[0.98]"
                  href="#loan-impact-title"
                >
                  대출 보기
                </a>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {quickModes.map((mode) => (
                <a
                  className="shrink-0 rounded-full border border-[#dbe3ef] bg-white/80 px-4 py-2 text-sm font-black text-[#374151] transition hover:border-[#2563eb] hover:text-[#2563eb] active:scale-[0.98]"
                  href={mode.href}
                  key={mode.label}
                >
                  {mode.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="min-w-0 rounded-lg border border-[#dbe3ef] bg-white p-5" aria-labelledby="cash-flow-title">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="cash-flow-title" className="scroll-mt-24 text-lg font-black text-[#111827]">
                  한 달 돈 흐름
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#6b7280]">대출까지 반영한 월급 배분</p>
              </div>
              <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-black text-[#2563eb]">
                자동 계산
              </span>
            </div>

            <div className="mt-5 grid gap-2">
              {cashFlowRows.map((row, index) => (
                <div
                  className="grid min-h-12 grid-cols-[34px_1fr_auto] items-center gap-3 rounded-lg bg-[#f8fbff] px-3"
                  key={row.label}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-black text-[#2563eb] ring-1 ring-[#dbe3ef]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 truncate text-sm font-black text-[#374151]">{row.label}</span>
                  <span className={`text-right text-sm font-black tabular-nums ${row.tone}`}>
                    {formatCurrency(row.amount)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="min-w-0 rounded-lg border border-[#dbe3ef] bg-white p-5" aria-labelledby="allocation-title">
            <h2 id="allocation-title" className="scroll-mt-24 text-lg font-black text-[#111827]">
              계좌별 배분
            </h2>
            <div className="mt-5 grid gap-3">
              {allocationRows.map((row) => (
                <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg bg-[#f8fbff] p-3" key={row.label}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[11px] font-black text-[#2563eb] ring-1 ring-[#dbe3ef]">
                    {row.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-black text-[#111827]">{row.label}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-[#6b7280]">{row.caption}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black tabular-nums text-[#111827]">{formatCurrency(row.amount)}</p>
                    <p className="mt-1 text-xs font-black text-[#6b7280]">{row.percent}%</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section
          className="min-w-0 rounded-lg border border-[#dbe3ef] bg-white p-5"
          aria-labelledby="loan-impact-title"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="loan-impact-title" className="scroll-mt-24 text-lg font-black text-[#111827]">
                대출 영향
              </h2>
              <p className="mt-1 text-sm font-semibold text-[#6b7280]">원금과 이자가 목표 기간에 미치는 영향</p>
            </div>
            <span className="rounded-full bg-[#fff4de] px-3 py-1 text-xs font-black text-[#9a5b00]">
              {loanImpact.status === "available" ? `${loanImpact.monthsDelayed}개월 지연` : "확인 필요"}
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-[#f8fbff] p-4">
              <p className="text-xs font-black text-[#6b7280]">예상 월 상환액</p>
              <p className="mt-2 text-xl font-black text-[#111827]">{formatCurrency(loanMonthlyPayment)}</p>
            </div>
            <div className="rounded-lg bg-[#f8fbff] p-4">
              <p className="text-xs font-black text-[#6b7280]">총 이자 추정</p>
              <p className="mt-2 text-xl font-black text-[#111827]">{formatCurrency(loanImpact.totalInterest ?? 0)}</p>
            </div>
            <div className="rounded-lg bg-[#f8fbff] p-4">
              <p className="text-xs font-black text-[#6b7280]">대출 후 목표계좌</p>
              <p className="mt-2 text-xl font-black text-[#2563eb]">{formatCurrency(contributionAfterLoan)}</p>
            </div>
          </div>
        </section>
      </div>

      <aside className="grid min-w-0 content-start gap-4">
        <GoalQuickPlanner />

        <section className="rounded-lg border border-[#dbe3ef] bg-white p-5" aria-labelledby="readiness-title">
          <h2 id="readiness-title" className="text-lg font-black text-[#111827]">
            입력 완성도
          </h2>
          <div className="mt-4 grid gap-3">
            {readinessItems.map((item) => (
              <div className="flex min-h-11 items-center justify-between gap-4" key={item.label}>
                <span className="text-sm font-bold text-[#6b7280]">{item.label}</span>
                <span className="rounded-full bg-[#f8fbff] px-2.5 py-1 text-xs font-black text-[#374151] ring-1 ring-[#dbe3ef]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-lg bg-[#fff8e8] p-3 text-sm font-semibold leading-6 text-[#7c5a18]">
            세액공제와 환급은 같지 않습니다. 실제 결과는 홈택스 자료로 확인해야 합니다.
          </p>
        </section>
      </aside>
    </section>
  );
}
