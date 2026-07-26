"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Home, Landmark, PiggyBank, ShieldCheck, SlidersHorizontal, Sprout } from "lucide-react";
import type { ReactNode } from "react";
import { MoneyInput } from "../../components/money-input";
import { calculateInstallmentMaturity, calculateIsaTaxBenefit } from "../../lib/calculators/financial-products";
import { KR_FINANCIAL_PRODUCTS_POLICY_2026 } from "../../lib/policies/kr/2026";

function formatCurrency(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}${new Intl.NumberFormat("ko-KR").format(Math.abs(Math.round(value)))}원`;
}

function formatShortMoney(value: number) {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  if (absolute >= 100_000_000) return `${sign}${(absolute / 100_000_000).toFixed(1).replace(/\.0$/, "")}억원`;
  return `${sign}${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(absolute / 10_000)}만원`;
}

const policy = KR_FINANCIAL_PRODUCTS_POLICY_2026;
type ActiveProduct = "future" | "housing" | "isa";

function ProductCard({
  icon,
  title,
  tag,
  headline,
  detail,
  rows,
  sourceUrl,
  sourceLabel,
  active,
  onSelect,
}: {
  icon: ReactNode;
  title: string;
  tag: string;
  headline: string;
  detail: string;
  rows: Array<[string, string]>;
  sourceUrl: string;
  sourceLabel: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={`rounded-[24px] border bg-white p-4 shadow-[var(--wallet-shadow)] transition-[border-color,transform] ${active ? "border-[var(--wallet-primary)] ring-2 ring-[var(--wallet-primary-soft)]" : "border-[var(--wallet-line)]"}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--wallet-mint-soft)] text-[#087a63]">{icon}</span>
        <div className="min-w-0">
          <p className="w-fit rounded-full bg-[var(--wallet-surface-tint)] px-3 py-1 text-xs font-black text-[var(--wallet-muted)]">{tag}</p>
          <h3 className="mt-2 break-keep text-base font-black text-[var(--wallet-ink)]">{title}</h3>
          <p className="mt-1 text-xl font-black tabular-nums text-[#087a63]">{headline}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[var(--wallet-muted)]">{detail}</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--wallet-surface-tint)] px-3 py-2 text-sm">
            <dt className="font-bold text-[var(--wallet-muted)]">{label}</dt>
            <dd className="text-right font-black tabular-nums text-[var(--wallet-ink)]">{value}</dd>
          </div>
        ))}
      </dl>
      <a className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-2xl bg-[var(--wallet-primary-soft)] px-4 text-xs font-black text-[var(--wallet-primary-strong)]" href={sourceUrl} target="_blank" rel="noreferrer">
        {sourceLabel}<ExternalLink aria-hidden="true" size={14} />
      </a>
      <button className="ml-2 mt-4 inline-flex min-h-10 items-center gap-2 rounded-2xl border border-[var(--wallet-line)] px-4 text-xs font-black text-[var(--wallet-ink)] hover:bg-[var(--wallet-surface-tint)]" onClick={onSelect} type="button">
        계산 열기
      </button>
    </article>
  );
}

