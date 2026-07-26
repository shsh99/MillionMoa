"use client";

import {
  BadgeDollarSign,
  Building2,
  Landmark,
  Plus,
  RotateCcw,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { MoneyInput } from "../../components/money-input";
import type {
  AssetAccount,
  AssetAccountCategory,
  FinanceScenarioInput,
  Loan,
  LoanCategory,
  LoanRepaymentMethod,
} from "./finance-scenario-model";

type Props = {
  value: FinanceScenarioInput;
  onChange: (value: FinanceScenarioInput) => void;
  mode?: "assets" | "loans";
};

const assetCategories: Array<{ value: AssetAccountCategory; label: string }> = [
  { value: "checking", label: "입출금" },
  { value: "parking", label: "파킹" },
  { value: "savings", label: "적금" },
  { value: "deposit", label: "예금" },
  { value: "investment", label: "투자" },
  { value: "deposit-bond", label: "채권" },
  { value: "other", label: "기타" },
];

const loanCategories: Array<{ value: LoanCategory; label: string }> = [
  { value: "credit", label: "신용" },
  { value: "jeonse", label: "전세" },
  { value: "mortgage", label: "주택" },
  { value: "student", label: "학자금" },
  { value: "card", label: "카드" },
  { value: "other", label: "기타" },
];

const repaymentMethods: Array<{ value: LoanRepaymentMethod; label: string }> = [
  { value: "equal-payment", label: "원리금균등" },
  { value: "equal-principal", label: "원금균등" },
  { value: "bullet", label: "만기일시" },
];

type AssetPreset = {
  label: string;
  detail: string;
  patch: Pick<AssetAccount, "name" | "category"> & Partial<Pick<AssetAccount, "annualRate" | "monthlyContribution">>;
};

type LoanPreset = {
  label: string;
  detail: string;
  patch: Pick<Loan, "name" | "category" | "annualRate" | "remainingMonths" | "repaymentMethod">;
};

const assetPresets: AssetPreset[] = [
  {
    label: "월급통장",
    detail: "입출금 · 연 0%",
    patch: { name: "월급통장", category: "checking", annualRate: 0, monthlyContribution: 0 },
  },
  {
    label: "파킹통장",
    detail: "파킹 · 연 2.5%",
    patch: { name: "파킹통장", category: "parking", annualRate: 0.025, monthlyContribution: 0 },
  },
  {
    label: "청년적금",
    detail: "적금 · 월 50만원 · 연 4.5%",
    patch: { name: "청년적금", category: "savings", annualRate: 0.045, monthlyContribution: 500_000 },
  },
];

const loanPresets: LoanPreset[] = [
  {
    label: "학자금 대출",
    detail: "연 1.7% · 36개월",
    patch: {
      name: "학자금 대출",
      category: "student",
      annualRate: 0.017,
      remainingMonths: 36,
      repaymentMethod: "equal-payment",
    },
  },
  {
    label: "신용 대출",
    detail: "연 5.5% · 36개월",
    patch: {
      name: "신용 대출",
      category: "credit",
      annualRate: 0.055,
      remainingMonths: 36,
      repaymentMethod: "equal-payment",
    },
  },
  {
    label: "전세 대출",
    detail: "연 3.8% · 24개월",
    patch: {
      name: "전세 대출",
      category: "jeonse",
      annualRate: 0.038,
      remainingMonths: 24,
      repaymentMethod: "bullet",
    },
  },
  {
    label: "주택 대출",
    detail: "연 4.2% · 360개월",
    patch: {
      name: "주택담보대출",
      category: "mortgage",
      annualRate: 0.042,
      remainingMonths: 360,
      repaymentMethod: "equal-principal",
    },
  },
];

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-semibold text-[var(--wallet-ink)]">
      <span>{label}</span>
      {children}
    </label>
  );
}

