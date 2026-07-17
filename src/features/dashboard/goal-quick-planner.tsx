"use client";

import { useMemo, useState } from "react";
import { calculateLoanImpact, calculateMonthsToGoal } from "@/lib/calculators";

const goalAmount = 100_000_000;
const manWon = 10_000;

type MoneyAddButton = {
  label: string;
  valueMan: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatMaybeCurrency(value: number | null) {
  return value === null ? "확인 필요" : `${formatCurrency(value)}원`;
}

function formatSignedCurrency(value: number) {
  return `${value < 0 ? "-" : ""}${formatCurrency(Math.abs(value))}원`;
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
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toStrictNumber(value: string) {
  if (value.trim() === "") {
    return Number.NaN;
  }

  return Number(value);
}

function toWonFromMan(value: string) {
  return toNumber(value) * manWon;
}

function sanitizeNumericInput(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
}

function sanitizeSignedNumericInput(value: string) {
  const isNegative = value.trim().startsWith("-");
  const digits = value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");

  return `${isNegative ? "-" : ""}${digits}`;
}

function sanitizeDecimalInput(value: string) {
  const cleaned = value.replace(/[^\d.-]/g, "");
  const [integerPart, ...decimalParts] = cleaned.split(".");
  return decimalParts.length === 0 ? integerPart : `${integerPart}.${decimalParts.join("")}`;
}

function formatInputNumber(value: string) {
  if (value === "") {
    return "";
  }

  if (value === "-") {
    return "-";
  }

  return formatCurrency(toNumber(value));
}

function updateByStep(value: string, step: number, allowNegative: boolean) {
  const nextValue = toNumber(value) + step;
  return String(allowNegative ? nextValue : Math.max(0, nextValue));
}

function addMoney(value: string, amountMan: number, allowNegative: boolean) {
  const nextValue = toNumber(value) + amountMan;
  return String(allowNegative ? nextValue : Math.max(0, nextValue));
}

function MoneyInput({
  addButtons,
  allowNegative = false,
  category,
  description,
  label,
  name,
  onChange,
  step,
  value,
}: {
  addButtons: MoneyAddButton[];
  allowNegative?: boolean;
  category: string;
  description: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  step: number;
  value: string;
}) {
  const [adjustMode, setAdjustMode] = useState<"add" | "subtract">("add");
  const numericValue = toNumber(value);
  const wonValue = numericValue * manWon;

  return (
    <div className="min-w-0 rounded-lg border border-[#dbe3ef] bg-white p-4 shadow-[0_10px_30px_rgba(31,41,55,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <label className="text-sm font-black text-[#111827]" htmlFor={name}>
            {label}
          </label>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#6b7280]">{description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#eef6ff] px-2.5 py-1 text-xs font-black text-[#2563eb]">
          {category}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center rounded-lg border border-[#dbe3ef] bg-[#f8fbff] focus-within:border-[#2f6fed] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#dbeafe]">
        <button
          aria-label={`${label} ${formatManWon(step)} 줄이기`}
          className="flex h-12 items-center justify-center rounded-l-lg text-lg font-black text-[#2563eb] transition active:scale-95"
          onClick={() => onChange(updateByStep(value, -step, allowNegative))}
          type="button"
        >
          -
        </button>
        <div className="flex min-w-0 items-center justify-end px-2">
          <input
            aria-label={label}
            className="min-w-0 flex-1 bg-transparent text-right text-2xl font-black tabular-nums text-[#111827] outline-none"
            id={name}
            inputMode={allowNegative ? "text" : "numeric"}
            name={name}
            onChange={(event) =>
              onChange(
                allowNegative
                  ? sanitizeSignedNumericInput(event.target.value)
                  : sanitizeNumericInput(event.target.value),
              )
            }
            pattern={allowNegative ? "-?[0-9,]*" : "[0-9,]*"}
            placeholder="0"
            type="text"
            value={formatInputNumber(value)}
          />
          <span className="ml-1 text-sm font-black text-[#6b7280]">만원</span>
        </div>
        <button
          aria-label={`${label} ${formatManWon(step)} 늘리기`}
          className="flex h-12 items-center justify-center rounded-r-lg text-lg font-black text-[#2563eb] transition active:scale-95"
          onClick={() => onChange(updateByStep(value, step, allowNegative))}
          type="button"
        >
          +
        </button>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <div className="grid grid-cols-2 rounded-lg bg-[#eef3f8] p-1">
          {[
            { label: "더하기", value: "add" as const },
            { label: "빼기", value: "subtract" as const },
          ].map((mode) => (
            <button
              aria-pressed={adjustMode === mode.value}
              className={`min-h-9 rounded-md text-xs font-black transition active:scale-[0.98] ${
                adjustMode === mode.value ? "bg-white text-[#111827] shadow-sm" : "text-[#6b7280]"
              }`}
              key={mode.value}
              onClick={() => setAdjustMode(mode.value)}
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>
        <button
          aria-label={`${label} 지우기`}
          className="min-h-9 rounded-lg border border-[#dbe3ef] bg-white px-3 text-xs font-black text-[#6b7280] transition hover:border-[#2563eb] hover:text-[#2563eb] active:scale-[0.98]"
          onClick={() => onChange("0")}
          type="button"
        >
          지우기
        </button>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {addButtons.map((button) => (
          <button
            className="min-h-10 shrink-0 rounded-full border border-[#dbe3ef] bg-[#f8fbff] px-3 text-xs font-black text-[#374151] transition hover:border-[#2563eb] hover:bg-[#eef6ff] hover:text-[#2563eb] active:scale-[0.98]"
            key={button.label}
            onClick={() => onChange(addMoney(value, adjustMode === "add" ? button.valueMan : -button.valueMan, allowNegative))}
            type="button"
          >
            {adjustMode === "add" ? "+" : "-"}
            {button.label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-right text-xs font-bold text-[#6b7280]" aria-live="polite">
        {wonValue === 0 ? "0원" : formatSignedCurrency(wonValue)}
      </p>
    </div>
  );
}

export function GoalQuickPlanner() {
  const [currentAmountMan, setCurrentAmountMan] = useState("1000");
  const [monthlyContributionMan, setMonthlyContributionMan] = useState("100");
  const [annualReturnPercent, setAnnualReturnPercent] = useState("0");
  const [loanPrincipalMan, setLoanPrincipalMan] = useState("3000");
  const [loanAnnualRatePercent, setLoanAnnualRatePercent] = useState("4.5");
  const [loanTermMonths, setLoanTermMonths] = useState("60");

  const annualReturnValue = toNumber(annualReturnPercent);
  const currentAmountWon = toWonFromMan(currentAmountMan);
  const monthlyContributionWon = toWonFromMan(monthlyContributionMan);
  const loanPrincipalWon = toWonFromMan(loanPrincipalMan);
  const loanRateValue = toStrictNumber(loanAnnualRatePercent);
  const loanTermValue = toStrictNumber(loanTermMonths);
  const hasHighReturnAssumption = annualReturnValue > 20;

  const result = useMemo(() => {
    return calculateMonthsToGoal({
      currentAmount: currentAmountWon,
      goalAmount,
      monthlyContribution: monthlyContributionWon,
      annualReturnRate: annualReturnValue / 100,
    });
  }, [annualReturnValue, currentAmountWon, monthlyContributionWon]);

  const loanImpact = useMemo(() => {
    return calculateLoanImpact({
      principal: loanPrincipalWon,
      annualInterestRate: loanRateValue / 100,
      remainingTermMonths: loanTermValue,
      currentAmount: currentAmountWon,
      goalAmount,
      baselineMonthlyContribution: monthlyContributionWon,
      annualReturnRate: annualReturnValue / 100,
    });
  }, [annualReturnValue, currentAmountWon, loanPrincipalWon, loanRateValue, loanTermValue, monthlyContributionWon]);

  const failureMessage =
    result.reason === "invalid-return-rate"
      ? "연 수익률은 -100%에서 50% 사이로 입력해 주세요."
      : result.reason === "max-months-exceeded"
        ? "현재 가정으로는 100년 안에 목표에 도달하지 못합니다."
        : "현재 조건으로는 목표 달성이 어렵습니다";
  const isInvalidReturnRate = result.reason === "invalid-return-rate";
  const returnHelpId = "annual-return-help";
  const returnErrorId = "annual-return-error";
  const loanMonthlyPayment = loanImpact.totalMonthlyLoanPayment;
  const changedMonthlyContribution = loanImpact.changedMonthlyContribution;
  const loanDelayMonths = loanImpact.monthsDelayed;
  const loanInputUnavailable =
    loanImpact.status === "unavailable" &&
    [
      "invalid-number",
      "negative-amount",
      "non-integer-krw",
      "invalid-loan-rate",
      "invalid-term",
      "payment-does-not-cover-interest",
    ].includes(loanImpact.reason ?? "");
  const loanErrorMessage =
    loanImpact.reason === "invalid-number"
      ? "대출 금리와 남은 기간을 숫자로 입력해 주세요."
      : loanImpact.reason === "negative-amount"
        ? "대출 원금과 월 저축 가능액은 0원 이상이어야 합니다."
        : loanImpact.reason === "invalid-loan-rate"
          ? "대출 금리는 0%에서 100% 사이로 입력해 주세요."
          : loanImpact.reason === "invalid-term"
            ? "대출 남은 기간은 1개월 이상이어야 합니다."
            : loanImpact.reason === "payment-does-not-cover-interest"
              ? "월 상환액이 이자보다 작아 상환 계산이 어렵습니다."
              : "대출 원금, 금리, 남은 기간을 확인해 주세요.";

  return (
    <section
      className="min-w-0 rounded-lg border border-[#dbe3ef] bg-[#f7fbff]"
      aria-labelledby="goal-quick-planner-title"
    >
      <div className="border-b border-[#dbe3ef] bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-black text-[#2563eb]">목표 계산</p>
            <h2 id="goal-quick-planner-title" className="mt-1 scroll-mt-24 text-xl font-black text-[#111827]">
              1억 플랜 조정
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#6b7280]">
              직접 입력, 더하기, 빼기, 지우기를 카테고리별로 조정합니다.
            </p>
          </div>
          <button
            className="min-h-10 shrink-0 rounded-full border border-[#dbe3ef] bg-white px-3 text-xs font-black text-[#374151] transition hover:border-[#2563eb] hover:text-[#2563eb] active:scale-[0.98]"
            onClick={() => {
              setCurrentAmountMan("1000");
              setMonthlyContributionMan("100");
              setAnnualReturnPercent("0");
              setLoanPrincipalMan("3000");
              setLoanAnnualRatePercent("4.5");
              setLoanTermMonths("60");
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
                  <p className="text-sm font-bold text-[#cbd5e1]">대출 전 목표 기간</p>
                  <p className="mt-2 text-5xl font-black tracking-normal">{result.months}개월</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-[#bfdbfe]">
                  {formatDuration(result.months)}
                </span>
              </div>
              <div className="mt-4 grid gap-2 rounded-lg bg-white/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-[#dbeafe]">상환 중 월 가능액</span>
                  <span className="font-black">{formatMaybeCurrency(changedMonthlyContribution)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-[#dbeafe]">목표 영향</span>
                  <span className="font-black">
                    {loanImpact.status === "available" && loanDelayMonths !== null
                      ? `${loanDelayMonths}개월 지연`
                      : "목표 재조정 필요"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm font-bold text-[#fde68a]">
              {isInvalidReturnRate ? "수익률 입력을 확인해 주세요." : failureMessage}
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-3">
          <MoneyInput
            addButtons={[
              { label: "500만원", valueMan: 500 },
              { label: "1,000만원", valueMan: 1000 },
              { label: "3,000만원", valueMan: 3000 },
            ]}
            allowNegative
            category="순자산"
            description="예금에서 카드값, 마이너스통장, 대출을 뺀 값"
            label="현재 순자산"
            name="currentAmount"
            onChange={setCurrentAmountMan}
            step={100}
            value={currentAmountMan}
          />

          <MoneyInput
            addButtons={[
              { label: "10만원", valueMan: 10 },
              { label: "50만원", valueMan: 50 },
              { label: "100만원", valueMan: 100 },
              { label: "150만원", valueMan: 150 },
            ]}
            category="월 현금흐름"
            description="대출 반영 전 월급일 자동 이체 가능액"
            label="월 저축/투자 가능액"
            name="monthlyContribution"
            onChange={setMonthlyContributionMan}
            step={10}
            value={monthlyContributionMan}
          />

          <div className="min-w-0 rounded-lg border border-[#dbe3ef] bg-white p-4 shadow-[0_10px_30px_rgba(31,41,55,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-[#111827]">대출 상환</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#6b7280]">
                  원리금 균등 상환 기준의 단순 추정입니다.
                </p>
              </div>
              <span className="rounded-full bg-[#fff4de] px-2.5 py-1 text-xs font-black text-[#9a5b00]">
                영향 계산
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <MoneyInput
                addButtons={[
                  { label: "500만원", valueMan: 500 },
                  { label: "1,000만원", valueMan: 1000 },
                  { label: "2,000만원", valueMan: 2000 },
                ]}
                category="부채"
                description="남은 대출 원금"
                label="대출 원금"
                name="loanPrincipal"
                onChange={setLoanPrincipalMan}
                step={100}
                value={loanPrincipalMan}
              />

              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-black text-[#111827]">
                  대출 금리
                  <div className="flex h-12 items-center rounded-lg border border-[#dbe3ef] bg-[#f8fbff] px-3 focus-within:border-[#2563eb] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#dbeafe]">
                    <input
                      aria-label="대출 금리"
                      className="min-w-0 flex-1 bg-transparent text-right text-xl font-black tabular-nums text-[#111827] outline-none"
                      inputMode="decimal"
                      name="loanAnnualRatePercent"
                      onChange={(event) => setLoanAnnualRatePercent(sanitizeDecimalInput(event.target.value))}
                      type="text"
                      value={loanAnnualRatePercent}
                    />
                    <span className="ml-2 text-sm font-black text-[#6b7280]">%</span>
                  </div>
                </label>

                <label className="grid gap-2 text-sm font-black text-[#111827]">
                  남은 기간
                  <div className="flex h-12 items-center rounded-lg border border-[#dbe3ef] bg-[#f8fbff] px-3 focus-within:border-[#2563eb] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#dbeafe]">
                    <input
                      aria-label="대출 남은 기간"
                      className="min-w-0 flex-1 bg-transparent text-right text-xl font-black tabular-nums text-[#111827] outline-none"
                      inputMode="numeric"
                      name="loanTermMonths"
                      onChange={(event) => setLoanTermMonths(sanitizeNumericInput(event.target.value))}
                      type="text"
                      value={formatInputNumber(loanTermMonths)}
                    />
                    <span className="ml-2 text-sm font-black text-[#6b7280]">개월</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-4 grid gap-2 rounded-lg bg-[#f8fbff] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-[#6b7280]">예상 월 상환액</span>
                <span className="font-black text-[#111827]">{formatMaybeCurrency(loanMonthlyPayment)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-[#6b7280]">첫 달 이자</span>
                <span className="font-black text-[#111827]">{formatMaybeCurrency(loanImpact.firstMonthInterest)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-[#6b7280]">총 이자 추정</span>
                <span className="font-black text-[#111827]">{formatMaybeCurrency(loanImpact.totalInterest)}</span>
              </div>
            </div>

            {loanInputUnavailable ? (
              <p className="mt-3 rounded-lg bg-[#fff8e8] px-3 py-2 text-xs font-bold leading-5 text-[#7c5a18]">
                {loanErrorMessage}
              </p>
            ) : null}
          </div>

          <label className="grid gap-2 rounded-lg border border-[#dbe3ef] bg-white p-4 text-sm font-black text-[#111827]">
            연 예상 수익률
            <div className="flex h-12 items-center rounded-lg border border-[#dbe3ef] bg-[#f8fbff] px-3 focus-within:border-[#2563eb] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#dbeafe]">
              <input
                aria-label="연 예상 수익률"
                aria-describedby={`${returnHelpId}${isInvalidReturnRate ? ` ${returnErrorId}` : ""}`}
                aria-invalid={isInvalidReturnRate}
                className="min-w-0 flex-1 bg-transparent text-right text-2xl font-black tabular-nums text-[#111827] outline-none"
                inputMode="decimal"
                name="annualReturnPercent"
                onChange={(event) => setAnnualReturnPercent(sanitizeDecimalInput(event.target.value))}
                type="text"
                value={annualReturnPercent}
              />
              <span className="ml-2 text-sm font-black text-[#6b7280]">%</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["0", "2", "4", "6"].map((value) => (
                <button
                  className="min-h-10 shrink-0 rounded-full border border-[#dbe3ef] bg-[#f8fbff] px-3 text-xs font-black text-[#374151] transition hover:border-[#2563eb] hover:bg-[#eef6ff] hover:text-[#2563eb] active:scale-[0.98]"
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

        <p id={returnHelpId} className="mt-4 text-xs leading-5 text-[#6b7280]">
          입력한 수익률과 대출 조건에 따른 단순 추정이며 실제 수익, 이자, 상환 일정은 보장되지 않습니다.
        </p>
      </div>
    </section>
  );
}
