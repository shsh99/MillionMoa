"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { calculateLoanImpact, calculateMonthsToGoal } from "@/lib/calculators";
import {
  addCategoryItem,
  calculateCategoryTotals,
  removeCategoryItem,
  restoreCategoryItem,
  updateCategoryItem,
  type FinanceCategoryItem,
  type FinanceCategoryKind,
} from "./finance-category-model";

const goalAmount = 100_000_000;
const manWon = 10_000;

const initialItems: FinanceCategoryItem[] = [
  { id: "cash", kind: "asset", name: "예금·현금", amountMan: "1000" },
  { id: "salary", kind: "income", name: "월 실수령", amountMan: "320" },
  { id: "fixed", kind: "expense", name: "고정비", amountMan: "105" },
  { id: "living", kind: "expense", name: "생활비", amountMan: "85" },
  { id: "reserve", kind: "expense", name: "비상금", amountMan: "30" },
];

type PlannerTab = "net-worth" | "cash-flow" | "loan" | "return";

const tabs: Array<{ id: PlannerTab; label: string }> = [
  { id: "net-worth", label: "순자산" },
  { id: "cash-flow", label: "월 현금흐름" },
  { id: "loan", label: "대출" },
  { id: "return", label: "수익률" },
];

const kindMeta: Record<FinanceCategoryKind, { title: string; addLabel: string; newName: string; tone: string }> = {
  asset: { title: "자산", addLabel: "자산 항목 추가", newName: "새 자산", tone: "bg-[#eaf8f3] text-[#087a63]" },
  liability: { title: "부채", addLabel: "부채 항목 추가", newName: "새 부채", tone: "bg-[#fff3e6] text-[#a15c00]" },
  income: { title: "수입", addLabel: "수입 항목 추가", newName: "새 수입", tone: "bg-[#eaf8f3] text-[#087a63]" },
  expense: { title: "지출", addLabel: "지출 항목 추가", newName: "새 지출", tone: "bg-[#f1f4f8] text-[#556274]" },
};

const kindPresets: Record<FinanceCategoryKind, string[]> = {
  asset: ["예금·현금", "투자계좌", "전세보증금", "기타 자산"],
  liability: ["카드값", "마이너스통장", "학자금 대출", "기타 부채"],
  income: ["월 실수령", "부수입", "성과급", "기타 수입"],
  expense: ["고정비", "생활비", "비상금", "기타 지출"],
};

