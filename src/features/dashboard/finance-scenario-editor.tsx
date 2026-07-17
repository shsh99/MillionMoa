"use client";

import {
  BadgeDollarSign,
  Building2,
  Landmark,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useId, useState } from "react";
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

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clampAmount(value: number) {
  return Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
}

function AmountInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const amountInManwon = value / 10_000;

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-slate-700">{label}</legend>
      <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
        <input
          id={id}
          aria-label={label}
          className="min-w-0 flex-1 bg-transparent text-right text-base font-bold tabular-nums text-slate-950 outline-none"
          inputMode="decimal"
          min={0}
          step={1}
          type="number"
          value={amountInManwon}
          onChange={(event) => onChange(clampAmount(Number(event.target.value) * 10_000))}
        />
        <span className="ml-2 text-sm font-medium text-slate-500">만원</span>
      </div>
      <div className="grid grid-cols-3 gap-2" aria-label={`${label} 빠른 입력`}>
        {[10, 50, 100].map((amount) => (
          <button
            key={amount}
            type="button"
            aria-label={`${label.replace("자산 계좌 ", "").replace("대출 ", "")}에 ${amount}만원 더하기`}
            className="min-h-11 rounded-xl bg-slate-100 px-2 text-sm font-bold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none"
            onClick={() => onChange(clampAmount(value + amount * 10_000))}
          >
            +{amount}만
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

const inputClass = "h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold text-slate-950 shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function FinanceScenarioEditor({ value, onChange }: Props) {
  const [mode, setMode] = useState<"assets" | "loans">("assets");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(value.assets[0]?.id ?? null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(value.loans[0]?.id ?? null);
  const selectedAsset = value.assets.find((item) => item.id === selectedAssetId) ?? value.assets[0];
  const selectedLoan = value.loans.find((item) => item.id === selectedLoanId) ?? value.loans[0];

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
    onChange({ ...value, assets: [...value.assets, asset] });
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
    onChange({ ...value, loans: [...value.loans, loan] });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.08)]" aria-label="자산 및 대출 편집">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-950">내 금융 계정</h2>
          <p className="mt-0.5 text-sm text-slate-500">계좌와 대출을 각각 등록해 정확히 계산해요</p>
        </div>
        <WalletCards className="size-6 shrink-0 text-emerald-700" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 bg-slate-50 p-1.5" role="tablist" aria-label="금융 계정 종류">
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
              className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors focus-visible:outline-none ${mode === tab.id ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
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
              {tab.label}<span className="text-emerald-700">{tab.count}</span>
            </button>
          );
        })}
      </div>

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
                  className={`min-h-11 shrink-0 rounded-xl border px-3 text-sm font-bold ${selectedAsset?.id === asset.id ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}
                  onClick={() => setSelectedAssetId(asset.id)}
                >{asset.name}</button>
              ))}
              <button type="button" aria-label="자산 계좌 추가" className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white" onClick={addAsset}>
                <Plus className="size-4" aria-hidden="true" /> 추가
              </button>
            </div>
            {selectedAsset ? (
              <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="계좌 이름"><input aria-label="자산 계좌 이름" className={inputClass} value={selectedAsset.name} onChange={(e) => updateAsset({ name: e.target.value })} /></Field>
                  <Field label="계좌 종류"><select aria-label="자산 계좌 종류" className={inputClass} value={selectedAsset.category} onChange={(e) => updateAsset({ category: e.target.value as AssetAccountCategory })}>{assetCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
                </div>
                <AmountInput label="자산 계좌 잔액" value={selectedAsset.balance} onChange={(balance) => updateAsset({ balance })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="연 수익률 (%)"><input aria-label="자산 연 수익률" className={inputClass} type="number" inputMode="decimal" min={-100} max={100} step="0.1" value={(selectedAsset.annualRate ?? 0) * 100} onChange={(e) => { const rate = Number(e.target.value); updateAsset({ annualRate: Number.isFinite(rate) ? Math.max(-100, Math.min(100, rate)) / 100 : 0 }); }} /></Field>
                  <AmountInput label="월 납입" value={selectedAsset.monthlyContribution ?? 0} onChange={(monthlyContribution) => updateAsset({ monthlyContribution })} />
                </div>
                <button type="button" aria-label="선택한 자산 계좌 삭제" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-rose-700 hover:bg-rose-50" onClick={() => { const remaining = value.assets.filter((asset) => asset.id !== selectedAsset.id); setSelectedAssetId(remaining[0]?.id ?? null); onChange({ ...value, assets: remaining }); }}><Trash2 className="size-4" aria-hidden="true" />계좌 삭제</button>
              </div>
            ) : <EmptyState icon={Building2} text="등록한 자산 계좌가 없습니다" />}
          </div>
        ) : (
          <div role="tabpanel" className="space-y-4" id="finance-loans-panel" aria-labelledby="finance-loans-tab">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {value.loans.map((loan) => <button key={loan.id} type="button" aria-label={`${loan.name} 대출 선택`} aria-pressed={selectedLoan?.id === loan.id} className={`min-h-11 shrink-0 rounded-xl border px-3 text-sm font-bold ${selectedLoan?.id === loan.id ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`} onClick={() => setSelectedLoanId(loan.id)}>{loan.name}</button>)}
              <button type="button" aria-label="대출 추가" className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white" onClick={addLoan}><Plus className="size-4" aria-hidden="true" /> 추가</button>
            </div>
            {selectedLoan ? (
              <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="대출 이름"><input aria-label="대출 이름" className={inputClass} value={selectedLoan.name} onChange={(e) => updateLoan({ name: e.target.value })} /></Field>
                  <Field label="대출 종류"><select aria-label="대출 종류" className={inputClass} value={selectedLoan.category} onChange={(e) => updateLoan({ category: e.target.value as LoanCategory })}>{loanCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
                </div>
                <AmountInput label="대출 원금" value={selectedLoan.principal} onChange={(principal) => updateLoan({ principal })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="연 금리 (%)"><input aria-label="대출 연 금리" className={inputClass} type="number" inputMode="decimal" min={0} max={100} step="0.1" value={selectedLoan.annualRate * 100} onChange={(e) => { const rate = Number(e.target.value); updateLoan({ annualRate: Number.isFinite(rate) ? Math.max(0, Math.min(100, rate)) / 100 : 0 }); }} /></Field>
                  <Field label="남은 기간 (개월)"><input aria-label="대출 남은 개월" className={inputClass} type="number" inputMode="numeric" min={1} max={1200} step={1} value={selectedLoan.remainingMonths} onChange={(e) => updateLoan({ remainingMonths: Math.max(1, Math.min(1200, Math.round(Number(e.target.value) || 1))) })} /></Field>
                </div>
                <fieldset><legend className="mb-2 text-sm font-semibold text-slate-700">상환 방식</legend><div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="상환 방식">{repaymentMethods.map((method) => <label key={method.value} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-sm font-bold ${selectedLoan.repaymentMethod === method.value ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}><input className="sr-only" type="radio" name={`repayment-${selectedLoan.id}`} value={method.value} checked={selectedLoan.repaymentMethod === method.value} onChange={() => updateLoan({ repaymentMethod: method.value })} />{method.label}</label>)}</div></fieldset>
                <button type="button" aria-label="선택한 대출 삭제" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-rose-700 hover:bg-rose-50" onClick={() => { const remaining = value.loans.filter((loan) => loan.id !== selectedLoan.id); setSelectedLoanId(remaining[0]?.id ?? null); onChange({ ...value, loans: remaining }); }}><Trash2 className="size-4" aria-hidden="true" />대출 삭제</button>
              </div>
            ) : <EmptyState icon={BadgeDollarSign} text="등록한 대출이 없습니다" />}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Building2; text: string }) {
  return <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl bg-slate-50 text-center"><Icon className="mb-2 size-6 text-slate-400" aria-hidden="true" /><p className="text-sm font-semibold text-slate-500">{text}</p></div>;
}
