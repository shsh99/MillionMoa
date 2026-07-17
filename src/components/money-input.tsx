"use client";

import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type MoneyInputProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  quickAmountsManwon?: number[];
  allowNegative?: boolean;
  showPreview?: boolean;
};

const digitNames = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const smallUnits = ["", "십", "백", "천"];
const largeUnits = ["", "만", "억", "조", "경"];
const maxSafeManwon = Math.floor(Number.MAX_SAFE_INTEGER / 10_000);
const maxSafeKrwMultiple = maxSafeManwon * 10_000;

function formatFourDigits(value: number) {
  let result = "";

  for (let place = 3; place >= 0; place -= 1) {
    const divisor = 10 ** place;
    const digit = Math.floor(value / divisor) % 10;
    if (digit === 0) continue;
    if (digit !== 1 || place === 0) result += digitNames[digit];
    result += smallUnits[place];
  }

  return result;
}

export function formatKoreanMoney(value: number) {
  const amount = Math.round(Number.isFinite(value) ? value : 0);
  if (amount === 0) return "영원";

  let remaining = Math.abs(amount);
  const groups: string[] = [];
  let groupIndex = 0;

  while (remaining > 0) {
    const group = remaining % 10_000;
    if (group > 0) groups.unshift(`${formatFourDigits(group)}${largeUnits[groupIndex] ?? `10^${groupIndex * 4}`}`);
    remaining = Math.floor(remaining / 10_000);
    groupIndex += 1;
  }

  return `${amount < 0 ? "마이너스 " : ""}${groups.join("")}원`;
}

function normalizeKrw(value: number, allowNegative: boolean) {
  const finiteValue = Number.isFinite(value) ? value : 0;
  const integer = Math.max(-Number.MAX_SAFE_INTEGER, Math.min(Number.MAX_SAFE_INTEGER, Math.round(finiteValue)));
  return allowNegative ? integer : Math.max(0, integer);
}

function parseManwon(value: string, allowNegative: boolean) {
  const hasLeadingMinus = value.trimStart().startsWith("-");
  const sanitized = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const [wholePart = "0", ...fractionParts] = sanitized.split(".");
  const wholeDigits = wholePart.replace(/\D/g, "") || "0";
  const fractionDigits = fractionParts.join("").slice(0, 4).padEnd(4, "0");
  const exactKrw = BigInt(wholeDigits) * 10_000n + BigInt(fractionDigits || "0");
  const boundedKrw = exactKrw > BigInt(maxSafeKrwMultiple) ? BigInt(maxSafeKrwMultiple) : exactKrw;
  const krw = Number(boundedKrw);
  return normalizeKrw(hasLeadingMinus ? -krw : krw, allowNegative);
}

function formatManwon(value: number) {
  const absolute = Math.abs(value);
  const whole = Math.floor(absolute / 10_000);
  const fraction = String(absolute % 10_000).padStart(4, "0").replace(/0+$/, "");
  return `${value < 0 ? "-" : ""}${new Intl.NumberFormat("ko-KR").format(whole)}${fraction ? `.${fraction}` : ""}`;
}

function boundedQuickAddition(value: number, amountManwon: number, allowNegative: boolean) {
  const nextValue = value + amountManwon * 10_000;
  const bounded = Math.max(-maxSafeKrwMultiple, Math.min(maxSafeKrwMultiple, nextValue));
  return normalizeKrw(bounded, allowNegative);
}

function digitOffset(value: string, characterOffset: number) {
  return (value.slice(0, characterOffset).match(/\d/g) ?? []).length;
}

function characterOffset(
  value: string,
  digitsBeforeCaret: number,
  afterLeadingMinus: boolean,
  afterDecimal: boolean,
) {
  if (afterDecimal) {
    const decimalIndex = value.indexOf(".");
    if (decimalIndex >= 0) {
      const wholeDigits = digitOffset(value, decimalIndex);
      const fractionalDigits = Math.max(0, digitsBeforeCaret - wholeDigits);
      if (fractionalDigits === 0) return decimalIndex + 1;
      let seen = 0;
      for (let index = decimalIndex + 1; index < value.length; index += 1) {
        if (/\d/.test(value[index])) seen += 1;
        if (seen === fractionalDigits) return index + 1;
      }
      return value.length;
    }
  }
  if (digitsBeforeCaret === 0) return afterLeadingMinus && value.startsWith("-") ? 1 : 0;
  let digitsSeen = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) digitsSeen += 1;
    if (digitsSeen === digitsBeforeCaret) return index + 1;
  }
  return value.length;
}