function tabFromHash(hash: string): PlannerTab | null {
  const value = hash.replace(/^#planner-/, "") as PlannerTab;
  return tabs.some((tab) => tab.id === value) ? value : null;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatMan(value: number) {
  return `${value < 0 ? "-" : ""}${formatNumber(Math.abs(value))}만원`;
}

function formatWon(value: number | null) {
  return value === null ? "확인 필요" : `${formatNumber(value)}원`;
}

function formatDuration(months: number) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (!years) return `${rest}개월`;
  if (!rest) return `${years}년`;
  return `${years}년 ${rest}개월`;
}

function sanitizeMoney(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
}

function sanitizeDecimal(value: string) {
  const cleaned = value.replace(/[^\d.-]/g, "");
  const [integer, ...decimals] = cleaned.split(".");
  return decimals.length ? `${integer}.${decimals.join("")}` : integer;
}

function displayMoneyInput(value: string) {
  if (!value) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? formatNumber(parsed) : value;
}

function strictNumber(value: string) {
  if (!value.trim()) return Number.NaN;
  return Number(value);
}

function CategoryRow({
  item,
  expanded,
  onChange,
  onDelete,
  onToggle,
}: {
  item: FinanceCategoryItem;
  expanded: boolean;
  onChange: (patch: Partial<Pick<FinanceCategoryItem, "name" | "amountMan">>) => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const amount = Number(item.amountMan) || 0;
  const signed = item.kind === "liability" || item.kind === "expense" ? -amount : amount;
  const controlsId = `category-controls-${item.id}`;
  const itemLabel = item.name.trim() || kindMeta[item.kind].newName;

  return (
    <div className="border-b border-[#e8edf3] last:border-b-0">
      <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-1 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#556274]">{itemLabel}</p>
          <p className={`mt-1 text-lg font-black tabular-nums ${signed < 0 ? "text-[#a15c00]" : "text-[#18202b]"}`}>
            {signed > 0 ? "+" : ""}{formatMan(signed)}
          </p>
        </div>
        <button
          aria-controls={controlsId}
          aria-expanded={expanded}
          className="min-h-11 rounded-lg px-3 text-sm font-bold text-[#2f6fed] hover:bg-[#eef4ff]"
          onClick={onToggle}
          type="button"
        >
          {itemLabel} 수정
        </button>
        <button
          className="min-h-11 rounded-lg px-2 text-sm font-bold text-[#697587] hover:bg-[#f1f4f8] hover:text-[#b43c3c]"
          onClick={onDelete}
          type="button"
        >
          {itemLabel} 삭제
        </button>
      </div>

      {expanded ? (
        <div className="mb-3 rounded-lg bg-[#f5f7fa] p-3" id={controlsId}>
          <div className="grid gap-3 sm:grid-cols-[1fr_1.1fr]">
            <label className="grid gap-1.5 text-xs font-bold text-[#697587]">
              항목 이름
              <input
                aria-label={`${itemLabel} 이름`}
                autoComplete="off"
                className="h-11 min-w-0 rounded-lg border border-[#d8e0ea] bg-white px-3 text-base font-bold text-[#18202b] outline-none focus:border-[#2f6fed]"
                id={`category-name-${item.id}`}
                maxLength={18}
                name={`category-${item.id}-name`}
                onChange={(event) => onChange({ name: event.target.value })}
                value={item.name}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-[#697587]">
              금액
              <span className="flex h-11 items-center rounded-lg border border-[#d8e0ea] bg-white px-3 focus-within:border-[#2f6fed]">
                <input
                  aria-label={`${itemLabel} 금액`}
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent text-right text-base font-black tabular-nums text-[#18202b] outline-none"
                  inputMode="numeric"
                  name={`category-${item.id}-amount`}
                  onChange={(event) => onChange({ amountMan: sanitizeMoney(event.target.value) })}
                  value={displayMoneyInput(item.amountMan)}
                />
                <span className="ml-1 text-sm font-bold text-[#697587]">만원</span>
              </span>
            </label>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {[10, 50, 100, 500].map((quickAmount) => (
              <button
                aria-label={`${itemLabel}에 ${quickAmount}만원 더하기`}
                className="min-h-11 shrink-0 rounded-lg border border-[#d8e0ea] bg-white px-3 text-sm font-black text-[#2f6fed] active:scale-[0.98]"
                key={quickAmount}
                onClick={() => onChange({ amountMan: String(amount + quickAmount) })}
                type="button"
              >
                +{quickAmount}만
              </button>
            ))}
            <button
              aria-label={`${itemLabel} 금액 지우기`}
              className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-bold text-[#697587] hover:bg-white"
              onClick={() => onChange({ amountMan: "0" })}
              type="button"
            >
              지우기
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CategoryGroup({
  adding,
  kind,
  items,
  expandedId,
  onAddPreset,
  onDelete,
  onRequestAdd,
  onToggle,
  onUpdate,
}: {
  adding: boolean;
  kind: FinanceCategoryKind;
  items: FinanceCategoryItem[];
  expandedId: string | null;
  onAddPreset: (kind: FinanceCategoryKind, name: string) => void;
  onDelete: (id: string) => void;
  onRequestAdd: (kind: FinanceCategoryKind) => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<FinanceCategoryItem, "name" | "amountMan">>) => void;
}) {
  const meta = kindMeta[kind];
  const matching = items.filter((item) => item.kind === kind);

  return (
    <section aria-labelledby={`${kind}-title`} className="border-b border-[#dfe5ed] py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2 py-1 text-xs font-black ${meta.tone}`}>{meta.title}</span>
          <span className="text-xs font-bold text-[#8993a1]">{matching.length}개</span>
        </div>
        <button
          aria-label={meta.addLabel}
          className="min-h-11 rounded-lg px-3 text-sm font-black text-[#2f6fed] hover:bg-[#eef4ff]"
          aria-expanded={adding}
          onClick={() => onRequestAdd(kind)}
          type="button"
        >
          + 추가
        </button>
      </div>
      <h3 className="sr-only" id={`${kind}-title`}>{meta.title}</h3>
      {adding ? (
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-[#f5f7fa] p-2">
          {kindPresets[kind].map((preset) => (
            <button
              aria-label={`${preset} 추가`}
              className="min-h-11 rounded-lg bg-white px-2 text-sm font-bold text-[#344154] ring-1 ring-[#d8e0ea] hover:text-[#2f6fed]"
              key={preset}
              onClick={() => onAddPreset(kind, preset)}
              type="button"
            >
              {preset}
            </button>
          ))}
        </div>
      ) : null}
      {matching.length ? (
        <div className="mt-2">
          {matching.map((item) => (
            <CategoryRow
              expanded={expandedId === item.id}
              item={item}
              key={item.id}
              onChange={(patch) => onUpdate(item.id, patch)}
              onDelete={() => onDelete(item.id)}
              onToggle={() => onToggle(item.id)}
            />
          ))}
        </div>
      ) : (
        <p className="py-5 text-center text-sm font-semibold text-[#8993a1]">등록된 {meta.title} 항목이 없습니다.</p>
      )}
    </section>
  );
}

function CompactMoneyInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black text-[#18202b]">
      {label}
      <span className="flex h-12 items-center rounded-lg border border-[#d8e0ea] bg-white px-3 focus-within:border-[#2f6fed] focus-within:ring-2 focus-within:ring-[#dbeafe]">
        <input
          aria-label={label}
          className="min-w-0 flex-1 bg-transparent text-right text-lg font-black tabular-nums outline-none"
          inputMode="numeric"
          onChange={(event) => onChange(sanitizeMoney(event.target.value))}
          value={displayMoneyInput(value)}
        />
        <span className="ml-1 text-sm font-bold text-[#697587]">만원</span>
      </span>
    </label>
  );
}

export function GoalQuickPlanner() {
  const [items, setItems] = useState(initialItems);
  const [activeTab, setActiveTab] = useState<PlannerTab>("net-worth");
  const [addingKind, setAddingKind] = useState<FinanceCategoryKind | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [removed, setRemoved] = useState<{ item: FinanceCategoryItem; index: number } | null>(null);
  const nextId = useRef(1);
  const [loanPrincipalMan, setLoanPrincipalMan] = useState("3000");
  const [loanAnnualRatePercent, setLoanAnnualRatePercent] = useState("4.5");
  const [loanTermMonths, setLoanTermMonths] = useState("60");
  const [annualReturnPercent, setAnnualReturnPercent] = useState("0");

  useEffect(() => {
    function syncTabFromHash() {
      const tab = tabFromHash(window.location.hash);
      if (tab) setActiveTab(tab);
    }

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  useEffect(() => {
    if (expandedId) document.getElementById(`category-name-${expandedId}`)?.focus();
  }, [expandedId]);

  const totals = useMemo(() => calculateCategoryTotals(items), [items]);
  const currentAmountWon = totals.netWorthMan * manWon;
  const monthlyContributionWon = Math.max(0, totals.monthlyContributionMan) * manWon;
  const annualReturnValue = strictNumber(annualReturnPercent);
  const loanRateValue = strictNumber(loanAnnualRatePercent);
  const loanTermValue = strictNumber(loanTermMonths);

  const result = useMemo(() => calculateMonthsToGoal({
    currentAmount: currentAmountWon,
    goalAmount,
    monthlyContribution: monthlyContributionWon,
    annualReturnRate: annualReturnValue / 100,
  }), [annualReturnValue, currentAmountWon, monthlyContributionWon]);

  const loanImpact = useMemo(() => calculateLoanImpact({
    principal: (Number(loanPrincipalMan) || 0) * manWon,
    annualInterestRate: loanRateValue / 100,
    remainingTermMonths: loanTermValue,
    currentAmount: currentAmountWon,
    goalAmount,
    baselineMonthlyContribution: monthlyContributionWon,
    annualReturnRate: annualReturnValue / 100,
  }), [annualReturnValue, currentAmountWon, loanPrincipalMan, loanRateValue, loanTermValue, monthlyContributionWon]);

  const invalidReturn = result.reason === "invalid-return-rate";
  const failureMessage = invalidReturn
    ? "연 수익률은 -100%에서 50% 사이로 입력해 주세요."
    : result.reason === "max-months-exceeded"
      ? "현재 가정으로는 100년 안에 목표에 도달하지 못합니다."
      : "현재 조건으로는 목표 달성이 어렵습니다";
  const loanErrorMessage = loanImpact.reason === "invalid-number"
    ? "대출 금리와 남은 기간을 숫자로 입력해 주세요."
    : loanImpact.reason === "invalid-term"
      ? "대출 남은 기간은 1개월 이상이어야 합니다."
      : loanImpact.reason === "invalid-loan-rate"
        ? "대출 금리는 0%에서 100% 사이로 입력해 주세요."
        : "대출 원금과 조건을 확인해 주세요.";

  function selectTab(tab: PlannerTab) {
    setActiveTab(tab);
    setExpandedId(null);
    setAddingKind(null);
    if (typeof window !== "undefined") window.history.replaceState(null, "", `#planner-${tab}`);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, tab: PlannerTab) {
    const index = tabs.findIndex((candidate) => candidate.id === tab);
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    const nextTab = tabs[nextIndex].id;
    selectTab(nextTab);
    document.getElementById(`tab-${nextTab}`)?.focus();
  }

  function addItem(kind: FinanceCategoryKind, name: string) {
    const item: FinanceCategoryItem = {
      id: `custom-${nextId.current++}`,
      kind,
      name,
      amountMan: "0",
    };
    setItems((current) => addCategoryItem(current, item));
    setExpandedId(item.id);
    setAddingKind(null);
    setRemoved(null);
  }

  function deleteItem(id: string) {
    setItems((current) => {
      const next = removeCategoryItem(current, id);
      if (next.removed) setRemoved({ item: next.removed, index: next.index });
      return next.items;
    });
    setExpandedId(null);
  }

  function reset() {
    setItems(initialItems);
    selectTab("net-worth");
    setExpandedId(null);
    setAddingKind(null);
    setRemoved(null);
    setLoanPrincipalMan("3000");
    setLoanAnnualRatePercent("4.5");
    setLoanTermMonths("60");
    setAnnualReturnPercent("0");
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-[#d8e0ea] bg-white" aria-labelledby="goal-quick-planner-title">
      <header className="flex items-start justify-between gap-3 border-b border-[#e8edf3] px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-black text-[#2f6fed]">내 숫자로 계산</p>
          <h2 className="mt-1 scroll-mt-24 text-xl font-black text-[#18202b]" id="goal-quick-planner-title">1억 플랜 조정</h2>
        </div>
        <button className="min-h-11 rounded-lg px-3 text-sm font-bold text-[#697587] hover:bg-[#f1f4f8]" onClick={reset} type="button">초기화</button>
      </header>

      <div className="bg-[#17202c] px-5 py-5 text-white" aria-live="polite">
        {result.reached && result.months !== null ? (
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#b7c2d0]">대출 전 목표 기간</p>
              <p className="mt-1 text-4xl font-black tabular-nums">{result.months}개월</p>
            </div>
            <span className="pb-1 text-sm font-black text-[#8cb5ff]">{formatDuration(result.months)}</span>
          </div>
        ) : <p className="text-sm font-bold text-[#ffd989]">{invalidReturn ? "수익률 입력을 확인해 주세요." : failureMessage}</p>}
        <div className="mt-4 grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 pt-4">
          <div className="pr-3">
            <span className="text-xs font-bold text-[#b7c2d0]">현재 순자산</span>
            <strong className="mt-1 block text-lg font-black tabular-nums">{formatMan(totals.netWorthMan)}</strong>
          </div>
          <div className="pl-3">
            <span className="text-xs font-bold text-[#b7c2d0]">월 저축 가능액</span>
            <strong className="mt-1 block text-lg font-black tabular-nums">{formatMan(totals.monthlyContributionMan)}</strong>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-4 divide-x divide-[#e8edf3] border-b border-[#dfe5ed] bg-[#f8fafc] px-2 py-3 text-center">
        {[
          ["자산 합계", totals.assetMan],
          ["부채 합계", totals.liabilityMan],
          ["수입 합계", totals.incomeMan],
          ["지출 합계", totals.expenseMan],
        ].map(([label, value]) => (
          <div aria-label={String(label)} className="min-w-0 px-1" key={String(label)}>
            <dt className="truncate text-[11px] font-bold text-[#8993a1]">{label}</dt>
            <dd className="mt-1 truncate text-xs font-black tabular-nums text-[#344154]">{formatMan(value as number)}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-4 border-b border-[#dfe5ed]" role="tablist" aria-label="플래너 입력 카테고리">
        {tabs.map((tab) => (
          <button
            aria-controls={`panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            className={`min-h-14 border-b-2 px-1 text-xs font-black ${activeTab === tab.id ? "border-[#2f6fed] bg-[#f6f9ff] text-[#2f6fed]" : "border-transparent text-[#697587]"}`}
            id={`tab-${tab.id}`}
            key={tab.id}
            onClick={() => selectTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
            role="tab"
            tabIndex={activeTab === tab.id ? 0 : -1}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-5 pb-5" hidden={activeTab !== "net-worth"} id="panel-net-worth" role="tabpanel" aria-labelledby="tab-net-worth">
        <CategoryGroup adding={addingKind === "asset"} kind="asset" items={items} expandedId={expandedId} onAddPreset={addItem} onDelete={deleteItem} onRequestAdd={(kind) => setAddingKind((current) => current === kind ? null : kind)} onToggle={(id) => setExpandedId((current) => current === id ? null : id)} onUpdate={(id, patch) => setItems((current) => updateCategoryItem(current, id, patch))} />
        <CategoryGroup adding={addingKind === "liability"} kind="liability" items={items} expandedId={expandedId} onAddPreset={addItem} onDelete={deleteItem} onRequestAdd={(kind) => setAddingKind((current) => current === kind ? null : kind)} onToggle={(id) => setExpandedId((current) => current === id ? null : id)} onUpdate={(id, patch) => setItems((current) => updateCategoryItem(current, id, patch))} />
        <p className="mt-1 text-xs font-semibold leading-5 text-[#697587]">대출 원금은 순자산에도 반영하려면 부채 항목으로 함께 등록하세요.</p>
      </div>

      <div className="px-5 pb-5" hidden={activeTab !== "cash-flow"} id="panel-cash-flow" role="tabpanel" aria-labelledby="tab-cash-flow">
        <CategoryGroup adding={addingKind === "income"} kind="income" items={items} expandedId={expandedId} onAddPreset={addItem} onDelete={deleteItem} onRequestAdd={(kind) => setAddingKind((current) => current === kind ? null : kind)} onToggle={(id) => setExpandedId((current) => current === id ? null : id)} onUpdate={(id, patch) => setItems((current) => updateCategoryItem(current, id, patch))} />
        <CategoryGroup adding={addingKind === "expense"} kind="expense" items={items} expandedId={expandedId} onAddPreset={addItem} onDelete={deleteItem} onRequestAdd={(kind) => setAddingKind((current) => current === kind ? null : kind)} onToggle={(id) => setExpandedId((current) => current === id ? null : id)} onUpdate={(id, patch) => setItems((current) => updateCategoryItem(current, id, patch))} />
      </div>

      <div className="px-5 pb-5" hidden={activeTab !== "loan"} id="panel-loan" role="tabpanel" aria-labelledby="tab-loan">
          <section className="py-5" aria-labelledby="loan-editor-title">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="text-base font-black text-[#18202b]" id="loan-editor-title">대출 상환</h3><p className="mt-1 text-sm font-semibold text-[#697587]">원리금 균등 상환 시나리오</p></div>
              <span className="rounded-md bg-[#fff3e6] px-2 py-1 text-xs font-black text-[#a15c00]">{loanImpact.status === "available" ? `${loanImpact.monthsDelayed}개월 지연` : "확인 필요"}</span>
            </div>
            <div className="mt-5 grid gap-4">
              <CompactMoneyInput label="대출 원금" value={loanPrincipalMan} onChange={setLoanPrincipalMan} />
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-2 text-sm font-black text-[#18202b]">대출 금리<span className="flex h-12 items-center rounded-lg border border-[#d8e0ea] px-3 focus-within:border-[#2f6fed]"><input aria-describedby="loan-error" aria-label="대출 금리" className="min-w-0 flex-1 text-right text-base font-black outline-none" inputMode="decimal" onChange={(event) => setLoanAnnualRatePercent(sanitizeDecimal(event.target.value))} value={loanAnnualRatePercent}/><span className="ml-1 text-sm text-[#697587]">%</span></span></label>
                <label className="grid gap-2 text-sm font-black text-[#18202b]">남은 기간<span className="flex h-12 items-center rounded-lg border border-[#d8e0ea] px-3 focus-within:border-[#2f6fed]"><input aria-describedby="loan-error" aria-label="대출 남은 기간" className="min-w-0 flex-1 text-right text-base font-black outline-none" inputMode="numeric" onChange={(event) => setLoanTermMonths(sanitizeMoney(event.target.value))} value={displayMoneyInput(loanTermMonths)}/><span className="ml-1 text-sm text-[#697587]">개월</span></span></label>
              </div>
            </div>
            <dl className="mt-5 divide-y divide-[#e8edf3] rounded-lg bg-[#f5f7fa] px-4">
              {[["예상 월 상환액", loanImpact.totalMonthlyLoanPayment], ["첫 달 이자", loanImpact.firstMonthInterest], ["총 이자 추정", loanImpact.totalInterest], ["상환 중 월 저축", loanImpact.changedMonthlyContribution]].map(([label, value]) => <div className="flex min-h-12 items-center justify-between gap-3" key={String(label)}><dt className="text-sm font-bold text-[#697587]">{label}</dt><dd className="text-sm font-black tabular-nums text-[#18202b]">{formatWon(value as number | null)}</dd></div>)}
            </dl>
            {loanImpact.status === "unavailable" ? <p className="mt-3 rounded-lg bg-[#fff8e8] p-3 text-sm font-bold text-[#7c5a18]" id="loan-error">{loanErrorMessage}</p> : null}
          </section>
      </div>

      <div className="px-5 pb-5" hidden={activeTab !== "return"} id="panel-return" role="tabpanel" aria-labelledby="tab-return">
          <section className="py-5" aria-labelledby="return-title">
            <h3 className="text-base font-black text-[#18202b]" id="return-title">수익률 가정</h3>
            <p className="mt-1 text-sm font-semibold text-[#697587]">목표 계산에만 사용하는 시나리오 값입니다.</p>
            <label className="mt-5 grid gap-2 text-sm font-black text-[#18202b]">연 예상 수익률<span className="flex h-14 items-center rounded-lg border border-[#d8e0ea] px-4 focus-within:border-[#2f6fed] focus-within:ring-2 focus-within:ring-[#dbeafe]"><input aria-describedby="annual-return-help" aria-invalid={invalidReturn} aria-label="연 예상 수익률" className="min-w-0 flex-1 text-right text-xl font-black outline-none" inputMode="decimal" onChange={(event) => setAnnualReturnPercent(sanitizeDecimal(event.target.value))} value={annualReturnPercent}/><span className="ml-2 font-black text-[#697587]">%</span></span></label>
            <div className="mt-3 grid grid-cols-4 gap-2">{[0, 2, 4, 6].map((value) => <button className="min-h-11 rounded-lg border border-[#d8e0ea] text-sm font-black text-[#2f6fed] hover:bg-[#eef4ff]" key={value} onClick={() => setAnnualReturnPercent(String(value))} type="button">{value}%</button>)}</div>
            {invalidReturn ? <p className="mt-3 rounded-lg bg-[#fff8e8] p-3 text-sm font-bold text-[#7c5a18]">{failureMessage}</p> : null}
            {annualReturnValue > 20 ? <p className="mt-3 rounded-lg bg-[#fff8e8] p-3 text-sm font-bold text-[#7c5a18]">높은 연 수익률 가정은 실제 결과와 크게 달라질 수 있습니다.</p> : null}
            <p className="mt-4 text-xs leading-5 text-[#697587]" id="annual-return-help">입력한 수익률과 대출 조건에 따른 단순 추정이며 실제 결과는 보장되지 않습니다.</p>
          </section>
      </div>

      {removed ? (
        <div className="mx-5 mb-5 flex min-h-12 items-center justify-between gap-3 rounded-lg bg-[#17202c] px-4 text-white" aria-live="polite">
          <span className="text-sm font-bold">{removed.item.name} 항목을 삭제했습니다.</span>
          <button className="min-h-11 text-sm font-black text-[#8cb5ff]" onClick={() => { setItems((current) => restoreCategoryItem(current, removed.item, removed.index)); setRemoved(null); }} type="button" aria-label={`${removed.item.name} 되돌리기`}>되돌리기</button>
        </div>
      ) : null}
    </section>
  );
}
