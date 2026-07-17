"use client";

import { useCallback, useState } from "react";
import {
  GoalQuickPlanner,
  initialPlannerSnapshot,
  type PlannerSnapshot,
} from "./goal-quick-planner";

const goalAmount = 100_000_000;

function formatCurrency(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}${new Intl.NumberFormat("ko-KR").format(Math.abs(Math.round(value)))}원`;
}

function formatShortMoney(value: number) {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (absolute >= 100_000_000) return `${sign}${(absolute / 100_000_000).toFixed(1).replace(/\.0$/, "")}억원`;
  return `${sign}${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(absolute / 10_000)}만원`;
}

function SummaryRow({ label, value, tone = "default", testId }: { label: string; value: number; tone?: "default" | "accent" | "warning"; testId?: string }) {
  const toneClass = tone === "accent" ? "text-[#087a63]" : tone === "warning" ? "text-[#a15c00]" : "text-[#18202b]";
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 border-b border-[#e8edf3] last:border-b-0">
      <dt className="text-sm font-bold text-[#697587]">{label}</dt>
      <dd className={`text-right text-base font-black tabular-nums ${toneClass}`} data-testid={testId}>{formatCurrency(value)}</dd>
    </div>
  );
}

export function DashboardOverview() {
  const [snapshot, setSnapshot] = useState(initialPlannerSnapshot);
  const handleSnapshotChange = useCallback((next: PlannerSnapshot) => setSnapshot(next), []);
  const progressPercent = Math.max(0, Math.min(100, Math.round((snapshot.netWorthWon / goalAmount) * 100)));
  const remainingAmount = Math.max(0, goalAmount - snapshot.netWorthWon);
  const savingsRate = snapshot.incomeWon > 0
    ? Math.round((snapshot.monthlySurplusWon / snapshot.incomeWon) * 100)
    : 0;
  const cashStatus = snapshot.monthlySurplusWon >= 0 ? "저축 가능" : "지출 초과";

  return (
    <section aria-labelledby="dashboard-overview-title" className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#087a63]">김기은님의 머니 플랜</p>
          <h1 id="dashboard-overview-title" className="mt-1 text-2xl font-black tracking-normal text-[#18202b] sm:text-3xl">1억 플랜 계좌</h1>
        </div>
        <span className="rounded-md border border-[#d8e0ea] bg-white px-2.5 py-1.5 text-xs font-bold text-[#697587]">샘플 데이터</span>
      </header>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <main className="grid min-w-0 content-start gap-5">
          <section className="overflow-hidden rounded-lg border border-[#cfd8e3] bg-[#17202c] text-white" aria-label="자산 요약">
            <div className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#b7c2d0]">현재 순자산</p>
                  <p className="mt-2 break-words text-[2rem] font-black tabular-nums sm:text-5xl" data-testid="overview-net-worth">{formatCurrency(snapshot.netWorthWon)}</p>
                </div>
                <span className="shrink-0 rounded-md bg-[#213d3a] px-2.5 py-1.5 text-xs font-black text-[#79d7c2]">실시간 반영</span>
              </div>
              <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="1억 목표 달성률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
                <div className="h-full rounded-full bg-[#40b89d] transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
                <span className="text-[#79d7c2]">{progressPercent}% 달성</span>
                <span className="text-[#b7c2d0]">앞으로 {formatShortMoney(remainingAmount)}</span>
              </div>
            </div>
            <dl className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-white/[0.03]">
              <div className="min-w-0 p-4"><dt className="text-xs font-bold text-[#9eabb9]">월 여유자금</dt><dd className="mt-1 break-words text-xs font-black tabular-nums sm:text-base" data-testid="overview-monthly-surplus">{formatCurrency(snapshot.monthlySurplusWon)}</dd></div>
              <div className="min-w-0 p-4"><dt className="text-xs font-bold text-[#9eabb9]">저축률</dt><dd className="mt-1 text-sm font-black tabular-nums sm:text-base">{savingsRate}%</dd></div>
              <div className="min-w-0 p-4"><dt className="text-xs font-bold text-[#9eabb9]">목표 예상</dt><dd className="mt-1 text-sm font-black tabular-nums sm:text-base" data-testid="overview-goal-months">{snapshot.monthsToGoal === null ? "확인 필요" : `${snapshot.monthsToGoal}개월`}</dd></div>
            </dl>
          </section>

          <nav aria-label="금융 현황 바로가기" className="grid grid-cols-4 border-y border-[#d8e0ea] bg-white">
            {[{label:"순자산", href:"#planner-net-worth"},{label:"현금흐름", href:"#planner-cash-flow"},{label:"대출", href:"#planner-loan"},{label:"수익률", href:"#planner-return"}].map((item) => (
              <a className="flex min-h-12 items-center justify-center border-r border-[#e8edf3] px-1 text-sm font-black text-[#556274] last:border-r-0 hover:bg-[#f5f7fa] hover:text-[#087a63]" href={item.href} key={item.label}>{item.label}</a>
            ))}
          </nav>

          <div className="grid gap-5 md:grid-cols-2">
            <section className="border-t-2 border-[#18202b] bg-white" aria-labelledby="cash-flow-title">
              <div className="flex items-start justify-between gap-3 py-4">
                <div><h2 id="cash-flow-title" className="text-lg font-black text-[#18202b]">한 달 돈 흐름</h2><p className="mt-1 text-sm font-semibold text-[#697587]">수입과 지출을 기준으로 계산</p></div>
                <span className={`rounded-md px-2 py-1 text-xs font-black ${snapshot.monthlySurplusWon >= 0 ? "bg-[#eaf8f3] text-[#087a63]" : "bg-[#fff3e6] text-[#a15c00]"}`}>{cashStatus}</span>
              </div>
              <dl className="border-t border-[#e8edf3]">
                <SummaryRow label="월 수입" value={snapshot.incomeWon} />
                <SummaryRow label="월 지출" value={snapshot.expenseWon} />
                <SummaryRow label="월 여유자금" value={snapshot.monthlySurplusWon} tone="accent" />
                <SummaryRow label="대출 상환 후" value={snapshot.monthlySurplusAfterLoanWon} tone={snapshot.monthlySurplusAfterLoanWon < 0 ? "warning" : "default"} />
              </dl>
            </section>

            <section className="border-t-2 border-[#18202b] bg-white" aria-labelledby="allocation-title">
              <div className="py-4"><h2 id="allocation-title" className="text-lg font-black text-[#18202b]">자산 구성</h2><p className="mt-1 text-sm font-semibold text-[#697587]">자산과 부채를 분리해 확인</p></div>
              <dl className="border-t border-[#e8edf3]">
                <SummaryRow label="보유 자산" value={snapshot.assetWon} />
                <SummaryRow label="등록 부채" value={snapshot.liabilityWon} tone="warning" />
                <SummaryRow label="순자산" value={snapshot.netWorthWon} tone="accent" />
              </dl>
              <p className="border-t border-[#e8edf3] py-4 text-xs font-semibold leading-5 text-[#697587]">대출 원금은 부채 카테고리에 등록할 때만 순자산에서 차감됩니다.</p>
            </section>
          </div>

          <section className="border-t-2 border-[#a15c00] bg-white" aria-labelledby="loan-impact-title">
            <div className="flex items-start justify-between gap-4 py-4">
              <div><h2 id="loan-impact-title" className="text-lg font-black text-[#18202b]">대출 영향</h2><p className="mt-1 text-sm font-semibold text-[#697587]">상환 부담이 1억 달성에 미치는 영향</p></div>
              <a href="#planner-loan" className="min-h-11 shrink-0 rounded-lg px-3 py-3 text-sm font-black text-[#087a63] hover:bg-[#eaf8f3]">조건 수정</a>
            </div>
            <dl className="grid border-y border-[#e8edf3] sm:grid-cols-3 sm:divide-x sm:divide-[#e8edf3]">
              <div className="p-4"><dt className="text-xs font-bold text-[#697587]">월 원리금</dt><dd className="mt-2 text-lg font-black tabular-nums text-[#18202b]">{formatCurrency(snapshot.monthlyLoanPaymentWon)}</dd></div>
              <div className="border-t border-[#e8edf3] p-4 sm:border-t-0"><dt className="text-xs font-bold text-[#697587]">총 이자 추정</dt><dd className="mt-2 text-lg font-black tabular-nums text-[#a15c00]">{formatCurrency(snapshot.totalLoanInterestWon)}</dd></div>
              <div className="border-t border-[#e8edf3] p-4 sm:border-t-0"><dt className="text-xs font-bold text-[#697587]">목표 지연</dt><dd className="mt-2 text-lg font-black tabular-nums text-[#18202b]">{snapshot.monthsDelayedByLoan === null ? "확인 필요" : `${snapshot.monthsDelayedByLoan}개월`}</dd></div>
            </dl>
            {snapshot.hasPossibleLoanExpenseDuplicate ? <p className="mt-3 rounded-lg bg-[#fff3e6] p-3 text-sm font-bold leading-6 text-[#8a5100]">지출 항목에 대출 상환으로 보이는 값이 있습니다. 대출 탭의 월 원리금과 중복 차감될 수 있으니 일반 지출에서는 제거해 주세요.</p> : null}
          </section>

          <section className="border-t border-[#d8e0ea] py-4" aria-labelledby="readiness-title">
            <h2 id="readiness-title" className="text-base font-black text-[#18202b]">계산 범위</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#697587]">현재 화면은 자산, 부채, 월 현금흐름, 대출 조건을 반영합니다. 세액공제와 환급의 실제 결과는 홈택스 자료로 확인해야 합니다.</p>
          </section>
        </main>

        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <GoalQuickPlanner onSnapshotChange={handleSnapshotChange} />
        </aside>
      </div>
    </section>
  );
}
