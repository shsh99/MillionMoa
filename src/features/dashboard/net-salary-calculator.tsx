"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Banknote, ChevronDown, ExternalLink, Info, ReceiptText, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { MoneyInput } from "../../components/money-input";
import { calculateNonTaxablePay } from "../../lib/calculators/payroll/non-taxable-pay";
import { calculateSalaryNetPay } from "../../lib/calculators/payroll/salary-net-pay";
import { calculateSmeIncomeTaxReduction } from "../../lib/calculators/payroll/sme-income-tax-reduction";
import type { IncomeTaxProvenance, SalaryNetPayReason, SmeEligibilityType, SmeIncomeTaxReductionReason } from "../../lib/calculators/payroll/types";

type NetSalaryCalculatorProps = {
  currentMonthlyIncome: number;
  onApply: (monthlyIncome: number) => void;
};

const formatCurrency = (value: number) => `${new Intl.NumberFormat("ko-KR").format(Math.round(value))}원`;

const SME_TYPE_LABELS: Record<SmeEligibilityType, string> = {
  youth: "청년",
  "age-60-plus": "60세 이상",
  disabled: "장애인",
  "career-interrupted": "경력단절 근로자",
};

const SALARY_INVALID_MESSAGES: Record<SalaryNetPayReason, string> = {
  "invalid-date": "날짜 형식을 확인하세요.",
  "unsupported-payment-date": "2026년 급여 지급일만 계산할 수 있습니다.",
  "invalid-money": "금액은 0원 이상의 정수로 입력하세요.",
  "invalid-income-tax-provenance": "소득세 입력 기준을 확인하세요.",
  "non-taxable-pay-exceeds-gross": "비과세 금액은 세전 급여를 넘을 수 없습니다.",
  "reduction-exceeds-income-tax": "감면액은 감면 전 소득세를 넘을 수 없습니다.",
};

const SME_REDUCTION_MESSAGES: Record<SmeIncomeTaxReductionReason, string> = {
  "invalid-date": "감면 날짜 형식을 확인하세요.",
  "unsupported-payment-date": "2026년 지급분만 감면 추정을 반영합니다.",
  "invalid-money": "감면 세액은 0원 이상의 정수로 입력하세요.",
  "invalid-military-service": "병역 이행 개월은 0 이상의 정수로 입력하세요.",
  "employment-after-payment": "최초 감면대상 취업일은 급여 지급일보다 늦을 수 없습니다.",
  "employment-before-start": "선택한 유형의 감면 적용 시작일 이전 취업분입니다.",
  "employment-after-deadline": "감면 대상 취업 기한인 2026-12-31 이후입니다.",
  "company-unconfirmed": "회사 요건을 직접 확인해야 추정 반영합니다.",
  "industry-unconfirmed": "업종 요건을 직접 확인해야 추정 반영합니다.",
  "worker-unconfirmed": "근로자 제외 요건을 직접 확인해야 추정 반영합니다.",
  "company-ineligible": "감면 대상 중소기업이 아니면 반영할 수 없습니다.",
  "industry-ineligible": "감면 대상 업종이 아니면 반영할 수 없습니다.",
  "worker-ineligible": "제외 근로자에 해당하면 반영할 수 없습니다.",
  "birth-date-required": "청년 또는 60세 이상 유형은 생년월일이 필요합니다.",
  "age-ineligible": "근로계약 체결일 기준 연령 요건을 벗어났습니다.",
  "reduction-period-not-started": "감면 기간이 아직 시작되지 않았습니다.",
  "reduction-period-expired": "취업일 기준 감면 기간이 지났습니다.",
  "annual-cap-exceeded": "올해 이미 감면받은 세액은 연 200만원 한도를 넘을 수 없습니다.",
};

