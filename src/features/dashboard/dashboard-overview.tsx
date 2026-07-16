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

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

const summaryCards = [
  {
    label: "현재 자산",
    value: formatCurrency(currentAssets),
    caption: `목표의 ${progressPercent}%`,
  },
  {
    label: "매달 가능액",
    value: formatCurrency(monthlyContribution),
    caption: `저축률 ${savingRatePercent}% 기준`,
  },
  {
    label: "예상 기간",
    value: timeline.months === null ? "계산 필요" : `${timeline.months}개월`,
    caption: timeline.months === null ? "입력값 확인 필요" : "수익률 0% 단순 추정",
  },
];

const accountRows = [
  { name: "생활비", amount: fixedCosts + variableSpending, note: "고정비+변동비" },
  { name: "비상금", amount: reserveContribution, note: "CMA/파킹" },
  { name: "저축/투자", amount: monthlyContribution, note: "ISA/적금/일반" },
];

const nextActions = [
  { title: "월급 통장 쪼개기", detail: "생활비와 저축 이체액을 월급일 기준으로 분리" },
  { title: "월말 남은 돈 스윕", detail: "실제 남은 현금만 다음 목표 계좌로 이동" },
  { title: "절세 입력 보강", detail: "IRP, 연금저축, ISA는 세제 효과와 투자 수익을 분리" },
];

export function DashboardOverview() {
  return (
    <section
      aria-labelledby="dashboard-overview-title"
      className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8"
    >
      <div className="grid gap-4">
        <div className="overflow-hidden rounded-lg bg-[#111827] text-white">
          <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-[#93c5fd]">MillionMoa</p>
                <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-bold text-[#cbd5e1]">
                  샘플 데이터
                </span>
              </div>
              <h1
                id="dashboard-overview-title"
                className="mt-3 max-w-xl text-3xl font-black tracking-normal sm:text-5xl"
              >
                1억까지 남은 돈
              </h1>
              <p className="mt-4 break-keep text-4xl font-black tracking-normal sm:text-6xl">
                {formatCurrency(remainingAmount)}
              </p>
              <div
                aria-label="1억 목표 달성률"
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={progressPercent}
                className="mt-6 h-2 overflow-hidden rounded-full bg-white/15"
                role="progressbar"
              >
                <div className="h-full rounded-full bg-[#60a5fa]" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm font-semibold text-[#cbd5e1]">
                <span>{progressPercent}% 달성</span>
                <span>목표 {formatCurrency(goalAmount)}</span>
              </div>
            </div>

            <div className="rounded-lg bg-white/10 p-4 ring-1 ring-white/15">
              <p className="text-sm font-semibold text-[#cbd5e1]">이번 달 현금흐름</p>
              <p className="mt-3 break-keep text-3xl font-black">
                {formatCurrency(cashFlow.investableSurplus ?? 0)}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#cbd5e1]">
                생활비와 비상금 이체 후 남는 예시 금액입니다. 실제 투자 조언이 아니라
                샘플 입력값 기준 시뮬레이션입니다.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <article key={card.label} className="rounded-lg border border-[#e7ebf0] bg-white p-5">
              <h2 className="text-sm font-bold text-[#687385]">{card.label}</h2>
              <p className="mt-3 break-keep text-2xl font-black text-[#111827]">{card.value}</p>
              <p className="mt-2 text-sm font-medium text-[#687385]">{card.caption}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-lg border border-[#e7ebf0] bg-white p-5" aria-labelledby="account-flow-title">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="account-flow-title" className="text-lg font-black text-[#111827]">
                  월급 배분
                </h2>
                <p className="mt-1 text-sm font-medium text-[#687385]">이체 전에 보는 이번 달 기준안</p>
              </div>
              <span className="shrink-0 rounded-md bg-[#eef4ff] px-3 py-1 text-xs font-bold text-[#2563eb]">
                자동 계산
              </span>
            </div>
            <div className="mt-5 divide-y divide-[#eef1f5]">
              {accountRows.map((row) => (
                <div className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:gap-4" key={row.name}>
                  <div className="min-w-0">
                    <p className="font-bold text-[#111827]">{row.name}</p>
                    <p className="mt-1 text-sm text-[#687385]">{row.note}</p>
                  </div>
                  <p className="break-keep font-black text-[#111827] sm:text-right">{formatCurrency(row.amount)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#e7ebf0] bg-white p-5" aria-labelledby="next-action-title">
            <h2 id="next-action-title" className="text-lg font-black text-[#111827]">
              다음에 할 일
            </h2>
            <div className="mt-4 grid gap-3">
              {nextActions.map((action, index) => (
                <div className="grid grid-cols-[32px_1fr] gap-3 rounded-lg bg-[#f6f8fb] p-3" key={action.title}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-[#2563eb] ring-1 ring-[#e7ebf0]">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#111827]">{action.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#687385]">{action.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <GoalQuickPlanner />
        <section className="rounded-lg border border-[#e7ebf0] bg-white p-5" aria-labelledby="tax-status-title">
          <h2 id="tax-status-title" className="text-lg font-black text-[#111827]">
            절세 체크
          </h2>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#687385]">연말정산 추정 영향</span>
              <span className="font-black text-[#111827]">0원</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#687385]">IRP/연금저축 입력</span>
              <span className="font-black text-[#b7791f]">필요</span>
            </div>
            <p className="rounded-lg bg-[#fff8e8] p-3 leading-6 text-[#7c5a18]">
              세액공제와 환급은 같지 않습니다. 실제 결과는 홈택스 자료로 확인해야 합니다.
            </p>
          </div>
        </section>
      </aside>
    </section>
  );
}
