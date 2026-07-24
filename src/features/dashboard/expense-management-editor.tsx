"use client";

import { Copy, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MoneyInput } from "../../components/money-input";
import {
  calculateMonthlyExpenseEquivalent,
  expenseCategories,
  type ExpenseFrequency,
  type ExpenseItem,
  type ExpenseKind,
} from "./expense-management-model";

type Props = {
  value: ExpenseItem[];
  onChange: (value: ExpenseItem[]) => void;
};

const kinds: Array<{ id: ExpenseKind; label: string }> = [
  { id: "fixed", label: "고정비" },
  { id: "living", label: "생활비" },
  { id: "irregular", label: "비정기" },
];

const frequencies: Array<{ id: ExpenseFrequency; label: string }> = [
  { id: "weekly", label: "매주" },
  { id: "monthly", label: "매월" },
  { id: "quarterly", label: "분기" },
  { id: "annual", label: "매년" },
  { id: "one-time", label: "일회성" },
];

const inputClass = "min-h-11 w-full rounded-lg border border-[var(--wallet-line)] bg-[var(--wallet-surface)] px-3 text-base font-semibold text-[var(--wallet-ink)] outline-none focus-visible:border-[var(--wallet-primary)] focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary-soft)]";
const maximumExpenseAmount = 1_000_000_000_000;

function newId() {
  return `expense-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatWon(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(value))}원`;
}

