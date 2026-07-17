"use client";

import { X } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

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
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  const manwon = Number(digits);
  // Direct input is clamped to the largest exact KRW value representable in manwon units.
  const boundedManwon = Number.isSafeInteger(manwon) && manwon <= maxSafeManwon ? manwon : maxSafeManwon;
  const krw = boundedManwon * 10_000;
  if (!Number.isSafeInteger(krw)) return hasLeadingMinus && allowNegative ? -maxSafeKrwMultiple : maxSafeKrwMultiple;
  return normalizeKrw(hasLeadingMinus ? -krw : krw, allowNegative);
}

function digitOffset(value: string, characterOffset: number) {
  return (value.slice(0, characterOffset).match(/\d/g) ?? []).length;
}

function characterOffset(value: string, digitsBeforeCaret: number) {
  if (digitsBeforeCaret === 0) return 0;
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
  const selectionRef = useRef<{ startDigits: number; endDigits: number } | null>(null);
  const normalizedValue = normalizeKrw(value, allowNegative);
  const displayValue = new Intl.NumberFormat("ko-KR").format(normalizedValue / 10_000);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const selection = selectionRef.current;
    if (input && selection && document.activeElement === input) {
      input.setSelectionRange(
        characterOffset(displayValue, selection.startDigits),
        characterOffset(displayValue, selection.endDigits),
      );
    }
  }, [displayValue]);

  const rememberSelection = () => {
    const input = inputRef.current;
    if (!input || input.selectionStart === null || input.selectionEnd === null) return;
    selectionRef.current = {
      startDigits: digitOffset(input.value, input.selectionStart),
      endDigits: digitOffset(input.value, input.selectionEnd),
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
          className="min-w-0 flex-1 bg-transparent text-right text-base font-bold tabular-nums text-[var(--wallet-ink)] outline-none"
          value={displayValue}
          onChange={(event) => {
            rememberSelection();
            onChange(parseManwon(event.target.value, allowNegative));
          }}
          onSelect={rememberSelection}
        />
        <span className="ml-2 text-sm font-semibold text-[var(--wallet-muted)]">만원</span>
        <button
          type="button"
          aria-label={`${label} 금액 지우기`}
          className="ml-2 flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-2xl text-[var(--wallet-muted)] hover:bg-[var(--wallet-primary-soft)] hover:text-[var(--wallet-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]"
          onClick={() => onChange(0)}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      {showPreview && (
        <p className="text-right text-sm font-semibold text-[var(--wallet-muted)]" aria-live="polite">
          {formatKoreanMoney(normalizedValue)}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={`${label} 빠른 금액 입력`}>
        {quickAmountsManwon.map((amount) => (
          <button
            key={amount}
            type="button"
            aria-label={`${label}에 ${amount}만원 더하기`}
            className="min-h-11 touch-manipulation rounded-2xl bg-[var(--wallet-primary-soft)] px-2 text-sm font-bold tabular-nums text-[var(--wallet-primary-strong)] hover:bg-[var(--wallet-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]"
            onClick={() => onChange(normalizeKrw(normalizedValue + amount * 10_000, allowNegative))}
          >
            +{new Intl.NumberFormat("ko-KR").format(amount)}만
          </button>
        ))}
      </div>
    </div>
  );
}