export function NetSalaryCalculator({ currentMonthlyIncome, onApply }: NetSalaryCalculatorProps) {
  const [grossPay, setGrossPay] = useState(3_200_000);
  const [mealAllowance, setMealAllowance] = useState(0);
  const [selfDrivingAllowance, setSelfDrivingAllowance] = useState(0);
  const [childcareAllowance, setChildcareAllowance] = useState(0);
  const [childcareEligibleChildCount, setChildcareEligibleChildCount] = useState(0);
  const [productionOvertimeAllowance, setProductionOvertimeAllowance] = useState(0);
  const [productionOvertimeAnnualAlreadyUsed, setProductionOvertimeAnnualAlreadyUsed] = useState(0);
  const [productionWorkerEligible, setProductionWorkerEligible] = useState(false);
  const [otherConfirmedNonTaxablePay, setOtherConfirmedNonTaxablePay] = useState(0);
  const [otherConfirmedNonTaxablePayVerified, setOtherConfirmedNonTaxablePayVerified] = useState(false);
  const [incomeTaxBeforeReduction, setIncomeTaxBeforeReduction] = useState(0);
  const [zeroIncomeTaxConfirmed, setZeroIncomeTaxConfirmed] = useState(false);
  const [incomeTaxProvenance, setIncomeTaxProvenance] = useState<IncomeTaxProvenance>("payslip");
  const [familyCount, setFamilyCount] = useState(1);
  const [eligibleChildCount, setEligibleChildCount] = useState(0);
  const [withholdingRatio, setWithholdingRatio] = useState(100);
  const [smeReductionEnabled, setSmeReductionEnabled] = useState(false);
  const [eligibilityType, setEligibilityType] = useState<SmeEligibilityType>("youth");
  const [paymentDate, setPaymentDate] = useState("2026-07-25");
  const [employmentDate, setEmploymentDate] = useState("2024-07-15");
  const [birthDate, setBirthDate] = useState("1995-07-16");
  const [militaryServiceMonths, setMilitaryServiceMonths] = useState(0);
  const [companyConfirmed, setCompanyConfirmed] = useState(false);
  const [industryConfirmed, setIndustryConfirmed] = useState(false);
  const [workerConfirmed, setWorkerConfirmed] = useState(false);
  const [annualReductionAlreadyUsed, setAnnualReductionAlreadyUsed] = useState(0);
  const [pensionBase, setPensionBase] = useState(3_000_000);
  const [healthBase, setHealthBase] = useState(3_000_000);
  const [employmentBase, setEmploymentBase] = useState(3_000_000);
  const [useCustomBases, setUseCustomBases] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const nonTaxable = useMemo(() => calculateNonTaxablePay({
    mealAllowance,
    selfDrivingAllowance,
    childcareAllowance,
    childcareEligibleChildCount,
    productionOvertimeAllowance,
    productionOvertimeAnnualAlreadyUsed,
    productionWorkerEligible,
    otherConfirmedNonTaxablePay,
    otherConfirmedNonTaxablePayVerified,
  }), [childcareAllowance, childcareEligibleChildCount, mealAllowance, otherConfirmedNonTaxablePay, otherConfirmedNonTaxablePayVerified, productionOvertimeAllowance, productionOvertimeAnnualAlreadyUsed, productionWorkerEligible, selfDrivingAllowance]);
  const nonTaxablePay = nonTaxable.status === "estimated" ? nonTaxable.totalNonTaxablePay : 0;
  const taxableMonthlyPay = Math.max(0, grossPay - nonTaxablePay);

  const reduction = useMemo(() => smeReductionEnabled
    ? calculateSmeIncomeTaxReduction({
        paymentDate,
        initialEligibleEmploymentDate: employmentDate,
        eligibilityType,
        birthDate,
        militaryServiceMonths,
        companyEligibility: companyConfirmed ? "confirmed" : "unconfirmed",
        industryEligibility: industryConfirmed ? "confirmed" : "unconfirmed",
        workerEligibility: workerConfirmed ? "confirmed" : "unconfirmed",
        incomeTaxBeforeReduction,
        annualReductionAlreadyUsed,
      })
    : null, [annualReductionAlreadyUsed, birthDate, companyConfirmed, eligibilityType, employmentDate, incomeTaxBeforeReduction, industryConfirmed, militaryServiceMonths, paymentDate, smeReductionEnabled, workerConfirmed]);

  const reductionAmount = reduction?.status === "eligible-estimate" ? reduction.estimatedReduction : 0;
  const result = useMemo(() => calculateSalaryNetPay({
    paymentDate,
    grossMonthlyPay: grossPay,
    nonTaxableMonthlyPay: nonTaxablePay,
    incomeTaxBeforeReduction: { amount: incomeTaxBeforeReduction, provenance: incomeTaxProvenance },
    incomeTaxReduction: Math.min(reductionAmount, incomeTaxBeforeReduction),
    ...(useCustomBases ? {
      insuranceBases: {
        pensionStandardMonthlyIncome: pensionBase,
        healthMonthlyRemuneration: healthBase,
        employmentMonthlyRemuneration: employmentBase,
      },
    } : {}),
  }), [employmentBase, grossPay, healthBase, incomeTaxBeforeReduction, incomeTaxProvenance, nonTaxablePay, paymentDate, pensionBase, reductionAmount, useCustomBases]);
  const estimatedResult = result.status === "estimated" ? result : null;
  const salaryInvalidMessage = result.status === "invalid" ? SALARY_INVALID_MESSAGES[result.reason] : null;
  const nonTaxableInvalidMessage = nonTaxable.status === "invalid" ? "비과세 항목 금액과 자녀 수는 0 이상의 정수로 입력하세요." : null;
  const canApplyResult = Boolean(estimatedResult) && !nonTaxableInvalidMessage && (incomeTaxBeforeReduction > 0 || zeroIncomeTaxConfirmed);
  const reductionMessage = reduction && reduction.status !== "eligible-estimate" ? SME_REDUCTION_MESSAGES[reduction.reason] : null;

  const deductionRows = [
    ["국민연금", estimatedResult?.deductions.nationalPension ?? 0],
    ["건강보험", estimatedResult?.deductions.healthInsurance ?? 0],
    ["장기요양", estimatedResult?.deductions.longTermCareInsurance ?? 0],
    ["고용보험", estimatedResult?.deductions.employmentInsurance ?? 0],
    ["소득세", estimatedResult?.deductions.incomeTax ?? 0],
    ["지방소득세", estimatedResult?.deductions.localIncomeTax ?? 0],
  ] as const;
  const maxDeduction = Math.max(...deductionRows.map(([, value]) => value), 1);

  return (
    <section aria-labelledby="net-salary-title" className="overflow-hidden rounded-[24px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] shadow-[var(--wallet-shadow)]">
      <div className="bg-[var(--wallet-primary-soft)] px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-extrabold text-[var(--wallet-primary-strong)]">2026 급여 도구</p><h2 id="net-salary-title" className="mt-1 text-xl font-black text-[var(--wallet-ink)]">내 월급 실수령액</h2><p className="mt-1 text-sm font-semibold text-[var(--wallet-muted)]">급여명세서와 맞춰 보고 계획에 바로 연결해요.</p></div>
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-[var(--wallet-primary-strong)]"><ReceiptText aria-hidden="true" size={22} /></span>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.82fr)]">
        <div className="space-y-5">
          <label className="block text-sm font-bold text-[var(--wallet-ink)]">급여 지급일<input aria-label="급여 지급일" className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--wallet-line)] bg-white px-3 font-bold" max="2026-12-31" min="2026-01-01" onChange={(event) => setPaymentDate(event.target.value)} type="date" value={paymentDate} /></label>
          <MoneyInput id="salary-gross" label="월 세전 급여" value={grossPay} onChange={setGrossPay} quickAmountsManwon={[10, 50, 100, 500]} />
          <div className="rounded-[22px] border border-[#d9f0e8] bg-[#f8fffc] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold text-[#247a65]">비과세 항목</p>
                <h3 className="mt-1 text-base font-black text-[var(--wallet-ink)]">급여명세서 항목별로 입력</h3>
              </div>
              <span className="grid size-10 place-items-center rounded-2xl bg-white text-[#247a65]"><WalletCards aria-hidden="true" size={20} /></span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <MoneyInput id="salary-meal-allowance" label="식대" value={mealAllowance} onChange={setMealAllowance} quickAmountsManwon={[10, 20]} />
              <MoneyInput id="salary-car-allowance" label="자기차량운전보조금" value={selfDrivingAllowance} onChange={setSelfDrivingAllowance} quickAmountsManwon={[10, 20]} />
              <MoneyInput id="salary-childcare-allowance" label="6세 이하 보육수당" value={childcareAllowance} onChange={setChildcareAllowance} quickAmountsManwon={[10, 20]} />
              <MoneyInput id="salary-production-overtime" label="생산직 연장·야간·휴일수당" value={productionOvertimeAllowance} onChange={setProductionOvertimeAllowance} quickAmountsManwon={[10, 20]} />
            </div>
            <label className="mt-4 block text-xs font-bold text-[var(--wallet-muted)]">6세 이하 자녀 수<input aria-label="6세 이하 자녀 수" className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--wallet-line)] bg-white px-3 font-bold tabular-nums" min={0} max={10} onChange={(event) => setChildcareEligibleChildCount(Number(event.target.value))} type="number" value={childcareEligibleChildCount} /></label>
            <div className="mt-4">
              <MoneyInput id="salary-production-used" label="올해 이미 비과세 반영한 생산직 수당" value={productionOvertimeAnnualAlreadyUsed} onChange={setProductionOvertimeAnnualAlreadyUsed} quickAmountsManwon={[20, 100]} />
            </div>
            <label className="mt-4 flex min-h-11 items-center gap-3 rounded-2xl bg-white px-3 text-xs font-bold text-[var(--wallet-muted)]">
              <input checked={productionWorkerEligible} className="size-5 accent-[var(--wallet-primary)]" onChange={(event) => setProductionWorkerEligible(event.target.checked)} type="checkbox" />
              생산직 수당 비과세 요건을 확인했어요(월정액급여 260만원 이하, 전년도 총급여 3,700만원 이하 등)
            </label>
            <div className="mt-4">
              <MoneyInput id="salary-other-nontaxable" label="기타 비과세" value={otherConfirmedNonTaxablePay} onChange={setOtherConfirmedNonTaxablePay} quickAmountsManwon={[10, 20]} />
            </div>
            <label className="mt-4 flex min-h-11 items-center gap-3 rounded-2xl bg-white px-3 text-xs font-bold text-[var(--wallet-muted)]">
              <input checked={otherConfirmedNonTaxablePayVerified} className="size-5 accent-[var(--wallet-primary)]" onChange={(event) => setOtherConfirmedNonTaxablePayVerified(event.target.checked)} type="checkbox" />
              기타 비과세 금액이 급여명세서에 비과세로 확정되어 있어요
            </label>
            {nonTaxableInvalidMessage && <p className="mt-3 rounded-xl bg-[var(--wallet-coral-soft)] px-3 py-2 text-xs font-bold text-[#9a4f58]">{nonTaxableInvalidMessage}</p>}
            {nonTaxable.status === "estimated" && (
              <div className="mt-4 grid gap-3 rounded-2xl bg-white p-3 text-xs font-bold text-[var(--wallet-muted)] sm:grid-cols-2">
                <div><span className="block">비과세 합계</span><strong className="mt-1 block text-lg text-[#247a65]">{formatCurrency(nonTaxable.totalNonTaxablePay)}</strong></div>
                <div><span className="block">홈택스 월급여 입력값</span><strong className="mt-1 block text-lg text-[var(--wallet-ink)]">{formatCurrency(taxableMonthlyPay)}</strong></div>
                {nonTaxable.items.map((item) => (
                  <div key={item.key} className="rounded-xl bg-[var(--wallet-surface-tint)] px-3 py-2">
                    <span className="block text-[var(--wallet-ink)]">{item.label} · {item.limitLabel}</span>
                    <span>반영 {formatCurrency(item.applied)}{item.taxableExcess > 0 ? ` · 초과 과세 ${formatCurrency(item.taxableExcess)}` : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-[22px] border border-[var(--wallet-line)] bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-[var(--wallet-ink)]">소득세 입력 기준<select aria-label="소득세 입력 기준" className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--wallet-line)] bg-white px-3 font-bold" onChange={(event) => setIncomeTaxProvenance(event.target.value as IncomeTaxProvenance)} value={incomeTaxProvenance}><option value="payslip">급여명세서</option><option value="official-table">홈택스 간이세액표</option></select></label>
              <MoneyInput id="salary-income-tax" label="월 소득세" value={incomeTaxBeforeReduction} onChange={setIncomeTaxBeforeReduction} quickAmountsManwon={[1, 5]} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold text-[var(--wallet-muted)]">공제대상 가족 수<input aria-label="공제대상 가족 수" className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--wallet-line)] px-3 font-bold tabular-nums" min={1} max={11} onChange={(event) => setFamilyCount(Number(event.target.value))} type="number" value={familyCount} /></label>
              <label className="text-xs font-bold text-[var(--wallet-muted)]">8-20세 자녀 수<input aria-label="8-20세 자녀 수" className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--wallet-line)] px-3 font-bold tabular-nums" min={0} max={11} onChange={(event) => setEligibleChildCount(Number(event.target.value))} type="number" value={eligibleChildCount} /></label>
              <label className="text-xs font-bold text-[var(--wallet-muted)]">원천징수율<select aria-label="원천징수율" className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--wallet-line)] bg-white px-3 font-bold" onChange={(event) => setWithholdingRatio(Number(event.target.value))} value={withholdingRatio}><option value={80}>80%</option><option value={100}>100%</option><option value={120}>120%</option></select></label>
            </div>
            <p className="mt-3 flex gap-2 rounded-2xl bg-[var(--wallet-surface-tint)] p-3 text-xs font-semibold leading-5 text-[var(--wallet-muted)]"><Info aria-hidden="true" className="mt-0.5 shrink-0" size={15} />{incomeTaxBeforeReduction === 0 ? "소득세 입력 필요. " : ""}2026.03.01 이후 홈택스 근로소득 간이세액표에서 월급여 {formatCurrency(taxableMonthlyPay)}, 가족 {familyCount}명, 8-20세 자녀 {eligibleChildCount}명, 원천징수율 {withholdingRatio}%로 조회한 소득세 또는 급여명세서 금액을 입력하세요.</p>
            <p className="mt-2 text-xs font-bold text-[var(--wallet-muted)]">가족 수·자녀 수·원천징수율은 홈택스 조회를 돕는 값이며, 입력한 월 소득세 금액을 자동 보정하지 않습니다.</p>
            {incomeTaxBeforeReduction === 0 && (
              <label className="mt-3 flex min-h-11 items-center gap-3 rounded-2xl bg-[#fff8e8] px-3 text-xs font-bold text-[#8a5b08]">
                <input checked={zeroIncomeTaxConfirmed} className="size-5 accent-[var(--wallet-primary)]" onChange={(event) => setZeroIncomeTaxConfirmed(event.target.checked)} type="checkbox" />
                홈택스 또는 급여명세서에서 월 소득세 0원을 확인했어요
              </label>
            )}
            <a className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-2xl bg-[var(--wallet-primary-soft)] px-4 text-xs font-black text-[var(--wallet-primary-strong)]" href="https://hometax.go.kr/websquare/websquare.html?tm2lIdx=410600000&tm3lIdx=4106030000&tmIdx=41&w2xPath=%2Fui%2Fpp%2Findex_pp.xml" target="_blank" rel="noreferrer">홈택스 간이세액표 열기<ExternalLink aria-hidden="true" size={14} /></a>
          </div>

          <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#cdece2] bg-[var(--wallet-mint-soft)] px-4 py-3">
            <span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-white text-[#247a65]"><Sparkles aria-hidden="true" size={18} /></span><span><strong className="block text-sm text-[var(--wallet-ink)]">중소기업 취업자 소득세 감면</strong><span className="text-xs font-semibold text-[var(--wallet-muted)]">회사·업종·근로자 요건 확인 시 예상 감면액 반영</span></span></span>
            <input aria-label="중소기업 취업자 소득세 감면 적용" checked={smeReductionEnabled} className="size-5 accent-[var(--wallet-primary)]" onChange={(event) => setSmeReductionEnabled(event.target.checked)} type="checkbox" />
          </label>
          {smeReductionEnabled && <div className="space-y-4 rounded-2xl border border-[#cdece2] px-4 py-4"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-extrabold text-[#247a65]"><BadgeCheck aria-hidden="true" size={18} />감면 자격 확인</span><span className="text-xs font-bold text-[var(--wallet-muted)]">{eligibilityType === "youth" ? "90%" : "70%"} 예상 · 연 200만원 한도</span></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">감면 대상 유형<select aria-label="감면 대상 유형" className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--wallet-line)] bg-white px-3 font-bold" onChange={(event) => setEligibilityType(event.target.value as SmeEligibilityType)} value={eligibilityType}>{Object.entries(SME_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-bold">최초 감면대상 취업일<input aria-label="최초 감면대상 취업일" className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--wallet-line)] px-3" onChange={(event) => setEmploymentDate(event.target.value)} type="date" value={employmentDate} /></label>{(eligibilityType === "youth" || eligibilityType === "age-60-plus") && <label className="text-sm font-bold">생년월일<input aria-label="생년월일" className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--wallet-line)] px-3" onChange={(event) => setBirthDate(event.target.value)} type="date" value={birthDate} /></label>}{eligibilityType === "youth" && <label className="text-sm font-bold">병역 이행 개월<input aria-label="병역 이행 개월" className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--wallet-line)] px-3 font-bold tabular-nums" max={72} min={0} onChange={(event) => setMilitaryServiceMonths(Number(event.target.value))} type="number" value={militaryServiceMonths} /></label>}</div><fieldset className="space-y-2"><legend className="text-sm font-bold">아래 조건을 직접 확인했어요</legend>{[["회사가 감면 대상 중소기업이에요", companyConfirmed, setCompanyConfirmed],["회사의 주 업종이 감면 대상이에요", industryConfirmed, setIndustryConfirmed],["임원·최대주주 친족·일용근로자 등 제외 근로자가 아니에요", workerConfirmed, setWorkerConfirmed]] .map(([label, checked, setter]) => <label className="flex min-h-11 items-center gap-3 rounded-xl bg-[var(--wallet-surface-tint)] px-3 text-xs font-bold" key={String(label)}><input checked={Boolean(checked)} className="size-5 accent-[var(--wallet-primary)]" onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)} type="checkbox" />{String(label)}</label>)}</fieldset><MoneyInput id="salary-reduction-used" label="올해 이미 감면받은 세액" value={annualReductionAlreadyUsed} onChange={setAnnualReductionAlreadyUsed} quickAmountsManwon={[10, 50, 100]} />{reductionMessage && <p className="rounded-xl bg-[var(--wallet-coral-soft)] px-3 py-2 text-xs font-bold text-[#9a4f58]">{reductionMessage}</p>}</div>}

          <details className="rounded-2xl border border-[var(--wallet-line)] px-4">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-extrabold text-[var(--wallet-ink)]">보험 기준액 직접 맞추기<ChevronDown aria-hidden="true" size={18} /></summary>
            <div className="grid gap-4 border-t border-[var(--wallet-line)] py-4"><label className="flex min-h-11 items-center gap-3 text-sm font-bold"><input checked={useCustomBases} className="size-5 accent-[var(--wallet-primary)]" onChange={(event) => setUseCustomBases(event.target.checked)} type="checkbox" />직접 입력한 보험 기준액 사용</label><MoneyInput id="salary-pension-base" label="국민연금 기준소득월액" value={pensionBase} onChange={setPensionBase} /><MoneyInput id="salary-health-base" label="건강보험 보수월액" value={healthBase} onChange={setHealthBase} /><MoneyInput id="salary-employment-base" label="고용보험 보수월액" value={employmentBase} onChange={setEmploymentBase} /></div>
          </details>
        </div>

        <aside className="rounded-[22px] bg-[#17352d] p-5 text-white">
          <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-[#d7eee7]">예상 월 실수령액</p><Banknote aria-hidden="true" className="text-[#8ee0c8]" size={22} /></div>
          <p className="mt-2 break-words text-3xl font-black tabular-nums" data-testid="net-salary-result">{estimatedResult ? formatCurrency(estimatedResult.estimatedMonthlyTakeHomePay) : "계산 불가"}</p>
          <p className="mt-2 text-xs font-semibold text-[#b8d5cd]">{estimatedResult ? `현재 계획 ${formatCurrency(currentMonthlyIncome)} 대비 ${formatCurrency(estimatedResult.estimatedMonthlyTakeHomePay - currentMonthlyIncome)}` : salaryInvalidMessage}</p>
          <div className="my-5 h-px bg-white/15" />
          <div className="space-y-3" aria-label="월 공제 항목 시각화">
            {deductionRows.map(([label, value]) => <div key={label}><div className="mb-1 flex justify-between gap-3 text-xs font-semibold"><span className="text-[#d7eee7]">{label}</span><span data-testid={label === "소득세" ? "income-tax-result" : undefined}>{formatCurrency(value)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#8ee0c8]" style={{ width: `${value === 0 ? 0 : Math.max(3, (value / maxDeduction) * 100)}%` }} /></div></div>)}
          </div>
          <div className="mt-5 flex justify-between border-t border-white/15 pt-4 text-sm font-bold"><span className="text-[#d7eee7]">총 공제</span><span>{formatCurrency(estimatedResult?.deductions.total ?? 0)}</span></div>
          {estimatedResult && <ul className="mt-5 space-y-2 rounded-2xl bg-white/10 p-3 text-xs font-semibold leading-5 text-[#d7eee7]">{estimatedResult.assumptions.map((assumption) => <li key={assumption}>- {assumption}</li>)}<li>- 적용하면 이 브라우저의 내 계획 월 수입으로 저장됩니다.</li></ul>}
          <button className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#8ee0c8] px-4 text-sm font-black text-[#253e39] enabled:hover:bg-[#a3ead5] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-white" disabled={!canApplyResult || estimatedResult?.estimatedMonthlyTakeHomePay === currentMonthlyIncome} onClick={() => { if (!estimatedResult || !canApplyResult) return; onApply(estimatedResult.estimatedMonthlyTakeHomePay); setAppliedNotice(`${formatCurrency(estimatedResult.estimatedMonthlyTakeHomePay)}을 이 기기의 내 계획 월 수입으로 저장했어요.`); }} type="button"><ShieldCheck aria-hidden="true" size={18} />{estimatedResult?.estimatedMonthlyTakeHomePay === currentMonthlyIncome ? "현재 계획에 반영됨" : "계산한 실수령액을 이 기기에 저장되는 내 계획의 월 수입으로 적용"}</button>
          {appliedNotice && <p aria-live="polite" className="mt-3 text-center text-xs font-bold text-[#8ee0c8]">{appliedNotice}</p>}
        </aside>
      </div>
      <div className="border-t border-[var(--wallet-line)] bg-[var(--wallet-surface-tint)] px-5 py-4 text-xs font-semibold leading-5 text-[var(--wallet-muted)] sm:px-6">보험료는 2026년 공단 요율, 소득세는 2026.03.01 이후 홈택스 근로소득 간이세액표 또는 급여명세서 입력값, 비과세는 국세청·법령상 항목별 한도를 기준으로 반영합니다. 실제 고지 기준액, 회사 자격, 급여 항목과 원 단위 절사에 따라 달라질 수 있습니다.</div>
    </section>
  );
}
