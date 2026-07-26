"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Home, PiggyBank, ReceiptText, ShieldCheck } from "lucide-react";
import { MoneyInput } from "../../components/money-input";
import { calculateYearEndTaxCredits } from "../../lib/calculators/year-end-tax";
import { KR_YEAR_END_TAX_POLICY_2026 } from "../../lib/policies/kr/2026";
import { PolicySourcePanel } from "./policy-source-panel";

type YearEndTaxCalculatorProps = {
  currentMonthlySurplus: number;
};

const formatCurrency = (value: number) => `${new Intl.NumberFormat("ko-KR").format(Math.round(value))}원`;
const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export function YearEndTaxCalculator({ currentMonthlySurplus }: YearEndTaxCalculatorProps) {
  const [annualGrossPay, setAnnualGrossPay] = useState(48_000_000);
  const [prepaidIncomeTax, setPrepaidIncomeTax] = useState(900_000);
  const [pensionSavingsContribution, setPensionSavingsContribution] = useState(3_600_000);
  const [retirementPensionContribution, setRetirementPensionContribution] = useState(3_000_000);
  const [monthlyRentPaid, setMonthlyRentPaid] = useState(600_000);
  const [rentHouseholdEligible, setRentHouseholdEligible] = useState(false);
  const [rentHousingEligible, setRentHousingEligible] = useState(false);
  const [rentContractEligible, setRentContractEligible] = useState(false);

  const result = useMemo(
    () =>
      calculateYearEndTaxCredits({
        annualGrossPay,
        prepaidIncomeTax,
        pensionSavingsContribution,
        retirementPensionContribution,
        monthlyRentPaid,
        rentHouseholdEligible,
        rentHousingEligible,
        rentContractEligible,
      }),
    [
      annualGrossPay,
      monthlyRentPaid,
      pensionSavingsContribution,
      prepaidIncomeTax,
      rentContractEligible,
      rentHouseholdEligible,
      rentHousingEligible,
      retirementPensionContribution,
    ],
  );
  const estimated = result.status === "estimated" ? result : null;
  const monthlyImpact = estimated ? Math.floor(estimated.refundCandidate / 12) : 0;

  return (
    <section aria-labelledby="year-end-tax-title" className="overflow-hidden rounded-[24px] border border-[#d8e8df] bg-[var(--wallet-surface)] shadow-[var(--wallet-shadow)]">
      <div className="bg-[#eef8f1] px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold text-[#247a65]">연말정산 도구</p>
            <h2 id="year-end-tax-title" className="mt-1 text-xl font-black text-[var(--wallet-ink)]">세액공제 환급 후보</h2>
            <p className="mt-1 text-sm font-semibold text-[var(--wallet-muted)]">연금계좌와 월세 공제가 1억 계획에 줄 수 있는 영향을 봅니다.</p>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-[#247a65]"><CalendarCheck aria-hidden="true" size={22} /></span>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.78fr)]">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <MoneyInput id="tax-annual-gross" label="연간 총급여" value={annualGrossPay} onChange={setAnnualGrossPay} quickAmountsManwon={[100, 500, 1000]} />
            <MoneyInput id="tax-prepaid" label="올해 기납부 소득세" value={prepaidIncomeTax} onChange={setPrepaidIncomeTax} quickAmountsManwon={[10, 50, 100]} />
          </div>

          <div className="rounded-2xl border border-[var(--wallet-line)] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[var(--wallet-ink)]"><PiggyBank aria-hidden="true" size={18} />연금계좌 납입</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <MoneyInput id="tax-pension-saving" label="연금저축 납입액" value={pensionSavingsContribution} onChange={setPensionSavingsContribution} quickAmountsManwon={[10, 50, 100]} />
              <MoneyInput id="tax-retirement-pension" label="IRP·퇴직연금 납입액" value={retirementPensionContribution} onChange={setRetirementPensionContribution} quickAmountsManwon={[10, 50, 100]} />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-[#d8e8df] p-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#247a65]"><Home aria-hidden="true" size={18} />월세 세액공제</div>
            <MoneyInput id="tax-monthly-rent" label="월세 납부액" value={monthlyRentPaid} onChange={setMonthlyRentPaid} quickAmountsManwon={[10, 50, 100]} />
            <fieldset className="space-y-2">
              <legend className="text-sm font-bold text-[var(--wallet-ink)]">월세 요건 확인</legend>
              <label className="flex min-h-11 items-center gap-3 rounded-xl bg-[var(--wallet-surface-tint)] px-3 text-xs font-bold text-[var(--wallet-ink)]">
                <input checked={rentHouseholdEligible} className="size-5 accent-[var(--wallet-primary)]" onChange={(event) => setRentHouseholdEligible(event.target.checked)} type="checkbox" />
                무주택 세대 요건을 확인했어요
              </label>
              <label className="flex min-h-11 items-center gap-3 rounded-xl bg-[var(--wallet-surface-tint)] px-3 text-xs font-bold text-[var(--wallet-ink)]">
                <input checked={rentHousingEligible} className="size-5 accent-[var(--wallet-primary)]" onChange={(event) => setRentHousingEligible(event.target.checked)} type="checkbox" />
                국민주택규모 또는 기준시가 4억원 이하 주택이에요
              </label>
              <label className="flex min-h-11 items-center gap-3 rounded-xl bg-[var(--wallet-surface-tint)] px-3 text-xs font-bold text-[var(--wallet-ink)]">
                <input checked={rentContractEligible} className="size-5 accent-[var(--wallet-primary)]" onChange={(event) => setRentContractEligible(event.target.checked)} type="checkbox" />
                임대차계약·전입 주소 요건을 확인했어요
              </label>
            </fieldset>
          </div>
        </div>

        <aside className="rounded-[22px] bg-[#18352e] p-5 text-white">
          <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-[#d9f5ec]">예상 세액공제</p><ReceiptText aria-hidden="true" className="text-[#9fe6cf]" size={22} /></div>
          <p className="mt-2 break-words text-3xl font-black tabular-nums" data-testid="year-end-credit-total">{estimated ? formatCurrency(estimated.totalCredit) : "계산 불가"}</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-[#c6e4db]">기납부 소득세 기준 환급 후보 {formatCurrency(estimated?.refundCandidate ?? 0)}</p>

          <div className="my-5 h-px bg-white/15" />
          <dl className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm"><dt className="text-[#c6e4db]">연금계좌</dt><dd className="font-bold tabular-nums">{formatCurrency(estimated?.pensionAccountCredit ?? 0)}</dd></div>
            <div className="flex items-center justify-between gap-3 text-sm"><dt className="text-[#c6e4db]">월세</dt><dd className="font-bold tabular-nums">{formatCurrency(estimated?.monthlyRentCredit ?? 0)}</dd></div>
            <div className="flex items-center justify-between gap-3 text-sm"><dt className="text-[#c6e4db]">연 환급 후보 12개월 환산</dt><dd className="font-bold tabular-nums">{formatCurrency(monthlyImpact)}</dd></div>
            <div className="flex items-center justify-between gap-3 text-sm"><dt className="text-[#c6e4db]">계획상 월평균 여유</dt><dd className="font-bold tabular-nums">{formatCurrency(currentMonthlySurplus + monthlyImpact)}</dd></div>
          </dl>

          {estimated && (
            <div className="mt-5 grid gap-2 rounded-2xl bg-white/10 p-3 text-xs font-semibold leading-5 text-[#d9f5ec]">
              <p>연금계좌 공제율 {formatPercent(estimated.pensionAccount.rate)} · 남은 한도 {formatCurrency(estimated.pensionAccount.remainingCapacity)}</p>
              <p>월세 공제율 {formatPercent(estimated.monthlyRent.rate)} · 반영 월세 {formatCurrency(estimated.monthlyRent.eligibleAnnualRent)}</p>
              {estimated.monthlyRent.status === "not-eligible" && <p className="text-[#ffd6d6]">월세 공제는 총급여 또는 주택 요건을 확인해야 반영됩니다.</p>}
            </div>
          )}

          <ul className="mt-5 space-y-2 text-xs font-semibold leading-5 text-[#c6e4db]">
            {estimated?.assumptions.map((assumption) => <li key={assumption}>- {assumption}</li>)}
          </ul>

          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#9fe6cf] px-3 py-3 text-xs font-black text-[#18352e]"><ShieldCheck aria-hidden="true" size={17} />홈택스 예상세액 계산 결과와 대조하세요.</div>
        </aside>
      </div>
      <div className="border-t border-[var(--wallet-line)] bg-[var(--wallet-surface)] px-5 py-4 sm:px-6">
        <PolicySourcePanel
          notes={[
            "연금계좌 세액공제는 총급여 구간별 공제율과 연금저축, IRP 합산 한도를 분리해 추정합니다.",
            "월세 세액공제는 무주택 세대, 대상 주택, 임대차계약과 전입 요건을 모두 확인한 경우에만 반영합니다.",
            "환급 후보는 전체 결정세액이 아니라 입력한 공제 항목의 효과이며, 기납부 소득세를 넘지 않도록 제한합니다.",
          ]}
          sources={KR_YEAR_END_TAX_POLICY_2026.sources}
          title="연말정산 공식 기준"
          verifiedAt={KR_YEAR_END_TAX_POLICY_2026.verifiedAt}
        />
      </div>
    </section>
  );
}
