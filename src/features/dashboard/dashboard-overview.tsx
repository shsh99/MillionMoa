import { calculateMonthlyCashFlow, calculateMonthsToGoal } from "@/lib/calculators";
import { GoalQuickPlanner } from "./goal-quick-planner";

const currentAssets = 10_000_000;
const monthlyTakeHome = 3_200_000;
const fixedCosts = 1_050_000;
const variableSpending = 850_000;
const reserveContribution = 300_000;
const monthlyContribution = 1_000_000;
const goalAmount = 100_000_000;

const timeline = calculateMonthsToGoal({
  currentAmount: currentAssets,
  goalAmount,
  monthlyContribution,
  annualReturnRate: 0,
});

const cashFlow = calculateMonthlyCashFlow({
  monthlyIncome: monthlyTakeHome,
  fixedCosts,
  variableSpending,
  reserveContribution,
});

const remainingAmount = goalAmount - currentAssets;
const progressPercent = Math.round((currentAssets / goalAmount) * 100);
const savingRatePercent = Math.round(((cashFlow.savingRate ?? 0) * 100 + Number.EPSILON) * 10) / 10;
const spendAmount = fixedCosts + variableSpending;

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

const cashFlowRows = [
  { label: "실수령", amount: monthlyTakeHome, tone: "text-[#111827]" },
  { label: "생활비", amount: spendAmount, tone: "text-[#687385]" },
  { label: "비상금", amount: reserveContribution, tone: "text-[#687385]" },
  { label: "저축/투자", amount: monthlyContribution, tone: "text-[#2563eb]" },
];

const allocationRows = [
  {
    label: "생활비 통장",
    amount: spendAmount,
    caption: "고정비와 변동비를 먼저 잠금",
    percent: Math.round((spendAmount / monthlyTakeHome) * 100),
  },
  {
    label: "비상금",
    amount: reserveContribution,
    caption: "CMA/파킹 계좌에 자동 이체",
    percent: Math.round((reserveContribution / monthlyTakeHome) * 100),
  },
  {
    label: "목표 계좌",
    amount: monthlyContribution,
    caption: "ISA, 적금, 일반 투자로 분리",
    percent: Math.round((monthlyContribution / monthlyTakeHome) * 100),
  },
];

const readinessItems = [
  { label: "월급 통장 분리", value: "준비됨" },
  { label: "월말 스윕 규칙", value: "설정 필요" },
  { label: "IRP/연금저축", value: "입력 필요" },
];

export function DashboardOverview() {
  return (
    <section
      aria-labelledby="dashboard-overview-title"
      className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8"
    >
      <div className="grid content-start gap-4">
        <div className="overflow-hidden rounded-lg border border-[#d9e0ea] bg-white">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_290px]">
            <div className="bg-[#111827] p-5 text-white sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-[#93c5fd]">MillionMoa</p>
                <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-black text-[#dbeafe]">
                  샘플 데이터
                </span>
              </div>
              <h1
                id="dashboard-overview-title"
                className="mt-4 max-w-xl scroll-mt-24 text-3xl font-black tracking-normal text-white sm:text-5xl"
              >
                1억까지 남은 금액
              </h1>
              <p className="mt-4 break-keep text-5xl font-black tracking-normal sm:text-6xl">
                {formatCurrency(remainingAmount)}
              </p>
              <div
                aria-label="1억 목표 달성률"
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={progressPercent}
                className="mt-7 h-2 overflow-hidden rounded-full bg-white/15"
                role="progressbar"
              >
                <div className="h-full rounded-full bg-[#60a5fa]" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm font-bold text-[#cbd5e1]">
                <span>{progressPercent}% 달성</span>
                <span>목표 {formatShortMoney(goalAmount)}</span>
              </div>
            </div>

            <div className="grid content-between gap-5 bg-[#f8fafc] p-5">
              <div>
                <p className="text-sm font-black text-[#687385]">월 현금흐름</p>
                <p className="mt-2 text-3xl font-black text-[#111827]">
                  {formatCurrency(cashFlow.investableSurplus ?? 0)}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#687385]">
                  생활비와 비상금 이체 후 목표 계좌로 보낼 수 있는 예시 금액입니다.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white p-3 ring-1 ring-[#d9e0ea]">
                  <p className="text-xs font-black text-[#687385]">저축률</p>
                  <p className="mt-1 text-2xl font-black text-[#111827]">{savingRatePercent}%</p>
                </div>
                <div className="rounded-lg bg-white p-3 ring-1 ring-[#d9e0ea]">
                  <p className="text-xs font-black text-[#687385]">예상 기간</p>
                  <p className="mt-1 text-2xl font-black text-[#111827]">
                    {timeline.months === null ? "확인" : `${timeline.months}개월`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-[#d9e0ea] bg-white p-5" aria-labelledby="cash-flow-title">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="cash-flow-title" className="scroll-mt-24 text-lg font-black text-[#111827]">
                  한 달 돈 흐름
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#687385]">월급 들어온 뒤 빠지는 순서</p>
              </div>
              <span className="rounded-md bg-[#eff6ff] px-3 py-1 text-xs font-black text-[#2563eb]">
                자동 계산
              </span>
            </div>

            <div className="mt-5 grid gap-2">
              {cashFlowRows.map((row, index) => (
                <div
                  className="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-lg bg-[#f8fafc] px-3 py-3"
                  key={row.label}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-xs font-black text-[#2563eb] ring-1 ring-[#d9e0ea]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 text-sm font-black text-[#374151]">{row.label}</span>
                  <span className={`text-right text-sm font-black tabular-nums ${row.tone}`}>
                    {formatCurrency(row.amount)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#d9e0ea] bg-white p-5" aria-labelledby="allocation-title">
            <h2 id="allocation-title" className="scroll-mt-24 text-lg font-black text-[#111827]">
              월급 배분안
            </h2>
            <div className="mt-5 grid gap-4">
              {allocationRows.map((row) => (
                <div key={row.label}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-black text-[#111827]">{row.label}</p>
                      <p className="mt-1 text-sm font-semibold leading-5 text-[#687385]">{row.caption}</p>
                    </div>
                    <p className="shrink-0 text-right font-black tabular-nums text-[#111827]">
                      {formatCurrency(row.amount)}
                    </p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eef1f5]">
                    <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${row.percent}%` }} />
                  </div>
                  <p className="mt-1 text-right text-xs font-black text-[#687385]">실수령의 {row.percent}%</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <GoalQuickPlanner />

        <section className="rounded-lg border border-[#d9e0ea] bg-white p-5" aria-labelledby="readiness-title">
          <h2 id="readiness-title" className="text-lg font-black text-[#111827]">
            입력 완성도
          </h2>
          <div className="mt-4 grid gap-3">
            {readinessItems.map((item) => (
              <div className="flex items-center justify-between gap-4" key={item.label}>
                <span className="text-sm font-bold text-[#687385]">{item.label}</span>
                <span className="rounded-md bg-[#f8fafc] px-2.5 py-1 text-xs font-black text-[#374151] ring-1 ring-[#d9e0ea]">
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