export function MoneyInput({
  id,
  label,
  value,
  onChange,
  quickAmountsManwon = [10, 50, 100, 500],
  allowNegative = false,
  showPreview = true,
}: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<{
    startDigits: number;
    endDigits: number;
    startAfterMinus: boolean;
    endAfterMinus: boolean;
    startAfterDecimal: boolean;
    endAfterDecimal: boolean;
  } | null>(null);
  const [incompleteDraft, setIncompleteDraft] = useState<{
    text: string;
    baseValue: number;
    ownEmittedValue?: number;
    acknowledged: boolean;
  } | null>(null);
  const normalizedValue = normalizeKrw(value, allowNegative);
  const displayValue = formatManwon(normalizedValue);
  const draftMatchesValue = incompleteDraft && (incompleteDraft.acknowledged
    ? normalizedValue === incompleteDraft.ownEmittedValue
    : normalizedValue === incompleteDraft.baseValue || normalizedValue === incompleteDraft.ownEmittedValue);
  const activeDraft = draftMatchesValue ? incompleteDraft : null;
  const renderedValue = activeDraft?.text ?? displayValue;
  const validQuickAmounts = quickAmountsManwon.filter(
    (amount) => Number.isSafeInteger(amount) && amount > 0 && amount <= maxSafeManwon,
  );

  useEffect(() => {
    if (!incompleteDraft) return;
    if (
      !incompleteDraft.acknowledged
      && incompleteDraft.ownEmittedValue !== undefined
      && normalizedValue === incompleteDraft.ownEmittedValue
    ) {
      setIncompleteDraft({ ...incompleteDraft, acknowledged: true });
    } else if (!draftMatchesValue) {
      setIncompleteDraft(null);
    }
  }, [draftMatchesValue, incompleteDraft, normalizedValue]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const selection = selectionRef.current;
    if (input && selection && document.activeElement === input) {
      input.setSelectionRange(
        characterOffset(
          renderedValue,
          selection.startDigits,
          selection.startAfterMinus,
          selection.startAfterDecimal,
        ),
        characterOffset(
          renderedValue,
          selection.endDigits,
          selection.endAfterMinus,
          selection.endAfterDecimal,
        ),
      );
    }
  }, [renderedValue]);

  const rememberSelection = () => {
    const input = inputRef.current;
    if (!input || input.selectionStart === null || input.selectionEnd === null) return;
    selectionRef.current = {
      startDigits: digitOffset(input.value, input.selectionStart),
      endDigits: digitOffset(input.value, input.selectionEnd),
      startAfterMinus: input.value.startsWith("-") && input.selectionStart > 0,
      endAfterMinus: input.value.startsWith("-") && input.selectionEnd > 0,
      startAfterDecimal: input.value.includes(".") && input.selectionStart > input.value.indexOf("."),
      endAfterDecimal: input.value.includes(".") && input.selectionEnd > input.value.indexOf("."),
    };
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-bold text-[var(--wallet-ink)]">
        {label}
      </label>
      <div className="flex min-h-11 items-center rounded-2xl border border-[var(--wallet-line)] bg-[var(--wallet-surface)] px-3 shadow-sm focus-within:border-[var(--wallet-primary)] focus-within:ring-2 focus-within:ring-[var(--wallet-primary-soft)]">
        <input
          ref={inputRef}
          id={id}
          name={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-describedby={`${id}-unit${showPreview ? ` ${id}-preview` : ""}`}
          className="min-h-11 min-w-0 flex-1 bg-transparent text-right text-base font-bold tabular-nums text-[var(--wallet-ink)] outline-none"
          value={renderedValue}
          onChange={(event) => {
            rememberSelection();
            if (event.target.value === "") {
              const emitsZero = normalizedValue !== 0;
              setIncompleteDraft({
                text: "",
                baseValue: normalizedValue,
                ownEmittedValue: emitsZero ? 0 : undefined,
                acknowledged: false,
              });
              if (emitsZero) onChange(0);
              return;
            }
            if (allowNegative && event.target.value === "-") {
              setIncompleteDraft({ text: "-", baseValue: normalizedValue, acknowledged: false });
              return;
            }
            const nextValue = parseManwon(event.target.value, allowNegative);
            const decimalDraftPattern = allowNegative ? /^-?\d[\d,]*\.\d{0,4}$/ : /^\d[\d,]*\.\d{0,4}$/;
            if (decimalDraftPattern.test(event.target.value)) {
              setIncompleteDraft({
                text: event.target.value,
                baseValue: normalizedValue,
                ownEmittedValue: nextValue,
                acknowledged: false,
              });
              if (nextValue !== normalizedValue) onChange(nextValue);
              return;
            }
            setIncompleteDraft(null);
            onChange(nextValue);
          }}
          onSelect={rememberSelection}
        />
        <span id={`${id}-unit`} className="ml-2 text-sm font-semibold text-[var(--wallet-muted)]">만원</span>
        {allowNegative && (
          <button
            type="button"
            aria-label={`${label} 부호 전환`}
            className="ml-1 flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-2xl text-base font-bold text-[var(--wallet-muted)] hover:bg-[var(--wallet-primary-soft)] hover:text-[var(--wallet-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]"
            onClick={() => {
              if (normalizedValue === 0) {
                setIncompleteDraft({
                  text: activeDraft?.text === "-" ? "" : "-",
                  baseValue: 0,
                  acknowledged: false,
                });
                return;
              }
              setIncompleteDraft(null);
              onChange(-normalizedValue);
            }}
          >
            ±
          </button>
        )}
        <button
          type="button"
          aria-label={`${label} 금액 지우기`}
          className="ml-2 flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-2xl text-[var(--wallet-muted)] hover:bg-[var(--wallet-primary-soft)] hover:text-[var(--wallet-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]"
          onClick={() => {
            setIncompleteDraft(null);
            onChange(0);
          }}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      {showPreview && (
        <p id={`${id}-preview`} className="text-right text-sm font-semibold text-[var(--wallet-muted)]" aria-live="polite">
          {formatKoreanMoney(normalizedValue)}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={`${label} 빠른 금액 입력`}>
        {validQuickAmounts.map((amount) => (
          <button
            key={amount}
            type="button"
            aria-label={`${label}에 ${amount}만원 더하기`}
            className="min-h-11 touch-manipulation rounded-2xl bg-[var(--wallet-primary-soft)] px-2 text-sm font-bold tabular-nums text-[var(--wallet-primary-strong)] hover:bg-[var(--wallet-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]"
            onClick={() => {
              setIncompleteDraft(null);
              onChange(boundedQuickAddition(normalizedValue, amount, allowNegative));
            }}
          >
            +{new Intl.NumberFormat("ko-KR").format(amount)}만
          </button>
        ))}
      </div>
    </div>
  );
}
