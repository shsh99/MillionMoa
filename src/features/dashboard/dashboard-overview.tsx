"use client";

import { useCallback, useState, type ReactNode } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Landmark, WalletCards } from "lucide-react";
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

export function formatExpectedMonth(months: number | null, referenceDate = new Date()) {
  if (months === null) return "확인 필요";
  const expected = new Date(Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth() + months,
    1,
  ));
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(expected);
}

function MonthlyMetric({
  icon,
  label,
  value,
  testId,
  valueTestId,
  warning = false,
  announce = false,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  testId?: string;
  valueTestId?: string;
  warning?: boolean;
  announce?: boolean;
}) {
  return (
    <div className="min-w-0 px-2 py-3 sm:px-4">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-[#697587]">
        <span aria-hidden="true" className="text-[#7b8797]">{icon}</span>
        {label}
      </dt>
      <dd
        className={`mt-2 break-words text-sm font-semibold leading-5 tabular-nums [overflow-wrap:anywhere] sm:text-base ${warning ? "text-[#a15c00]" : "text-[#243041]"}`}
        data-testid={testId}
      >
        <span className="break-words" data-testid={valueTestId} aria-live={announce ? "polite" : undefined}>
          {formatCurrency(value)}
        </span>
      </dd>
    </div>
  );
}

export function DashboardOverview({ referenceDate }: { referenceDate?: Date }) {
  const [snapshot, setSnapshot] = useState(initialPlannerSnapshot);
  const handleSnapshotChange = useCallback((next: PlannerSnapshot) => setSnapshot(next), []);
  const progressPercent = Math.max(0, Math.min(100, Math.round((snapshot.netWorthWon / goalAmount) * 100)));
  const remainingAmount = Math.max(0, goalAmount - snapshot.netWorthWon);
  const goalMonthReference = referenceDate ?? new Date();

  return (
    <section aria-labelledby="dashboard-overview-title" className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#697587]">김기은님의 머니 플랜</p>
          <h1 id="dashboard-overview-title" className="mt-1 text-xl font-bold text-[#18202b] sm:text-2xl">1억 플랜 계좌</h1>
        </div>
        <span className="shrink-0 rounded-md bg-[#eef2f5] px-2.5 py-1.5 text-xs font-semibold text-[#697587]">샘플 데이터</span>
      </header>

      <div className="grid min-w-0 gap-5">
        <section aria-label="자산 요약" className="min-w-0 rounded-lg border border-[#e2e7ec] bg-white px-5 py-5 sm:px-6">
          <p className="text-sm font-medium text-[#697587]">현재 순자산</p>
          <p
            className="mt-1 break-words text-[2rem] font-black leading-tight text-[#18202b] tabular-nums [overflow-wrap:anywhere] sm:text-[2.5rem]"
            data-testid="overview-net-worth"
          >
            {formatCurrency(snapshot.netWorthWon)}
          </p>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#e8edf1]" role="progressbar" aria-label="1억 목표 달성률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
            <div className="h-full rounded-full bg-[#14856f] transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div className="min-w-0">
              <span className="block font-medium text-[#697587]">남은 목표</span>
              <strong className="mt-0.5 block break-words font-semibold text-[#344154] tabular-nums [overflow-wrap:anywhere]">{formatShortMoney(remainingAmount)}</strong>
            </div>
            <div className="min-w-0 text-right">
              <span className="block font-medium text-[#697587]">목표 예상</span>
              <strong className="mt-0.5 block break-words font-semibold text-[#087a63] tabular-nums [overflow-wrap:anywhere]" data-testid="overview-goal-months">
                {formatExpectedMonth(snapshot.monthsToGoal, goalMonthReference)}
              </strong>
            </div>
          </div>
        </section>

        <section aria-label="이번 달 요약" className="min-w-0 border-y border-[#e2e7ec] bg-white py-1">
          <h2 className="sr-only">이번 달 요약</h2>
          <dl className="grid min-w-0 grid-cols-2 sm:grid-cols-4 sm:divide-x sm:divide-[#edf0f3]">
            <MonthlyMetric icon={<ArrowDownToLine size={17} strokeWidth={1.75} />} label="월 수입" value={snapshot.incomeWon} />
            <MonthlyMetric icon={<ArrowUpFromLine size={17} strokeWidth={1.75} />} label="월 지출" value={snapshot.expenseWon} />
            <MonthlyMetric
              icon={<WalletCards size={17} strokeWidth={1.75} />}
              label="상환 후 여유"
              value={snapshot.monthlySurplusAfterLoanWon}
              testId="overview-monthly-surplus"
              valueTestId="overview-monthly-surplus-after-loan"
              warning={snapshot.monthlySurplusAfterLoanWon < 0}
              announce
            />
            <MonthlyMetric icon={<Landmark size={17} strokeWidth={1.75} />} label="대출 상환" value={snapshot.monthlyLoanPaymentWon} />
          </dl>
        </section>

        {snapshot.hasPossibleLoanExpenseDuplicate ? (
          <p className="rounded-lg bg-[#fff3e6] p-3 text-sm font-semibold leading-6 text-[#8a5100]">
            지출 항목에 대출 상환으로 보이는 값이 있습니다. 대출 탭의 월 원리금과 중복 차감될 수 있으니 일반 지출에서는 제거해 주세요.
          </p>
        ) : null}

        <div className="min-w-0">
          <GoalQuickPlanner onSnapshotChange={handleSnapshotChange} />
        </div>

        <section className="border-t border-[#d8e0ea] py-4" aria-labelledby="readiness-title">
          <h2 id="readiness-title" className="text-base font-bold text-[#18202b]">계산 범위</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-[#697587]">현재 화면은 자산, 부채, 월 현금흐름, 대출 조건을 반영합니다. 대출 원금은 부채 카테고리에 등록할 때만 순자산에서 차감됩니다. 세액공제와 환급의 실제 결과는 홈택스 자료로 확인해야 합니다.</p>
        </section>
      </div>
    </section>
  );
}
