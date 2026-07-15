"use client";

import { FormEvent, useMemo, useState } from "react";
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

export function GoalQuickPlanner() {
  const [currentAmount, setCurrentAmount] = useState("10000000");
  const [monthlyContribution, setMonthlyContribution] = useState("1000000");
  const [annualReturnPercent, setAnnualReturnPercent] = useState("0");
  const [submitted, setSubmitted] = useState(false);
  const annualReturnValue = Number(annualReturnPercent) || 0;
  const hasHighReturnAssumption = annualReturnValue > 20;

  const result = useMemo(() => {
    return calculateMonthsToGoal({
      currentAmount: Number(currentAmount) || 0,
      goalAmount,
      monthlyContribution: Number(monthlyContribution) || 0,
      annualReturnRate: annualReturnValue / 100,
    });
  }, [annualReturnValue, currentAmount, monthlyContribution]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  const failureMessage =
    result.reason === "invalid-return-rate"
      ? "연 수익률은 -100%에서 50% 사이로 입력해 주세요."
      : result.reason === "max-months-exceeded"
        ? "현재 가정으로는 100년 안에 목표에 도달하지 못합니다."
        : "현재 조건으로는 목표 달성이 어렵습니다";

  return (
    <section
      className="rounded-lg border border-[#d9e3d7] bg-[#fbfdf8] p-5"
      aria-labelledby="goal-quick-planner-title"
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-[#2f7d62]">빠른 시뮬레이션</p>
        <h2 id="goal-quick-planner-title" className="text-xl font-semibold text-[#17201a]">
          1억 달성 계산기
        </h2>
        <p className="text-sm leading-6 text-[#536057]">
          현재 자산과 매달 넣을 수 있는 돈을 입력하면 1억까지 걸리는 기간을 바로
          계산합니다.
        </p>
      </div>

      <form className="mt-5 grid gap-4" noValidate onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-[#17201a]">
          현재 자산 입력
          <input
            aria-label="현재 자산"
            className="h-11 rounded-md border border-[#cfd9ce] bg-white px-3 text-base tabular-nums text-[#17201a]"
            inputMode="numeric"
            min="0"
            name="currentAmount"
            onChange={(event) => setCurrentAmount(event.target.value)}
            type="number"
            value={currentAmount}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#17201a]">
          월 저축/투자 가능액 입력
          <input
            aria-label="월 저축/투자 가능액"
            className="h-11 rounded-md border border-[#cfd9ce] bg-white px-3 text-base tabular-nums text-[#17201a]"
            inputMode="numeric"
            min="0"
            name="monthlyContribution"
            onChange={(event) => setMonthlyContribution(event.target.value)}
            type="number"
            value={monthlyContribution}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#17201a]">
          연 예상 수익률 입력
          <input
            aria-label="연 예상 수익률"
            className="h-11 rounded-md border border-[#cfd9ce] bg-white px-3 text-base tabular-nums text-[#17201a]"
            inputMode="decimal"
            name="annualReturnPercent"
            onChange={(event) => setAnnualReturnPercent(event.target.value)}
            step="0.1"
            min="-100"
            max="50"
            type="number"
            value={annualReturnPercent}
          />
          <span className="text-xs leading-5 text-[#6f6547]">
            입력한 수익률 가정에 따른 단순 추정이며 실제 수익은 보장되지 않습니다.
          </span>
        </label>

        {hasHighReturnAssumption ? (
          <p className="rounded-md bg-[#fff4cf] px-3 py-2 text-xs font-medium leading-5 text-[#725b12]">
            높은 연 수익률 가정은 실제 결과와 크게 달라질 수 있습니다.
          </p>
        ) : null}

        <button
          className="h-11 rounded-md bg-[#17201a] px-4 text-sm font-semibold text-[#fffdf8] hover:bg-[#2f7d62]"
          type="submit"
        >
          1억 달성 시점 계산
        </button>
      </form>

      <div className="mt-5 border-t border-[#d9e3d7] pt-4" aria-live="polite">
        {submitted && result.reached && result.months !== null ? (
          <div>
            <p className="text-sm font-medium text-[#536057]">예상 소요 기간</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-[#17201a]">
              {result.months}개월
            </p>
            <p className="mt-1 text-sm text-[#536057]">{formatDuration(result.months)}</p>
            <p className="mt-2 text-xs leading-5 text-[#536057]">
              현재 자산 {formatCurrency(Number(currentAmount) || 0)}원, 월 납입액{" "}
              {formatCurrency(Number(monthlyContribution) || 0)}원, 연 수익률{" "}
              {annualReturnValue}% 가정 기준입니다.
            </p>
          </div>
        ) : null}

        {submitted && !result.reached ? (
          <p className="text-sm font-semibold text-[#725b12]">{failureMessage}</p>
        ) : null}

        {!submitted ? (
          <p className="text-sm text-[#536057]">
            기본값은 현재 자산 {formatCurrency(10_000_000)}원, 월 저축{" "}
            {formatCurrency(1_000_000)}원입니다.
          </p>
        ) : null}
      </div>
    </section>
  );
}