function formatShortWon(value: number) {
  const rounded = Math.round(value);
  const absolute = Math.abs(rounded);
  const sign = rounded < 0 ? "-" : "";
  if (absolute >= 100_000_000) return `${sign}${(absolute / 100_000_000).toFixed(1).replace(/\.0$/, "")}억`;
  return `${sign}${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(absolute / 10_000)}만`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-[var(--wallet-ink)]" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

export function ExpenseManagementEditor({ value, onChange }: Props) {
  const [kind, setKind] = useState<ExpenseKind>("fixed");
  const [selectedId, setSelectedId] = useState<string | null>(() => value.find((item) => item.kind === "fixed")?.id ?? null);
  const [removed, setRemoved] = useState<{ item: ExpenseItem; index: number } | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const undoButtonRef = useRef<HTMLButtonElement>(null);
  const focusNameRef = useRef(false);
  const scrollEditorRef = useRef(false);

  const visibleItems = value.filter((item) => item.kind === kind);
  const selected = value.find((item) => item.id === selectedId && item.kind === kind) ?? visibleItems[0];
  const [nameDraft, setNameDraft] = useState(selected?.name ?? "");
  const [startDateDraft, setStartDateDraft] = useState(selected?.startDate ?? "");
  const [endDateDraft, setEndDateDraft] = useState(selected?.endDate ?? "");
  const [paymentDayDraft, setPaymentDayDraft] = useState(selected?.paymentDay?.toString() ?? "");
  const [noteDraft, setNoteDraft] = useState(selected?.note ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [startDateError, setStartDateError] = useState<string | null>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null);
  const [paymentDayError, setPaymentDayError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const visibleCategories = expenseCategories.filter((category) => category.kind === kind);
  const groupedItems = useMemo(() => visibleCategories.map((category) => ({
    ...category,
    items: visibleItems.filter((item) => item.categoryId === category.id),
  })).filter((category) => category.items.length > 0), [visibleCategories, visibleItems]);
  const monthlyTotal = useMemo(() => value.reduce((sum, item) => sum + calculateMonthlyExpenseEquivalent(item), 0), [value]);

  useEffect(() => {
    if (!focusNameRef.current) return;
    focusNameRef.current = false;
    nameInputRef.current?.focus();
    if (scrollEditorRef.current) {
      scrollEditorRef.current = false;
      editorPanelRef.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
    }
  }, [selected?.id]);

  useEffect(() => {
    setNameDraft(selected?.name ?? "");
    setStartDateDraft(selected?.startDate ?? "");
    setEndDateDraft(selected?.endDate ?? "");
    setPaymentDayDraft(selected?.paymentDay?.toString() ?? "");
    setNoteDraft(selected?.note ?? "");
    setNameError(null);
    setStartDateError(null);
    setEndDateError(null);
    setPaymentDayError(null);
    setNoteError(null);
  }, [selected?.id, selected?.name, selected?.startDate, selected?.endDate, selected?.paymentDay, selected?.note]);

  const selectKind = (nextKind: ExpenseKind) => {
    setKind(nextKind);
    setSelectedId(value.find((item) => item.kind === nextKind)?.id ?? null);
  };

  const selectItem = (id: string) => {
    if (window.innerWidth < 1024) {
      if (selected?.id === id) {
        nameInputRef.current?.focus();
        editorPanelRef.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
        return;
      }
      focusNameRef.current = true;
      scrollEditorRef.current = true;
    }
    setSelectedId(id);
  };

  const updateSelected = (patch: Partial<ExpenseItem>) => {
    if (!selected) return;
    onChange(value.map((item) => item.id === selected.id ? { ...item, ...patch } : item));
  };

  const commitName = () => {
    const name = nameDraft.trim();
    const error = !name ? "지출 이름을 입력해 주세요." : name.length > 80 ? "지출 이름은 80자 이하여야 합니다." : null;
    setNameError(error);
    if (!error && name !== selected?.name) updateSelected({ name });
  };

  const commitStartDate = () => {
    const error = !/^\d{4}-\d{2}-\d{2}$/.test(startDateDraft)
      ? "시작일을 입력해 주세요."
      : selected?.endDate && startDateDraft > selected.endDate ? "시작일은 종료일보다 늦을 수 없습니다." : null;
    setStartDateError(error);
    if (!error && startDateDraft !== selected?.startDate) updateSelected({ startDate: startDateDraft });
  };

  const commitEndDate = () => {
    const error = endDateDraft && (!/^\d{4}-\d{2}-\d{2}$/.test(endDateDraft) || endDateDraft < (selected?.startDate ?? ""))
      ? "종료일은 시작일보다 빠를 수 없습니다." : null;
    setEndDateError(error);
    if (!error && endDateDraft !== (selected?.endDate ?? "")) updateSelected({ endDate: endDateDraft || undefined });
  };

  const commitPaymentDay = () => {
    const paymentDay = Number(paymentDayDraft);
    const error = paymentDayDraft && (!Number.isInteger(paymentDay) || paymentDay < 1 || paymentDay > 31)
      ? "결제일은 1일부터 31일 사이여야 합니다." : null;
    setPaymentDayError(error);
    if (!error && paymentDay !== selected?.paymentDay) updateSelected({ paymentDay: paymentDayDraft ? paymentDay : undefined });
  };

  const commitNote = () => {
    const error = noteDraft.length > 500 ? "메모는 500자 이하여야 합니다." : null;
    setNoteError(error);
    if (!error && noteDraft !== (selected?.note ?? "")) updateSelected({ note: noteDraft || undefined });
  };

  const addItem = () => {
    const item: ExpenseItem = {
      id: newId(),
      name: `새 ${kinds.find((entry) => entry.id === kind)?.label ?? "지출"}`,
      kind,
      categoryId: visibleCategories[0].id,
      amount: 0,
      frequency: "monthly",
      startDate: today(),
      autoRenewal: false,
    };
    focusNameRef.current = true;
    setSelectedId(item.id);
    onChange([...value, item]);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const suffix = " 복사본";
    const copy = { ...selected, id: newId(), name: `${selected.name.slice(0, 80 - suffix.length)}${suffix}` };
    focusNameRef.current = true;
    setSelectedId(copy.id);
    onChange([...value, copy]);
  };

  const deleteSelected = () => {
    if (!selected) return;
    const index = value.findIndex((item) => item.id === selected.id);
    const next = value.filter((item) => item.id !== selected.id);
    setRemoved({ item: selected, index });
    setSelectedId(next.find((item) => item.kind === kind)?.id ?? null);
    onChange(next);
    requestAnimationFrame(() => undoButtonRef.current?.focus());
  };

  const undoDelete = () => {
    if (!removed) return;
    const restored = [...value];
    restored.splice(removed.index, 0, removed.item);
    focusNameRef.current = true;
    setKind(removed.item.kind);
    setSelectedId(removed.item.id);
    setRemoved(null);
    onChange(restored);
  };

  return (
    <section aria-label="지출 관리" className="overflow-hidden rounded-[22px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] shadow-[var(--wallet-shadow)]">
      <div className="border-b border-[var(--wallet-line)] px-4 py-4 sm:px-5">
        <h2 className="text-lg font-black text-[var(--wallet-ink)]">지출 관리</h2>
        <p aria-live="polite" className="sr-only" data-testid="expense-total-announcement">월 환산 지출 합계 {formatWon(monthlyTotal)}</p>
      </div>

      <div aria-label="지출 종류" className="grid grid-cols-3 bg-[var(--wallet-surface-tint)] p-1.5" role="tablist">
        {kinds.map((tab, index) => {
          const subtotal = value.filter((item) => item.kind === tab.id).reduce((sum, item) => sum + calculateMonthlyExpenseEquivalent(item), 0);
          return (
            <button
              aria-controls={`expense-${tab.id}-panel`}
              aria-selected={kind === tab.id}
              className={`min-h-11 rounded-lg px-2 py-1 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)] ${kind === tab.id ? "bg-[var(--wallet-surface)] text-[var(--wallet-ink)] shadow-sm" : "text-[var(--wallet-muted)]"}`}
              id={`expense-${tab.id}-tab`}
              key={tab.id}
              onClick={() => selectKind(tab.id)}
              onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? kinds.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + kinds.length) % kinds.length;
                selectKind(kinds[nextIndex].id);
                const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]");
                tabs?.[nextIndex]?.focus();
              }}
              role="tab"
              tabIndex={kind === tab.id ? 0 : -1}
              type="button"
            >
              <span className="block">{tab.label}</span>
              <span className="block text-xs tabular-nums text-[var(--wallet-muted)]">{formatShortWon(subtotal)}</span>
            </button>
          );
        })}
      </div>

      <div aria-labelledby={`expense-${kind}-tab`} className="grid gap-0 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]" id={`expense-${kind}-panel`} role="tabpanel">
        <div className="border-b border-[var(--wallet-line)] p-4 lg:border-b-0 lg:border-r sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-[var(--wallet-ink)]">{kinds.find((entry) => entry.id === kind)?.label} 목록</h3>
            <button aria-label={`${kinds.find((entry) => entry.id === kind)?.label} 추가`} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[var(--wallet-primary)] px-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)] focus-visible:ring-offset-2" onClick={addItem} type="button"><Plus aria-hidden="true" className="size-4" />추가</button>
          </div>
          {visibleItems.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-[var(--wallet-muted)]">등록된 {kinds.find((entry) => entry.id === kind)?.label}가 없어요</p>
              <button className="mt-3 min-h-11 rounded-lg px-3 text-sm font-bold text-[var(--wallet-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]" onClick={addItem} type="button">첫 {kinds.find((entry) => entry.id === kind)?.label} 추가</button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedItems.map((category) => (
                <section aria-label={category.name} key={category.id}>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-[var(--wallet-muted)]"><h4>{category.name}</h4><span className="tabular-nums">{formatWon(category.items.reduce((sum, item) => sum + calculateMonthlyExpenseEquivalent(item), 0))}</span></div>
                  <div className="grid gap-2">
                    {category.items.map((item) => {
                      const monthly = calculateMonthlyExpenseEquivalent(item);
                      return (
                        <button aria-label={`${item.name} 선택`} aria-pressed={selected?.id === item.id} className={`flex min-h-[4.5rem] w-full min-w-0 items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition-[background-color,border-color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)] ${selected?.id === item.id ? "border-[var(--wallet-primary)] bg-[var(--wallet-primary-soft)]" : "border-[var(--wallet-line)] bg-[var(--wallet-surface)] hover:border-[var(--wallet-primary-soft)] hover:bg-[var(--wallet-surface-tint)]"}`} key={item.id} onClick={() => selectItem(item.id)} type="button">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black text-[var(--wallet-ink)]">{item.name}</span>
                            <span className="mt-1 block text-xs font-bold text-[var(--wallet-muted)]">{frequencies.find((frequency) => frequency.id === item.frequency)?.label ?? "반복"} · {item.paymentDay ? `${item.paymentDay}일` : item.autoRenewal ? "자동 갱신" : "직접 관리"}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            <strong className="block text-sm font-black tabular-nums text-[var(--wallet-ink)]">{formatShortWon(monthly)}</strong>
                            <span className="mt-1 block text-[11px] font-bold tabular-nums text-[var(--wallet-muted)]">{formatWon(monthly)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          {selected && (
            <div className="scroll-mt-32 space-y-5" data-testid="expense-editor-panel" ref={editorPanelRef}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field htmlFor={`expense-name-${selected.id}`} label="지출 이름"><input aria-invalid={Boolean(nameError)} aria-describedby={nameError ? `expense-name-error-${selected.id}` : undefined} autoComplete="off" className={inputClass} id={`expense-name-${selected.id}`} maxLength={80} name="expenseName" onBlur={commitName} onChange={(event) => { setNameDraft(event.target.value); setNameError(null); }} ref={nameInputRef} required value={nameDraft} />{nameError && <p className="text-sm font-semibold text-rose-700" id={`expense-name-error-${selected.id}`}>{nameError}</p>}</Field>
                <Field htmlFor={`expense-category-${selected.id}`} label="카테고리"><select autoComplete="off" className={inputClass} id={`expense-category-${selected.id}`} name="expenseCategory" value={selected.categoryId} onChange={(event) => updateSelected({ categoryId: event.target.value })}>{visibleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
              </div>
              <MoneyInput id={`expense-amount-${selected.id}`} label="금액" onChange={(amount) => updateSelected({ amount: Math.max(0, Math.min(maximumExpenseAmount, amount)) })} quickAmountsManwon={[1, 5, 10, 50]} value={selected.amount} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field htmlFor={`expense-frequency-${selected.id}`} label="반복 주기"><select autoComplete="off" className={inputClass} id={`expense-frequency-${selected.id}`} name="expenseFrequency" value={selected.frequency} onChange={(event) => updateSelected({ frequency: event.target.value as ExpenseFrequency })}>{frequencies.map((frequency) => <option key={frequency.id} value={frequency.id}>{frequency.label}</option>)}</select></Field>
                {selected.frequency === "monthly" ? <Field htmlFor={`expense-payment-day-${selected.id}`} label="결제일"><input aria-invalid={Boolean(paymentDayError)} aria-describedby={paymentDayError ? `expense-payment-day-error-${selected.id}` : undefined} aria-label="결제일" autoComplete="off" className={inputClass} id={`expense-payment-day-${selected.id}`} max={31} min={1} name="expensePaymentDay" onBlur={commitPaymentDay} onChange={(event) => { setPaymentDayDraft(event.target.value); setPaymentDayError(null); }} type="number" value={paymentDayDraft} />{paymentDayError && <p className="text-sm font-semibold text-rose-700" id={`expense-payment-day-error-${selected.id}`}>{paymentDayError}</p>}</Field> : <Field htmlFor={`expense-next-date-${selected.id}`} label={selected.frequency === "one-time" ? "지출 예정일" : "다음 결제일"}><input autoComplete="off" className={inputClass} id={`expense-next-date-${selected.id}`} name="expenseNextPaymentDate" type="date" value={selected.nextPaymentDate ?? ""} onChange={(event) => updateSelected({ nextPaymentDate: event.target.value || undefined })} /></Field>}
                <Field htmlFor={`expense-start-${selected.id}`} label="시작일"><input aria-invalid={Boolean(startDateError)} aria-describedby={startDateError ? `expense-start-error-${selected.id}` : undefined} autoComplete="off" className={inputClass} id={`expense-start-${selected.id}`} name="expenseStartDate" onBlur={commitStartDate} onChange={(event) => { setStartDateDraft(event.target.value); setStartDateError(null); }} required type="date" value={startDateDraft} />{startDateError && <p className="text-sm font-semibold text-rose-700" id={`expense-start-error-${selected.id}`}>{startDateError}</p>}</Field>
                <Field htmlFor={`expense-end-${selected.id}`} label="종료일"><input aria-invalid={Boolean(endDateError)} aria-describedby={endDateError ? `expense-end-error-${selected.id}` : undefined} autoComplete="off" className={inputClass} id={`expense-end-${selected.id}`} name="expenseEndDate" onBlur={commitEndDate} onChange={(event) => { setEndDateDraft(event.target.value); setEndDateError(null); }} type="date" value={endDateDraft} />{endDateError && <p className="text-sm font-semibold text-rose-700" id={`expense-end-error-${selected.id}`}>{endDateError}</p>}</Field>
              </div>
              {selected.frequency !== "one-time" && <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold text-[var(--wallet-ink)]"><input autoComplete="off" checked={selected.autoRenewal} className="size-5 accent-[var(--wallet-primary)]" name="expenseAutoRenewal" onChange={(event) => updateSelected({ autoRenewal: event.target.checked })} type="checkbox" />자동 갱신</label>}
              <Field htmlFor={`expense-note-${selected.id}`} label="메모"><textarea aria-invalid={Boolean(noteError)} aria-describedby={noteError ? `expense-note-error-${selected.id}` : undefined} autoComplete="off" className={`${inputClass} min-h-24 py-3`} id={`expense-note-${selected.id}`} maxLength={500} name="expenseNote" onBlur={commitNote} onChange={(event) => { setNoteDraft(event.target.value); setNoteError(null); }} value={noteDraft} />{noteError && <p className="text-sm font-semibold text-rose-700" id={`expense-note-error-${selected.id}`}>{noteError}</p>}</Field>
              <div className="flex flex-col gap-2 border-t border-[var(--wallet-line)] pt-4 sm:flex-row">
                <button aria-label="선택한 지출 복제" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-bold text-[var(--wallet-primary-strong)] hover:bg-[var(--wallet-primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]" onClick={duplicateSelected} type="button"><Copy aria-hidden="true" className="size-4" />복제</button>
                <button aria-label="선택한 지출 삭제" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-bold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600" onClick={deleteSelected} type="button"><Trash2 aria-hidden="true" className="size-4" />삭제</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {removed && <div aria-live="polite" className="flex min-h-14 items-center justify-between gap-3 border-t border-[var(--wallet-line)] bg-[var(--wallet-surface-tint)] px-4 py-2 text-sm font-semibold text-[var(--wallet-ink)]" role="status"><span>{removed.item.name}을 삭제했습니다.</span><button aria-label={`${removed.item.name} 삭제 되돌리기`} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-bold text-[var(--wallet-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]" onClick={undoDelete} ref={undoButtonRef} type="button"><RotateCcw aria-hidden="true" className="size-4" />되돌리기</button></div>}
    </section>
  );
}
