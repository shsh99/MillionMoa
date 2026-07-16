"use client";

import { useMemo, useState } from "react";
import { calculateMonthsToGoal } from "@/lib/calculators";

const goalAmount = 100_000_000;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDuration(months: number) {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths}개월`;
  }

  if (remainingMonths === 0) {
    return `${years}년`;
  }

  return `${years}년 ${remainingMonths}개월`;
}

function toNumber(value: string) {
  return Number(value) || 0;
}

export function GoalQuickPlanner() {
  const [currentAmount, setCurrentAmount] = useState("10000000");
  const [monthlyContribution, setMonthlyContribution] = useState("1000000");
  const [annualReturnPercent, setAnnualReturnPercent] = useState("0");
  const annualReturnValue = toNumber(annualReturnPercent);
  const hasHighReturnAssumption = annualReturnValue > 20;

  const result = useMemo(() => {
    return calculateMonthsToGoal({
      currentAmount: toNumber(currentAmount),
      goalAmount,
      monthlyContribution: toNumber(monthlyContribution),
      annualReturnRate: annualReturnValue / 100,
    });
  }, [annualReturnValue, currentAmount, monthlyContribution]);

  const failureMessage =
    result.reason === "invalid-return-rate"
      ? "연 수익률은 -100%에서 50% 사이로 입력해 주세요."
      : result.reason === "max-months-exceeded"
        ? "현재 가정으로는 100년 안에 목표에 도달하지 못합니다."
        : "현재 조건으로는 목표 달성이 어렵습니다";
  const isInvalidReturnRate = result.reason === "invalid-return-rate";
  const returnHelpId = "annual-return-help";
  const returnErrorId = "annual-return-error";

  return (
    <section
      className="rounded-lg border border-[#e7ebf0] bg-white p-5"
      aria-labelledby="goal-quick-planner-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#2563eb]">빠른 계산</p>
          <h2 id="goal-quick-planner-title" className="mt-1 text-xl font-black text-[#111827]">
            1억 달성 계산기
          </h2>
        </div>
        <span className="rounded-md bg-[#eef4ff] px-3 py-1 text-xs font-bold text-[#2563eb]">
          자동 반영
        </span>
      </div>

      <div className="mt-5 rounded-lg bg-[#111827] p-4 text-white" aria-live="polite">
        {result.reached && result.months !== null ? (
          <>
            <p className="text-sm font-semibold text-[#cbd5e1]">예상 소요 기간</p>
            <p className="mt-2 text-4xl font-black">{result.months}개월</p>
            <p className="mt-1 text-sm font-semibold text-[#93c5fd]">{formatDuration(result.months)}</p>
          </>
        ) : (
          <p className="text-sm font-bold text-[#fde68a]">
            {isInvalidReturnRate ? "수익률 입력을 확인해 주세요." : failureMessage}
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-3">
        <label className="grid gap-2 text-sm font-bold text-[#111827]">
          현재 자산
          <div className="flex h-12 items-center rounded-lg border border-[#e7ebf0] bg-[#f9fafb] px-3 focus-within:border-[#2563eb] focus-within:bg-white">
            <input
              aria-label="현재 자산"
              className="min-w-0 flex-1 bg-transparent text-right text-base font-bold tabular-nums text-[#111827] outline-none"
              inputMode="numeric"
              min="0"
              name="currentAmount"
              onChange={(event) => setCurrentAmount(event.target.value)}
              type="number"
              value={currentAmount}
            />
            <span className="ml-2 text-sm font-bold text-[#687385]">원</span>
          </div>
        </label>

        <label className="grid gap-2 text-sm font-bold text-[#111827]">
          월 저축/투자 가능액
          <div className="flex h-12 items-center rounded-lg border border-[#e7ebf0] bg-[#f9fafb] px-3 focus-within:border-[#2563eb] focus-within:bg-white">
            <input
              aria-label="월 저축/투자 가능액"
              className="min-w-0 flex-1 bg-transparent text-right text-base font-bold tabular-nums text-[#111827] outline-none"
              inputMode="numeric"
              min="0"
              name="monthlyContribution"
              onChange={(event) => setMonthlyContribution(event.target.value)}
              type="number"
              value={monthlyContribution}
            />
            <span className="ml-2 text-sm font-bold text-[#687385]">원</span>
          </div>
        </label>

        <label className="grid gap-2 text-sm font-bold text-[#111827]">
          연 예상 수익률
          <div className="flex h-12 items-center rounded-lg border border-[#e7ebf0] bg-[#f9fafb] px-3 focus-within:border-[#2563eb] focus-within:bg-white">
            <input
              aria-label="연 예상 수익률"
              aria-describedby={`${returnHelpId}${isInvalidReturnRate ? ` ${returnErrorId}` : ""}`}
              aria-invalid={isInvalidReturnRate}
              className="min-w-0 flex-1 bg-transparent text-right text-base font-bold tabular-nums text-[#111827] outline-none"
              inputMode="decimal"
              name="annualReturnPercent"
              onChange={(event) => setAnnualReturnPercent(event.target.value)}
              step="0.1"
              min="-100"
              max="50"
              type="number"
              value={annualReturnPercent}
            />
            <span className="ml-2 text-sm font-bold text-[#687385]">%</span>
          </div>
        </label>

        {isInvalidReturnRate ? (
          <p id={returnErrorId} className="rounded-lg bg-[#fff8e8] px-3 py-2 text-xs font-bold leading-5 text-[#7c5a18]">
            {failureMessage}
          </p>
        ) : null}

        {hasHighReturnAssumption ? (
          <p className="rounded-lg bg-[#fff8e8] px-3 py-2 text-xs font-bold leading-5 text-[#7c5a18]">
            높은 연 수익률 가정은 실제 결과와 크게 달라질 수 있습니다.
          </p>
        ) : null}
      </div>

      <p id={returnHelpId} className="mt-4 text-xs leading-5 text-[#687385]">
        입력한 수익률 가정에 따른 단순 추정이며 실제 수익은 보장되지 않습니다.
      </p>

      {result.reached && result.months !== null ? (
        <p className="mt-3 text-xs leading-5 text-[#687385]">
          현재 자산 {formatCurrency(toNumber(currentAmount))}원, 월 납입액{" "}
          {formatCurrency(toNumber(monthlyContribution))}원, 연 수익률 {annualReturnValue}% 가정
          기준입니다.
        </p>
      ) : null}
    </section>
  );
}
