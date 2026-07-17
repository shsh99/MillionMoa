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

function newId() {
  return `expense-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatWon(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(value))}원`;
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
  const undoButtonRef = useRef<HTMLButtonElement>(null);
  const focusNameRef = useRef(false);

  const visibleItems = value.filter((item) => item.kind === kind);
  const selected = value.find((item) => item.id === selectedId && item.kind === kind) ?? visibleItems[0];
  const visibleCategories = expenseCategories.filter((category) => category.kind === kind);
  const groupedItems = useMemo(() => visibleCategories.map((category) => ({
    ...category,
    items: visibleItems.filter((item) => item.categoryId === category.id),
  })).filter((category) => category.items.length > 0), [visibleCategories, visibleItems]);

  useEffect(() => {
    if (!focusNameRef.current) return;
    focusNameRef.current = false;
    nameInputRef.current?.focus();
  }, [selected?.id]);

  const selectKind = (nextKind: ExpenseKind) => {
    setKind(nextKind);
    setSelectedId(value.find((item) => item.kind === nextKind)?.id ?? null);
  };

  const updateSelected = (patch: Partial<ExpenseItem>) => {
    if (!selected) return;
    onChange(value.map((item) => item.id === selected.id ? { ...item, ...patch } : item));
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
    const copy = { ...selected, id: newId(), name: `${selected.name} 복사본` };
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
              <span className="block text-xs tabular-nums text-[var(--wallet-muted)]">{formatWon(subtotal)}</span>
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
                  <div className="divide-y divide-[var(--wallet-line)] border-y border-[var(--wallet-line)]">
                    {category.items.map((item) => <button aria-label={`${item.name} 선택`} aria-pressed={selected?.id === item.id} className={`flex min-h-11 w-full min-w-0 items-center justify-between gap-3 px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--wallet-primary)] ${selected?.id === item.id ? "bg-[var(--wallet-primary-soft)]" : "hover:bg-[var(--wallet-surface-tint)]"}`} key={item.id} onClick={() => setSelectedId(item.id)} type="button"><span className="min-w-0 truncate text-sm font-bold text-[var(--wallet-ink)]">{item.name}</span><span className="shrink-0 text-sm font-bold tabular-nums text-[var(--wallet-muted)]">{formatWon(calculateMonthlyExpenseEquivalent(item))}</span></button>)}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          {selected && (
            <div className="space-y-5" data-testid="expense-editor-panel">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field htmlFor={`expense-name-${selected.id}`} label="지출 이름"><input className={inputClass} id={`expense-name-${selected.id}`} ref={nameInputRef} value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} /></Field>
                <Field htmlFor={`expense-category-${selected.id}`} label="카테고리"><select className={inputClass} id={`expense-category-${selected.id}`} value={selected.categoryId} onChange={(event) => updateSelected({ categoryId: event.target.value })}>{visibleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
              </div>
              <MoneyInput id={`expense-amount-${selected.id}`} label="금액" onChange={(amount) => updateSelected({ amount })} quickAmountsManwon={[1, 5, 10, 50]} value={selected.amount} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field htmlFor={`expense-frequency-${selected.id}`} label="반복 주기"><select className={inputClass} id={`expense-frequency-${selected.id}`} value={selected.frequency} onChange={(event) => updateSelected({ frequency: event.target.value as ExpenseFrequency })}>{frequencies.map((frequency) => <option key={frequency.id} value={frequency.id}>{frequency.label}</option>)}</select></Field>
                {selected.frequency === "monthly" ? <Field htmlFor={`expense-payment-day-${selected.id}`} label="결제일"><input aria-label="결제일" className={inputClass} id={`expense-payment-day-${selected.id}`} max={31} min={1} type="number" value={selected.paymentDay ?? ""} onChange={(event) => updateSelected({ paymentDay: event.target.value ? Number(event.target.value) : undefined })} /></Field> : <Field htmlFor={`expense-next-date-${selected.id}`} label={selected.frequency === "one-time" ? "지출 예정일" : "다음 결제일"}><input className={inputClass} id={`expense-next-date-${selected.id}`} type="date" value={selected.nextPaymentDate ?? ""} onChange={(event) => updateSelected({ nextPaymentDate: event.target.value || undefined })} /></Field>}
                <Field htmlFor={`expense-start-${selected.id}`} label="시작일"><input className={inputClass} id={`expense-start-${selected.id}`} type="date" value={selected.startDate} onChange={(event) => updateSelected({ startDate: event.target.value })} /></Field>
                <Field htmlFor={`expense-end-${selected.id}`} label="종료일"><input className={inputClass} id={`expense-end-${selected.id}`} type="date" value={selected.endDate ?? ""} onChange={(event) => updateSelected({ endDate: event.target.value || undefined })} /></Field>
              </div>
              {selected.frequency !== "one-time" && <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold text-[var(--wallet-ink)]"><input checked={selected.autoRenewal} className="size-5 accent-[var(--wallet-primary)]" onChange={(event) => updateSelected({ autoRenewal: event.target.checked })} type="checkbox" />자동 갱신</label>}
              <Field htmlFor={`expense-note-${selected.id}`} label="메모"><textarea className={`${inputClass} min-h-24 py-3`} id={`expense-note-${selected.id}`} value={selected.note ?? ""} onChange={(event) => updateSelected({ note: event.target.value || undefined })} /></Field>
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
