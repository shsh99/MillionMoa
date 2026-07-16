"use client";

import { useMemo, useState } from "react";
import { calculateMonthsToGoal } from "@/lib/calculators";

const goalAmount = 100_000_000;
const manWon = 10_000;

type MoneyPreset = {
  label: string;
  valueMan: number;
};

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

function formatManWon(valueMan: number) {
  return `${formatCurrency(valueMan)}만원`;
}

function toNumber(value: string) {
  return Number(value) || 0;
}

function toWonFromMan(value: string) {
  return toNumber(value) * manWon;
}

function sanitizeManWonInput(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
}

function updateByStep(value: string, step: number) {
  return String(Math.max(0, toNumber(value) + step));
}

function MoneyInput({
  description,
  label,
  name,
  onChange,
  presets,
  step,
  value,
}: {
  description: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  presets: MoneyPreset[];
  step: number;
  value: string;
}) {
  const numericValue = toNumber(value);
  const wonValue = numericValue * manWon;

  return (
    <div className="rounded-lg border border-[#d9e0ea] bg-white p-4 shadow-[0_1px_0_rgba(17,24,39,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <label className="text-sm font-black text-[#111827]" htmlFor={name}>
            {label}
          </label>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#687385]">{description}</p>
        </div>
        <span className="shrink-0 rounded-md bg-[#eff6ff] px-2.5 py-1 text-xs font-black text-[#2563eb]">
          만원
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[40px_minmax(0,1fr)_40px] items-center rounded-lg border border-[#d9e0ea] bg-[#f8fafc] focus-within:border-[#2563eb] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#dbeafe]">
        <button
          aria-label={`${label} ${formatManWon(step)} 줄이기`}
          className="flex h-12 items-center justify-center rounded-l-lg text-lg font-black text-[#2563eb] transition active:scale-95"
          onClick={() => onChange(updateByStep(value, -step))}
          type="button"
        >
          -
        </button>
        <div className="flex min-w-0 items-center justify-end px-2">
          <input
            aria-label={label}
            className="min-w-0 flex-1 bg-transparent text-right text-2xl font-black tabular-nums text-[#111827] outline-none"
            id={name}
            inputMode="numeric"
            name={name}
            onChange={(event) => onChange(sanitizeManWonInput(event.target.value))}
            pattern="[0-9]*"
            placeholder="0"
            type="text"
            value={value}
          />
          <span className="ml-1 text-sm font-black text-[#687385]">만원</span>
        </div>
        <button
          aria-label={`${label} ${formatManWon(step)} 늘리기`}
          className="flex h-12 items-center justify-center rounded-r-lg text-lg font-black text-[#2563eb] transition active:scale-95"
          onClick={() => onChange(updateByStep(value, step))}
          type="button"
        >
          +
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            className="rounded-md border border-[#d9e0ea] bg-[#f8fafc] px-3 py-2 text-xs font-black text-[#374151] transition hover:border-[#2563eb] hover:bg-[#eff6ff] hover:text-[#2563eb] active:scale-[0.98]"
            key={preset.label}
            onClick={() => onChange(String(preset.valueMan))}
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-right text-xs font-bold text-[#687385]" aria-live="polite">
        {wonValue > 0 ? `${formatCurrency(wonValue)}원` : "0원"}
      </p>
    </div>
  );
}

export function GoalQuickPlanner() {
  const [currentAmountMan, setCurrentAmountMan] = useState("1000");
  const [monthlyContributionMan, setMonthlyContributionMan] = useState("100");
  const [annualReturnPercent, setAnnualReturnPercent] = useState("0");
  const annualReturnValue = toNumber(annualReturnPercent);
  const currentAmountWon = toWonFromMan(currentAmountMan);
  const monthlyContributionWon = toWonFromMan(monthlyContributionMan);
  const hasHighReturnAssumption = annualReturnValue > 20;

  const result = useMemo(() => {
    return calculateMonthsToGoal({
      currentAmount: currentAmountWon,
      goalAmount,
      monthlyContribution: monthlyContributionWon,
      annualReturnRate: annualReturnValue / 100,
    });
  }, [annualReturnValue, currentAmountWon, monthlyContributionWon]);

  const failureMessage =
    result.reason === "invalid-return-rate"
      ? "연 수익률은 -100%에서 50% 사이로 입력해 주세요."
      : result.reason === "max-months-exceeded"
        ? "현재 가정으로는 100년 안에 목표에 도달하지 못합니다."
        : "현재 조건으로는 목표 달성이 어렵습니다";
  const isInvalidReturnRate = result.reason === "invalid-return-rate";
  const returnHelpId = "annual-return-help";
  const returnErrorId = "annual-return-error";
  const requiredMonthlyMan =
    result.reached && result.months !== null ? Math.ceil(Math.max(0, goalAmount - currentAmountWon) / result.months / manWon) : null;

  return (
    <section
      className="overflow-hidden rounded-lg border border-[#d9e0ea] bg-[#f8fafc]"
      aria-labelledby="goal-quick-planner-title"
    >
      <div className="border-b border-[#d9e0ea] bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-black text-[#2563eb]">빠른 계산</p>
            <h2 id="goal-quick-planner-title" className="mt-1 scroll-mt-24 text-xl font-black text-[#111827]">
              1억 달성 계산기
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#687385]">
              금액은 만원 단위로 입력하고, 계산은 원 단위로 반영됩니다.
            </p>
          </div>
          <button
            className="shrink-0 rounded-md border border-[#d9e0ea] bg-white px-3 py-2 text-xs font-black text-[#374151] transition hover:border-[#2563eb] hover:text-[#2563eb] active:scale-[0.98]"
            onClick={() => {
              setCurrentAmountMan("1000");
              setMonthlyContributionMan("100");
              setAnnualReturnPercent("0");
            }}
            type="button"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="rounded-lg bg-[#111827] p-5 text-white" aria-live="polite">
          {result.reached && result.months !== null ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#cbd5e1]">예상 소요 기간</p>
                  <p className="mt-2 text-5xl font-black tracking-normal">{result.months}개월</p>
                </div>
                <span className="rounded-md bg-white/10 px-3 py-1 text-xs font-black text-[#bfdbfe]">
                  {formatDuration(result.months)}
                </span>
              </div>
              {requiredMonthlyMan !== null ? (
                <p className="mt-4 rounded-md bg-white/10 px-3 py-2 text-sm font-bold text-[#dbeafe]">
                  평균 월 {formatManWon(requiredMonthlyMan)} 수준이면 같은 기간을 유지합니다.
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm font-bold text-[#fde68a]">
              {isInvalidReturnRate ? "수익률 입력을 확인해 주세요." : failureMessage}
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-3">
          <MoneyInput
            description="예: 1,000만원이면 1000만 입력"
            label="현재 자산"
            name="currentAmount"
            onChange={setCurrentAmountMan}
            presets={[
              { label: "500만원", valueMan: 500 },
              { label: "1,000만원", valueMan: 1000 },
              { label: "3,000만원", valueMan: 3000 },
            ]}
            step={100}
            value={currentAmountMan}
          />

          <MoneyInput
            description="월급일에 자동 이체 가능한 금액"
            label="월 저축/투자 가능액"
            name="monthlyContribution"
            onChange={setMonthlyContributionMan}
            presets={[
              { label: "30만원", valueMan: 30 },
              { label: "50만원", valueMan: 50 },
              { label: "100만원", valueMan: 100 },
              { label: "150만원", valueMan: 150 },
            ]}
            step={10}
            value={monthlyContributionMan}
          />

          <label className="grid gap-2 rounded-lg border border-[#d9e0ea] bg-white p-4 text-sm font-black text-[#111827]">
            연 예상 수익률
            <div className="flex h-12 items-center rounded-lg border border-[#d9e0ea] bg-[#f8fafc] px-3 focus-within:border-[#2563eb] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#dbeafe]">
              <input
                aria-label="연 예상 수익률"
                aria-describedby={`${returnHelpId}${isInvalidReturnRate ? ` ${returnErrorId}` : ""}`}
                aria-invalid={isInvalidReturnRate}
                className="min-w-0 flex-1 bg-transparent text-right text-2xl font-black tabular-nums text-[#111827] outline-none"
                inputMode="decimal"
                name="annualReturnPercent"
                onChange={(event) => setAnnualReturnPercent(event.target.value)}
                step="0.1"
                min="-100"
                max="50"
                type="number"
                value={annualReturnPercent}
              />
              <span className="ml-2 text-sm font-black text-[#687385]">%</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["0", "2", "4", "6"].map((value) => (
                <button
                  className="rounded-md border border-[#d9e0ea] bg-[#f8fafc] px-3 py-2 text-xs font-black text-[#374151] transition hover:border-[#2563eb] hover:bg-[#eff6ff] hover:text-[#2563eb] active:scale-[0.98]"
                  key={value}
                  onClick={() => setAnnualReturnPercent(value)}
                  type="button"
                >
                  {value}%
                </button>
              ))}
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
            현재 자산 {formatCurrency(currentAmountWon)}원, 월 납입액 {formatCurrency(monthlyContributionWon)}원,
            연 수익률 {annualReturnValue}% 가정 기준입니다.
          </p>
        ) : null}
      </div>
    </section>
  );
}