function PresetButton({
  label,
  detail,
  tone,
  onClick,
}: {
  label: string;
  detail: string;
  tone: "asset" | "loan";
  onClick: () => void;
}) {
  const accentClass = tone === "loan" ? "text-[#9a4f58]" : "text-[var(--wallet-primary-strong)]";
  return (
    <button
      aria-label={`${label} 빠른 설정`}
      className="min-h-16 rounded-2xl border border-[var(--wallet-line)] bg-[var(--wallet-surface)] px-3 py-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--wallet-primary)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)] active:translate-y-0"
      onClick={onClick}
      type="button"
    >
      <span className={`block text-sm font-extrabold ${accentClass}`}>{label}</span>
      <span className="mt-1 block text-xs font-bold text-[var(--wallet-muted)]">{detail}</span>
    </button>
  );
}

function focusInputById(id: string) {
  const input = document.getElementById(id);
  if (!(input instanceof HTMLInputElement)) return;
  input.scrollIntoView?.({ block: "center", behavior: "smooth" });
  input.focus();
}

function focusInputByName(name: string) {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) return;
  input.scrollIntoView?.({ block: "center", behavior: "smooth" });
  input.focus();
}

const inputClass = "h-12 w-full rounded-2xl border border-[var(--wallet-line)] bg-[var(--wallet-surface)] px-3 text-base font-semibold text-[var(--wallet-ink)] shadow-sm outline-none focus:border-[var(--wallet-primary)] focus:ring-2 focus:ring-[var(--wallet-primary-soft)]";

function formatDraftNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}

function DraftNumberField({
  label,
  name,
  value,
  min,
  max,
  step,
  inputMode,
  errorMessage,
  onCommit,
}: {
  label: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: string | number;
  inputMode: "decimal" | "numeric";
  errorMessage: string;
  onCommit: (value: number) => void;
}) {
  const generatedId = useId();
  const inputId = `${name}-${generatedId}`;
  const errorId = `${inputId}-error`;
  const [draft, setDraft] = useState(formatDraftNumber(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(formatDraftNumber(value));
    setError(null);
  }, [value]);

  const commitDraft = () => {
    if (draft.trim() === "") {
      setError(errorMessage);
      return;
    }
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < min) {
      setError(errorMessage);
      return;
    }
    const next = Math.min(max, parsed);
    setError(null);
    setDraft(formatDraftNumber(next));
    if (next !== value) onCommit(next);
  };

  return (
    <label className="block space-y-2 text-sm font-semibold text-[var(--wallet-ink)]" htmlFor={inputId}>
      <span>{label}</span>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        aria-label={label}
        autoComplete="off"
        className={inputClass}
        id={inputId}
        inputMode={inputMode}
        max={max}
        min={min}
        name={name}
        onBlur={commitDraft}
        onChange={(event) => {
          setDraft(event.target.value);
          setError(null);
        }}
        step={step}
        type="number"
        value={draft}
      />
      {error && <p className="text-xs font-bold text-[var(--wallet-coral)]" id={errorId}>{error}</p>}
    </label>
  );
}