export function FinancialProductGuide() {
  const [activeProduct, setActiveProduct] = useState<ActiveProduct>("future");
  const [futureMonthlyDeposit, setFutureMonthlyDeposit] = useState<number>(policy.youthFutureSavings.monthlyDepositLimit);
  const [futureAnnualRatePercent, setFutureAnnualRatePercent] = useState<number>(5);
  const [futurePreferential, setFuturePreferential] = useState(false);
  const [housingMonthlyDeposit, setHousingMonthlyDeposit] = useState<number>(100_000);
  const [housingAnnualRatePercent, setHousingAnnualRatePercent] = useState<number>(4.5);
  const [isaProfit, setIsaProfit] = useState<number>(4_000_000);
  const [isaLowIncome, setIsaLowIncome] = useState(true);

  const futureContributionRate = futurePreferential
    ? policy.youthFutureSavings.preferentialContributionRate
    : policy.youthFutureSavings.normalContributionRate;
  const futureResult = useMemo(() => calculateInstallmentMaturity({
    monthlyDeposit: Math.min(futureMonthlyDeposit, policy.youthFutureSavings.monthlyDepositLimit),
    months: policy.youthFutureSavings.termMonths,
    annualRate: futureAnnualRatePercent / 100,
    governmentContributionRate: futureContributionRate,
    interestTaxRate: 0,
  }), [futureAnnualRatePercent, futureContributionRate, futureMonthlyDeposit]);
  const housingResult = useMemo(() => calculateInstallmentMaturity({
    monthlyDeposit: Math.min(housingMonthlyDeposit, policy.youthHousingDream.monthlyDepositLimit),
    months: 24,
    annualRate: Math.min(housingAnnualRatePercent / 100, policy.youthHousingDream.maximumAnnualRate),
    interestTaxRate: 0,
  }), [housingAnnualRatePercent, housingMonthlyDeposit]);
  const isaResult = useMemo(() => calculateIsaTaxBenefit({
    profit: isaProfit,
    taxFreeProfitLimit: isaLowIncome ? policy.isa.lowIncomeTaxFreeProfitLimit : policy.isa.generalTaxFreeProfitLimit,
    separateTaxRate: policy.isa.separateTaxRate,
    standardTaxRate: policy.isa.standardFinancialIncomeTaxRate,
  }), [isaLowIncome, isaProfit]);
  const estimatedFuture = futureResult.status === "estimated" ? futureResult : null;
  const estimatedHousing = housingResult.status === "estimated" ? housingResult : null;
  const estimatedIsa = isaResult.status === "estimated" ? isaResult : null;

  return (
    <section aria-labelledby="financial-products-title" className="scroll-mt-36 rounded-[24px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] p-4 shadow-[var(--wallet-shadow)] sm:p-5" id="finance-products">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black text-[var(--wallet-primary-strong)]">상품 혜택 기준</p>
          <h2 id="financial-products-title" className="mt-1 text-xl font-black text-[var(--wallet-ink)]">청년 금융상품 비교</h2>
          <p className="mt-1 text-sm font-semibold leading-5 text-[var(--wallet-muted)]">금리와 세제 혜택은 공식 조건을 기준으로 보여주고, 은행별 우대금리는 실제 가입 전 확인해야 합니다.</p>
        </div>
        <span className="w-fit rounded-full bg-[var(--wallet-mint-soft)] px-3 py-2 text-xs font-black text-[#087a63]">{policy.verifiedAt} 확인</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <ProductCard
          icon={<Sprout aria-hidden="true" size={21} strokeWidth={1.9} />}
          title="청년미래적금"
          tag="정책형 적금"
          headline={`예상 만기 ${formatShortMoney(estimatedFuture?.maturityAmount ?? 0)}`}
          detail="공식값은 월 납입한도·기간·정부기여금이고, 금리는 아래 계산기에서 직접 가정합니다."
          rows={[
            ["납입 한도", "월 50만원 · 36개월"],
            ["정부기여금", `일반 6% · 우대 12%`],
            ["현재 가정", `연 ${futureAnnualRatePercent}% · ${futurePreferential ? "우대형" : "일반형"}`],
          ]}
          sourceUrl={policy.youthFutureSavings.source.url}
          sourceLabel="서민금융진흥원"
          active={activeProduct === "future"}
          onSelect={() => setActiveProduct("future")}
        />
        <ProductCard
          icon={<Home aria-hidden="true" size={21} strokeWidth={1.9} />}
          title="청년 주택드림 청약통장"
          tag="청약·주거"
          headline={`2년 예시 ${formatShortMoney(estimatedHousing?.maturityAmount ?? 0)}`}
          detail="최고 금리와 비과세·소득공제 조건은 요건 충족 시 적용되며, 실제 은행 화면에서 재확인해야 합니다."
          rows={[
            ["최고 금리", "연 4.5%"],
            ["납입 한도", "회당 월 100만원"],
            ["소득공제", "연 300만원 한도 · 40%"],
            ["비과세", "요건 충족 시 500만원"],
          ]}
          sourceUrl={policy.youthHousingDream.source.url}
          sourceLabel="국토교통부"
          active={activeProduct === "housing"}
          onSelect={() => setActiveProduct("housing")}
        />
        <ProductCard
          icon={<Landmark aria-hidden="true" size={21} strokeWidth={1.9} />}
          title="ISA 서민형"
          tag="절세 계좌"
          headline={`예상 절세 ${formatShortMoney(estimatedIsa?.taxSaving ?? 0)}`}
          detail="서민형은 순이익 400만원까지 비과세, 초과이익은 지방세 포함 9.9% 분리과세 기준입니다."
          rows={[
            ["비과세 한도", "서민형 400만원"],
            ["일반형 한도", "200만원"],
            ["초과이익", "9.9% 분리과세"],
          ]}
          sourceUrl={policy.isa.source.url}
          sourceLabel="금융위원회"
          active={activeProduct === "isa"}
          onSelect={() => setActiveProduct("isa")}
        />
      </div>

      <section aria-label="상품별 계산 입력" className="mt-4 rounded-[24px] border border-[var(--wallet-line)] bg-white p-4 shadow-[var(--wallet-shadow)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black text-[var(--wallet-primary-strong)]">내 조건으로 다시 계산</p>
            <h3 className="mt-1 text-lg font-black text-[var(--wallet-ink)]">
              {activeProduct === "future" ? "청년미래적금 만기 예상" : activeProduct === "housing" ? "청약통장 저축 예상" : "ISA 세금 절감 예상"}
            </h3>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary-strong)]"><SlidersHorizontal aria-hidden="true" size={21} /></span>
        </div>

        {activeProduct === "future" && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.72fr)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <MoneyInput id="future-saving-monthly" label="월 납입액" value={futureMonthlyDeposit} onChange={setFutureMonthlyDeposit} quickAmountMode="set" quickAmountsManwon={[10, 30, 50]} />
              <label className="text-sm font-bold text-[var(--wallet-ink)]">가정 금리<input aria-label="청년미래적금 가정 금리" className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--wallet-line)] bg-white px-3 font-bold tabular-nums" max={20} min={0} onChange={(event) => setFutureAnnualRatePercent(Number(event.target.value))} step={0.1} type="number" value={futureAnnualRatePercent} /></label>
              <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-[var(--wallet-surface-tint)] px-3 text-sm font-bold text-[var(--wallet-ink)] sm:col-span-2"><input checked={futurePreferential} className="size-5 accent-[var(--wallet-primary)]" onChange={(event) => setFuturePreferential(event.target.checked)} type="checkbox" />우대형 정부기여금 12%로 보기</label>
            </div>
            <ResultSummary rows={[
              ["원금", formatCurrency(estimatedFuture?.principal ?? 0)],
              ["세후 이자", formatCurrency(estimatedFuture?.netInterest ?? 0)],
              ["정부기여금", formatCurrency(estimatedFuture?.governmentContribution ?? 0)],
              ["예상 만기", formatCurrency(estimatedFuture?.maturityAmount ?? 0)],
            ]} />
          </div>
        )}

        {activeProduct === "housing" && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.72fr)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <MoneyInput id="housing-saving-monthly" label="월 납입액" value={housingMonthlyDeposit} onChange={setHousingMonthlyDeposit} quickAmountMode="set" quickAmountsManwon={[2, 10, 50, 100]} />
              <label className="text-sm font-bold text-[var(--wallet-ink)]">적용 금리<input aria-label="청년 주택드림 청약통장 적용 금리" className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--wallet-line)] bg-white px-3 font-bold tabular-nums" max={4.5} min={0} onChange={(event) => setHousingAnnualRatePercent(Number(event.target.value))} step={0.1} type="number" value={housingAnnualRatePercent} /></label>
              <p className="rounded-2xl bg-[var(--wallet-surface-tint)] px-3 py-3 text-xs font-semibold leading-5 text-[var(--wallet-muted)] sm:col-span-2">소득공제는 납입액의 40%, 비과세는 요건 충족 시 이자소득 500만원 한도입니다. 앱 계산은 만기 잔액 예시만 보여주고 공제 환급액은 연말정산 도구에서 별도 확인합니다.</p>
            </div>
            <ResultSummary rows={[
              ["2년 원금", formatCurrency(estimatedHousing?.principal ?? 0)],
              ["예상 이자", formatCurrency(estimatedHousing?.netInterest ?? 0)],
              ["연 소득공제 대상", formatCurrency(Math.min(housingMonthlyDeposit * 12, policy.youthHousingDream.incomeDeductionAnnualPaymentLimit) * policy.youthHousingDream.incomeDeductionRate)],
              ["2년 예상", formatCurrency(estimatedHousing?.maturityAmount ?? 0)],
            ]} />
          </div>
        )}

        {activeProduct === "isa" && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.72fr)]">
            <div className="grid gap-4">
              <MoneyInput id="isa-profit" label="계좌 순이익 가정" value={isaProfit} onChange={setIsaProfit} quickAmountMode="set" quickAmountsManwon={[100, 200, 400, 1000]} />
              <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-[var(--wallet-surface-tint)] px-3 text-sm font-bold text-[var(--wallet-ink)]"><input checked={isaLowIncome} className="size-5 accent-[var(--wallet-primary)]" onChange={(event) => setIsaLowIncome(event.target.checked)} type="checkbox" />서민형 비과세 한도 400만원 적용</label>
            </div>
            <ResultSummary rows={[
              ["일반 금융소득세", formatCurrency(estimatedIsa?.standardTax ?? 0)],
              ["ISA 세금", formatCurrency(estimatedIsa?.isaTax ?? 0)],
              ["한도 초과 이익", formatCurrency(estimatedIsa?.taxableProfitAfterLimit ?? 0)],
              ["예상 절세", formatCurrency(estimatedIsa?.taxSaving ?? 0)],
            ]} />
          </div>
        )}
      </section>

      <div className="mt-3 rounded-2xl bg-[var(--wallet-surface-tint)] px-4 py-3 text-xs font-semibold leading-5 text-[var(--wallet-muted)]">
        <p><PiggyBank aria-hidden="true" className="mr-1 inline" size={14} />청년도약계좌는 서민금융진흥원 기준 신규 가입이 {policy.youthLeapAccount.newEnrollmentUntil}까지였으므로, 2026년 계획에서는 기존 가입자 관리나 청년미래적금 갈아타기 검토 항목으로 분리합니다. ISA 비과세 한도 확대안은 미확정이라 계산에 반영하지 않습니다.</p>
        <p className="mt-2"><ShieldCheck aria-hidden="true" className="mr-1 inline" size={14} />계산은 공식 조건과 사용자가 입력한 금리·순이익 가정을 분리한 추정치입니다.</p>
      </div>
      <section aria-label="공식 출처 검증" className="mt-3 rounded-2xl border border-[var(--wallet-line)] bg-white px-4 py-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-black text-[var(--wallet-ink)]">공식 출처 검증</h3>
          <span className="text-xs font-bold text-[var(--wallet-muted)]">{policy.verifiedAt} 기준</span>
        </div>
        <ul className="mt-3 grid gap-2 text-xs font-bold text-[var(--wallet-muted)] sm:grid-cols-2">
          {policy.sources.map((source) => (
            <li className="min-w-0" key={source.url}>
              <a className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-2xl bg-[var(--wallet-surface-tint)] px-3 text-[var(--wallet-primary-strong)] hover:bg-[var(--wallet-primary-soft)]" href={source.url} rel="noreferrer" target="_blank">
                <span className="truncate">{source.title}</span><ExternalLink aria-hidden="true" className="shrink-0" size={13} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

function ResultSummary({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid content-start gap-2 rounded-[22px] bg-[#17352d] p-4 text-white">
      {rows.map(([label, value], index) => (
        <div className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2 ${index === rows.length - 1 ? "bg-white/12" : "bg-white/6"}`} key={label}>
          <dt className="text-xs font-bold text-[#d7eee7]">{label}</dt>
          <dd className="text-right text-sm font-black tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
