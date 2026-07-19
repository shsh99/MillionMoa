"use client";

import { ExternalLink, Home, Landmark, PiggyBank, Sprout } from "lucide-react";
import type { ReactNode } from "react";

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

function calculateMonthlySaving({
  monthlyDeposit,
  months,
  annualRate,
  contributionRate = 0,
}: {
  monthlyDeposit: number;
  months: number;
  annualRate: number;
  contributionRate?: number;
}) {
  const monthlyRate = annualRate / 12;
  let balance = 0;
  for (let month = 0; month < months; month += 1) {
    balance = (balance + monthlyDeposit) * (1 + monthlyRate);
  }
  const principal = monthlyDeposit * months;
  const governmentContribution = principal * contributionRate;
  const interest = balance - principal;

  return {
    principal,
    interest,
    governmentContribution,
    maturityAmount: principal + interest + governmentContribution,
  };
}

function ProductCard({
  icon,
  title,
  tag,
  headline,
  detail,
  rows,
  sourceUrl,
  sourceLabel,
}: {
  icon: ReactNode;
  title: string;
  tag: string;
  headline: string;
  detail: string;
  rows: Array<[string, string]>;
  sourceUrl: string;
  sourceLabel: string;
}) {
  return (
    <article className="rounded-[22px] border border-[var(--wallet-line)] bg-white p-4 shadow-[var(--wallet-shadow)]">
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
    </article>
  );
}

export function FinancialProductGuide() {
  const youthFutureNormal = calculateMonthlySaving({
    monthlyDeposit: 500_000,
    months: 36,
    annualRate: 0.07,
    contributionRate: 0.06,
  });
  const youthFuturePreferential = calculateMonthlySaving({
    monthlyDeposit: 500_000,
    months: 36,
    annualRate: 0.08,
    contributionRate: 0.12,
  });
  const housingDream = calculateMonthlySaving({
    monthlyDeposit: 100_000,
    months: 24,
    annualRate: 0.045,
  });
  const isaProfitAssumption = 4_000_000;
  const isaLowIncomeTaxSaving = isaProfitAssumption * 0.154;

  return (
    <section aria-labelledby="financial-products-title" className="scroll-mt-36 rounded-[24px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] p-4 shadow-[var(--wallet-shadow)] sm:p-5" id="finance-products">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black text-[var(--wallet-primary-strong)]">상품 혜택 기준</p>
          <h2 id="financial-products-title" className="mt-1 text-xl font-black text-[var(--wallet-ink)]">청년 금융상품 비교</h2>
          <p className="mt-1 text-sm font-semibold leading-5 text-[var(--wallet-muted)]">금리와 세제 혜택은 공식 조건을 기준으로 보여주고, 은행별 우대금리는 실제 가입 전 확인해야 합니다.</p>
        </div>
        <span className="w-fit rounded-full bg-[var(--wallet-mint-soft)] px-3 py-2 text-xs font-black text-[#087a63]">2026-07-18 확인</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <ProductCard
          icon={<Sprout aria-hidden="true" size={21} strokeWidth={1.9} />}
          title="청년미래적금"
          tag="정책형 적금"
          headline={`일반형 만기 ${formatShortMoney(youthFutureNormal.maturityAmount)}`}
          detail="월 50만원, 3년, 연 7% 가정. 취급기관별 우대금리는 실제 가입 화면에서 확인해야 합니다."
          rows={[
            ["납입 한도", "월 50만원 · 36개월"],
            ["일반형 기여금", formatCurrency(youthFutureNormal.governmentContribution)],
            ["우대형 예시", formatShortMoney(youthFuturePreferential.maturityAmount)],
          ]}
          sourceUrl="https://www.kinfa.or.kr/financialProduct/youthFutureSavings.do"
          sourceLabel="서민금융진흥원"
        />
        <ProductCard
          icon={<Home aria-hidden="true" size={21} strokeWidth={1.9} />}
          title="청년 주택드림 청약통장"
          tag="청약·주거"
          headline={`2년 예시 ${formatShortMoney(housingDream.maturityAmount)}`}
          detail="월 10만원, 24개월, 최고 연 4.5% 단순 가정. 실제 우대 적용 기간과 한도는 상품 조건을 따릅니다."
          rows={[
            ["최고 금리", "연 4.5%"],
            ["납입 한도", "회당 월 100만원"],
            ["소득공제", "연 납입 40%"],
            ["비과세", "요건 충족 시 500만원"],
          ]}
          sourceUrl="https://www.molit.go.kr/2024dreamaccount/main.jsp"
          sourceLabel="국토교통부"
        />
        <ProductCard
          icon={<Landmark aria-hidden="true" size={21} strokeWidth={1.9} />}
          title="ISA 서민형"
          tag="절세 계좌"
          headline={`순이익 400만원 절세 ${formatShortMoney(isaLowIncomeTaxSaving)}`}
          detail="서민형은 순이익 400만원까지 비과세, 초과이익은 지방세 포함 9.9% 분리과세 기준입니다."
          rows={[
            ["비과세 한도", "서민형 400만원"],
            ["일반형 한도", "200만원"],
            ["초과이익", "9.9% 분리과세"],
          ]}
          sourceUrl="https://law.kofia.or.kr/service/law/lawFullScreenContent.do?historySeq=1617&seq=343"
          sourceLabel="금융투자협회"
        />
      </div>

      <div className="mt-3 rounded-2xl bg-[var(--wallet-surface-tint)] px-4 py-3 text-xs font-semibold leading-5 text-[var(--wallet-muted)]">
        <p><PiggyBank aria-hidden="true" className="mr-1 inline" size={14} />청년도약계좌는 서민금융진흥원 기준 신규 가입이 2025-12-31까지였으므로, 2026년 계획에서는 기존 가입자 관리나 청년미래적금 갈아타기 검토 항목으로 분리합니다. ISA 비과세 한도 확대안은 미확정이라 계산에 반영하지 않습니다.</p>
      </div>
    </section>
  );
}