export function FinanceScenarioEditor({ value, onChange, mode: controlledMode }: Props) {
  const [internalMode, setInternalMode] = useState<"assets" | "loans">("assets");
  const mode = controlledMode ?? internalMode;
  const setMode = (nextMode: "assets" | "loans") => {
    if (!controlledMode) setInternalMode(nextMode);
  };
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(value.assets[0]?.id ?? null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(value.loans[0]?.id ?? null);
  const [removedStack, setRemovedStack] = useState<Array<{ kind: "asset"; item: AssetAccount; index: number } | { kind: "loan"; item: Loan; index: number }>>([]);
  const [assetDetailsOpen, setAssetDetailsOpen] = useState(false);
  const [loanDetailsOpen, setLoanDetailsOpen] = useState(false);
  const [pendingFocusInputId, setPendingFocusInputId] = useState<string | null>(null);
  const [pendingFocusInputName, setPendingFocusInputName] = useState<string | null>(null);
  const assetNameRef = useRef<HTMLInputElement>(null);
  const loanNameRef = useRef<HTMLInputElement>(null);
  const undoButtonRef = useRef<HTMLButtonElement>(null);
  const focusAssetNameRef = useRef(false);
  const focusLoanNameRef = useRef(false);
  const selectedAsset = value.assets.find((item) => item.id === selectedAssetId) ?? value.assets[0];
  const selectedLoan = value.loans.find((item) => item.id === selectedLoanId) ?? value.loans[0];
  const removed = removedStack.at(-1) ?? null;

  useEffect(() => {
    if (!focusAssetNameRef.current) return;
    focusAssetNameRef.current = false;
    assetNameRef.current?.focus();
  }, [selectedAsset?.id]);

  useEffect(() => {
    if (!focusLoanNameRef.current) return;
    focusLoanNameRef.current = false;
    loanNameRef.current?.focus();
  }, [selectedLoan?.id]);

  useEffect(() => {
    if (!pendingFocusInputId) return;
    focusInputById(pendingFocusInputId);
    setPendingFocusInputId(null);
  }, [pendingFocusInputId]);

  useEffect(() => {
    if (!pendingFocusInputName) return;
    focusInputByName(pendingFocusInputName);
    setPendingFocusInputName(null);
  }, [pendingFocusInputName]);

  const updateAsset = (patch: Partial<AssetAccount>) => {
    if (!selectedAsset) return;
    onChange({
      ...value,
      assets: value.assets.map((asset) => asset.id === selectedAsset.id ? { ...asset, ...patch } : asset),
    });
  };
  const updateLoan = (patch: Partial<Loan>) => {
    if (!selectedLoan) return;
    onChange({
      ...value,
      loans: value.loans.map((loan) => loan.id === selectedLoan.id ? { ...loan, ...patch } : loan),
    });
  };

  const addAsset = () => {
    const asset: AssetAccount = {
      id: newId("asset"),
      name: `새 자산 ${value.assets.length + 1}`,
      category: "checking",
      balance: 0,
      annualRate: 0,
      monthlyContribution: 0,
    };
    setSelectedAssetId(asset.id);
    setAssetDetailsOpen(false);
    setPendingFocusInputId(`asset-${asset.id}-balance`);
    onChange({ ...value, assets: [...value.assets, asset] });
  };

  const addStarterAssetSet = () => {
    const existingNames = new Set(value.assets.map((asset) => asset.name));
    const starterAssets: AssetAccount[] = assetPresets
      .filter((preset) => !existingNames.has(preset.patch.name))
      .map((preset) => ({
        id: newId("asset"),
        balance: 0,
        annualRate: 0,
        monthlyContribution: 0,
        ...preset.patch,
      }));
    if (starterAssets.length === 0) return;
    setSelectedAssetId(starterAssets[0].id);
    setAssetDetailsOpen(false);
    setPendingFocusInputId(`asset-${starterAssets[0].id}-balance`);
    onChange({ ...value, assets: [...value.assets, ...starterAssets] });
  };

  const addLoan = () => {
    const loan: Loan = {
      id: newId("loan"),
      name: `새 대출 ${value.loans.length + 1}`,
      category: "credit",
      principal: 0,
      annualRate: 0,
      remainingMonths: 12,
      repaymentMethod: "equal-payment",
    };
    setSelectedLoanId(loan.id);
    setLoanDetailsOpen(false);
    setPendingFocusInputId(`loan-${loan.id}-principal`);
    onChange({ ...value, loans: [...value.loans, loan] });
  };

  const deleteAsset = () => {
    if (!selectedAsset) return;
    const index = value.assets.findIndex((asset) => asset.id === selectedAsset.id);
    const remaining = value.assets.filter((asset) => asset.id !== selectedAsset.id);
    setRemovedStack((current) => [...current, { kind: "asset", item: selectedAsset, index }]);
    setSelectedAssetId(remaining[Math.min(index, remaining.length - 1)]?.id ?? null);
    onChange({ ...value, assets: remaining });
    requestAnimationFrame(() => undoButtonRef.current?.focus());
  };

  const deleteLoan = () => {
    if (!selectedLoan) return;
    const index = value.loans.findIndex((loan) => loan.id === selectedLoan.id);
    const remaining = value.loans.filter((loan) => loan.id !== selectedLoan.id);
    setRemovedStack((current) => [...current, { kind: "loan", item: selectedLoan, index }]);
    setSelectedLoanId(remaining[Math.min(index, remaining.length - 1)]?.id ?? null);
    onChange({ ...value, loans: remaining });
    requestAnimationFrame(() => undoButtonRef.current?.focus());
  };

  const undoDelete = () => {
    if (!removed) return;
    const hasMoreRemovedItems = removedStack.length > 1;
    if (removed.kind === "asset") {
      const assets = [...value.assets];
      assets.splice(removed.index, 0, removed.item);
      focusAssetNameRef.current = !hasMoreRemovedItems;
      setMode("assets");
      setSelectedAssetId(removed.item.id);
      onChange({ ...value, assets });
    } else {
      const loans = [...value.loans];
      loans.splice(removed.index, 0, removed.item);
      focusLoanNameRef.current = !hasMoreRemovedItems;
      setMode("loans");
      setSelectedLoanId(removed.item.id);
      onChange({ ...value, loans });
    }
    setRemovedStack((current) => current.slice(0, -1));
    if (hasMoreRemovedItems) requestAnimationFrame(() => undoButtonRef.current?.focus());
  };

  return (
    <section className="overflow-hidden rounded-[22px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] shadow-[var(--wallet-shadow)]" aria-label="자산 및 대출 편집">
      <div className="flex items-center justify-between border-b border-[var(--wallet-line)] px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[var(--wallet-ink)]">내 금융 계정</h2>
        </div>
        <span className="grid size-10 place-items-center rounded-2xl bg-[var(--wallet-primary-soft)]"><WalletCards className="size-5 text-[var(--wallet-primary-strong)]" aria-hidden="true" /></span>
      </div>

      {!controlledMode && <div className="grid grid-cols-2 bg-[var(--wallet-surface-tint)] p-1.5" role="tablist" aria-label="금융 계정 종류">
        {([
          { id: "assets" as const, label: "자산", icon: Landmark, count: value.assets.length },
          { id: "loans" as const, label: "대출", icon: BadgeDollarSign, count: value.loans.length },
        ]).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-label={tab.label}
              aria-controls={`finance-${tab.id}-panel`}
              id={`finance-${tab.id}-tab`}
              aria-selected={mode === tab.id}
              tabIndex={mode === tab.id ? 0 : -1}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)] ${mode === tab.id ? "bg-[var(--wallet-surface)] text-[var(--wallet-ink)] shadow-sm" : "text-[var(--wallet-muted)] hover:text-[var(--wallet-ink)]"}`}
              onClick={() => setMode(tab.id)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                setMode(tab.id === "assets" ? "loans" : "assets");
                const sibling = event.currentTarget[tab.id === "assets" ? "nextElementSibling" : "previousElementSibling"];
                if (sibling instanceof HTMLButtonElement) sibling.focus();
              }}
            >
              <Icon className="size-4" aria-hidden="true" />
              {tab.label}<span className={tab.id === "loans" ? "text-[var(--wallet-coral)]" : "text-[var(--wallet-primary-strong)]"}>{tab.count}</span>
            </button>
          );
        })}
      </div>}

      <div className="p-4 sm:p-5">
        {mode === "assets" ? (
          <div role="tabpanel" className="space-y-4" id="finance-assets-panel" aria-labelledby="finance-assets-tab">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {value.assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  aria-label={`${asset.name} 계좌 선택`}
                  aria-pressed={selectedAsset?.id === asset.id}
                  className={`min-h-11 shrink-0 rounded-2xl border px-3 text-sm font-bold ${selectedAsset?.id === asset.id ? "border-[var(--wallet-primary)] bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary-strong)]" : "border-[var(--wallet-line)] bg-[var(--wallet-surface)] text-[var(--wallet-muted)]"}`}
                  onClick={() => setSelectedAssetId(asset.id)}
                >{asset.name}</button>
              ))}
              <button type="button" aria-label="자산 계좌 추가" className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl bg-[var(--wallet-primary)] px-3 text-sm font-bold text-white" onClick={addAsset}>
                <Plus className="size-4" aria-hidden="true" /> 추가
              </button>
              <button
                aria-label="초년생 기본 자산 세트 만들기"
                className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl border border-[var(--wallet-line)] bg-[var(--wallet-surface)] px-3 text-sm font-bold text-[var(--wallet-primary-strong)] shadow-sm hover:border-[var(--wallet-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]"
                onClick={addStarterAssetSet}
                type="button"
              >
                <Landmark className="size-4" aria-hidden="true" /> 기본 세트
              </button>
            </div>
            {selectedAsset ? (
              <div className="space-y-4 border-t border-[var(--wallet-line)] pt-4" data-testid="asset-editor-panel">
                <div className="grid grid-cols-2 gap-2 rounded-[20px] bg-[var(--wallet-surface-tint)] p-2">
                  <button
                    aria-label="자산 잔액 바로 입력"
                    className="min-h-12 rounded-2xl bg-[var(--wallet-primary)] px-3 text-sm font-extrabold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]"
                    onClick={() => focusInputById(`asset-${selectedAsset.id}-balance`)}
                    type="button"
                  >
                    잔액 입력
                  </button>
                  <button
                    aria-label="월 납입 바로 입력"
                    className="min-h-12 rounded-2xl border border-[var(--wallet-line)] bg-[var(--wallet-surface)] px-3 text-sm font-extrabold text-[var(--wallet-primary-strong)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]"
                    onClick={() => {
                      setAssetDetailsOpen(true);
                      setPendingFocusInputId(`asset-${selectedAsset.id}-contribution`);
                    }}
                    type="button"
                  >
                    월 납입
                  </button>
                </div>
                <section aria-label="자산 빠른 설정" className="rounded-[20px] bg-[var(--wallet-surface-tint)] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-[var(--wallet-ink)]">빠른 설정</h3>
                    <p className="text-xs font-bold text-[var(--wallet-muted)]">선택 후 잔액만 입력</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {assetPresets.map((preset) => (
                      <PresetButton
                        detail={preset.detail}
                        key={preset.label}
                        label={preset.label}
                        onClick={() => updateAsset(preset.patch)}
                        tone="asset"
                      />
                    ))}
                  </div>
                </section>
                <MoneyInput id={`asset-${selectedAsset.id}-balance`} label="자산 계좌 잔액" value={selectedAsset.balance} onChange={(balance) => updateAsset({ balance })} allowNegative quickAmountMode="adjust" />
                <button
                  aria-controls={`asset-${selectedAsset.id}-details`}
                  aria-expanded={assetDetailsOpen}
                  aria-label={`자산 세부 조건 ${assetDetailsOpen ? "닫기" : "열기"}`}
                  className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-[var(--wallet-line)] bg-[var(--wallet-surface)] px-3 text-sm font-extrabold text-[var(--wallet-ink)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]"
                  onClick={() => setAssetDetailsOpen((open) => !open)}
                  type="button"
                >
                  세부 조건
                  <span className="text-xs font-bold text-[var(--wallet-muted)]">{assetDetailsOpen ? "접기" : "열기"}</span>
                </button>
                {assetDetailsOpen && (
                  <div className="space-y-4 rounded-[20px] bg-[var(--wallet-surface-tint)] p-3" id={`asset-${selectedAsset.id}-details`}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="계좌 이름"><input aria-label="자산 계좌 이름" autoComplete="off" className={inputClass} name="asset-name" ref={assetNameRef} value={selectedAsset.name} onChange={(e) => updateAsset({ name: e.target.value })} /></Field>
                      <Field label="계좌 종류"><select aria-label="자산 계좌 종류" autoComplete="off" className={inputClass} name="asset-category" value={selectedAsset.category} onChange={(e) => updateAsset({ category: e.target.value as AssetAccountCategory })}>{assetCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="연 수익률 (%)"><input aria-label="자산 연 수익률" autoComplete="off" className={inputClass} name="asset-annual-rate" type="number" inputMode="decimal" min={-100} max={100} step="0.1" value={(selectedAsset.annualRate ?? 0) * 100} onChange={(e) => { const rate = Number(e.target.value); updateAsset({ annualRate: Number.isFinite(rate) ? Math.max(-100, Math.min(100, rate)) / 100 : 0 }); }} /></Field>
                      <MoneyInput id={`asset-${selectedAsset.id}-contribution`} label="월 납입" value={selectedAsset.monthlyContribution ?? 0} onChange={(monthlyContribution) => updateAsset({ monthlyContribution })} />
                    </div>
                  </div>
                )}
                <button type="button" aria-label="선택한 자산 계좌 삭제" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-rose-700 hover:bg-rose-50" onClick={deleteAsset}><Trash2 className="size-4" aria-hidden="true" />계좌 삭제</button>
              </div>
            ) : <EmptyState icon={Building2} text="등록한 자산 계좌가 없습니다" />}
          </div>
        ) : (
          <div role="tabpanel" className="space-y-4" id="finance-loans-panel" aria-labelledby="finance-loans-tab">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {value.loans.map((loan) => <button key={loan.id} type="button" aria-label={`${loan.name} 대출 선택`} aria-pressed={selectedLoan?.id === loan.id} className={`min-h-11 shrink-0 rounded-2xl border px-3 text-sm font-bold ${selectedLoan?.id === loan.id ? "border-[var(--wallet-coral)] bg-[var(--wallet-coral-soft)] text-[#9a4f58]" : "border-[var(--wallet-line)] bg-[var(--wallet-surface)] text-[var(--wallet-muted)]"}`} onClick={() => setSelectedLoanId(loan.id)}>{loan.name}</button>)}
              <button type="button" aria-label="대출 추가" className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl bg-[var(--wallet-coral)] px-3 text-sm font-bold text-white" onClick={addLoan}><Plus className="size-4" aria-hidden="true" /> 추가</button>
            </div>
            {selectedLoan ? (
              <div className="space-y-4 border-t border-[var(--wallet-line)] pt-4" data-testid="loan-editor-panel">
                <div className="grid grid-cols-2 gap-2 rounded-[20px] bg-[var(--wallet-surface-tint)] p-2">
                  <button
                    aria-label="대출 원금 바로 입력"
                    className="min-h-12 rounded-2xl bg-[var(--wallet-coral)] px-3 text-sm font-extrabold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]"
                    onClick={() => focusInputById(`loan-${selectedLoan.id}-principal`)}
                    type="button"
                  >
                    원금 입력
                  </button>
                  <button
                    aria-label="대출 금리 바로 입력"
                    className="min-h-12 rounded-2xl border border-[var(--wallet-line)] bg-[var(--wallet-surface)] px-3 text-sm font-extrabold text-[#9a4f58] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]"
                    onClick={() => {
                      setLoanDetailsOpen(true);
                      setPendingFocusInputName("loan-annual-rate");
                    }}
                    type="button"
                  >
                    금리 수정
                  </button>
                </div>
                <section aria-label="대출 빠른 설정" className="rounded-[20px] bg-[var(--wallet-surface-tint)] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-[var(--wallet-ink)]">빠른 설정</h3>
                    <p className="text-xs font-bold text-[var(--wallet-muted)]">원금만 넣고 바로 계산</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-4">
                    {loanPresets.map((preset) => (
                      <PresetButton
                        detail={preset.detail}
                        key={preset.label}
                        label={preset.label}
                        onClick={() => updateLoan(preset.patch)}
                        tone="loan"
                      />
                    ))}
                  </div>
                </section>
                <MoneyInput id={`loan-${selectedLoan.id}-principal`} label="대출 원금" value={selectedLoan.principal} onChange={(principal) => updateLoan({ principal })} />
                <button
                  aria-controls={`loan-${selectedLoan.id}-details`}
                  aria-expanded={loanDetailsOpen}
                  aria-label={`대출 세부 조건 ${loanDetailsOpen ? "닫기" : "열기"}`}
                  className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-[var(--wallet-line)] bg-[var(--wallet-surface)] px-3 text-sm font-extrabold text-[var(--wallet-ink)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]"
                  onClick={() => setLoanDetailsOpen((open) => !open)}
                  type="button"
                >
                  세부 조건
                  <span className="text-xs font-bold text-[var(--wallet-muted)]">{loanDetailsOpen ? "접기" : "열기"}</span>
                </button>
                {loanDetailsOpen && (
                  <div className="space-y-4 rounded-[20px] bg-[var(--wallet-surface-tint)] p-3" id={`loan-${selectedLoan.id}-details`}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="대출 이름"><input aria-label="대출 이름" autoComplete="off" className={inputClass} name="loan-name" ref={loanNameRef} value={selectedLoan.name} onChange={(e) => updateLoan({ name: e.target.value })} /></Field>
                      <Field label="대출 종류"><select aria-label="대출 종류" autoComplete="off" className={inputClass} name="loan-category" value={selectedLoan.category} onChange={(e) => updateLoan({ category: e.target.value as LoanCategory })}>{loanCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DraftNumberField
                        errorMessage="연 금리는 0%부터 100% 사이여야 합니다."
                        inputMode="decimal"
                        label="대출 연 금리"
                        max={100}
                        min={0}
                        name="loan-annual-rate"
                        onCommit={(rate) => updateLoan({ annualRate: rate / 100 })}
                        step="0.1"
                        value={selectedLoan.annualRate * 100}
                      />
                      <DraftNumberField
                        errorMessage="남은 기간은 1개월부터 1200개월 사이여야 합니다."
                        inputMode="numeric"
                        label="대출 남은 개월"
                        max={1200}
                        min={1}
                        name="loan-remaining-months"
                        onCommit={(months) => updateLoan({ remainingMonths: Math.round(months) })}
                        step={1}
                        value={selectedLoan.remainingMonths}
                      />
                    </div>
                    <fieldset><legend className="mb-2 text-sm font-semibold text-[var(--wallet-ink)]">상환 방식</legend><div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="상환 방식">{repaymentMethods.map((method) => <label key={method.value} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border px-2 text-center text-sm font-bold ${selectedLoan.repaymentMethod === method.value ? "border-[var(--wallet-coral)] bg-[var(--wallet-coral-soft)] text-[#9a4f58]" : "border-[var(--wallet-line)] bg-[var(--wallet-surface)] text-[var(--wallet-muted)]"}`}><input className="sr-only" type="radio" name={`repayment-${selectedLoan.id}`} value={method.value} checked={selectedLoan.repaymentMethod === method.value} onChange={() => updateLoan({ repaymentMethod: method.value })} />{method.label}</label>)}</div></fieldset>
                  </div>
                )}
                <button type="button" aria-label="선택한 대출 삭제" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-rose-700 hover:bg-rose-50" onClick={deleteLoan}><Trash2 className="size-4" aria-hidden="true" />대출 삭제</button>
              </div>
            ) : <EmptyState icon={BadgeDollarSign} text="등록한 대출이 없습니다" />}
          </div>
        )}
      </div>
      {removed && <div aria-live="polite" className="flex min-h-14 items-center justify-between gap-3 border-t border-[var(--wallet-line)] bg-[var(--wallet-surface-tint)] px-4 py-2 text-sm font-semibold text-[var(--wallet-ink)]" role="status"><span><strong className="block">{removed.item.name} 삭제 완료</strong>{removedStack.length > 1 && <span className="mt-0.5 block text-xs text-[var(--wallet-muted)]">이전 삭제 {removedStack.length - 1}건 더</span>}</span><button aria-label={`${removed.item.name} 삭제 되돌리기`} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 font-bold text-[var(--wallet-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)]" onClick={undoDelete} ref={undoButtonRef} type="button"><RotateCcw aria-hidden="true" className="size-4" />되돌리기</button></div>}
    </section>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Building2; text: string }) {
  return <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl bg-slate-50 text-center"><Icon className="mb-2 size-6 text-slate-400" aria-hidden="true" /><p className="text-sm font-semibold text-slate-500">{text}</p></div>;
}
