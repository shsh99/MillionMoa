"use client";

import type { ReactNode } from "react";
import { ChartNoAxesCombined, Landmark, PieChart, WalletCards } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AssetAccount,
  FinanceProjectionPoint,
  Loan,
  LoanRepaymentMethod,
  calculateFinanceScenario,
} from "./finance-scenario-model";

type ScenarioResult = ReturnType<typeof calculateFinanceScenario>;

export type FinanceVisualizationsProps = {
  assets: AssetAccount[];
  loans: Loan[];
  scenario: ScenarioResult;
  projection: FinanceProjectionPoint[];
};

export const walletChartColors = ["#5b5bd6", "#49bfa0", "#e89aa0", "#6fa9d8", "#d7a44e", "#8d79d6"] as const;
const assetColors = walletChartColors;

function formatKrw(value: number) {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}${new Intl.NumberFormat("ko-KR").format(Math.abs(rounded))}원`;
}

function formatManwon(value: number, signed = false) {
  const amount = Math.abs(value) / 10_000;
  const sign = value < 0 ? "-" : signed && value > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(amount)}만원`;
}

function axisMoney(value: number) {
  const amount = value / 10_000;
  if (Math.abs(amount) >= 10_000) return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(amount / 10_000)}억`;
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(amount)}만`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(value)}%`;
}

function Panel({
  icon,
  title,
  description,
  children,
  ariaLabel,
  className = "",
  tone,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
  tone: "lilac" | "mint" | "coral" | "blue";
}) {
  const iconToneClass = {
    lilac: "bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary-strong)]",
    mint: "bg-[var(--wallet-mint-soft)] text-[#247a65]",
    coral: "bg-[var(--wallet-coral-soft)] text-[#9a4f58]",
    blue: "bg-[#e8f3fc] text-[#3f739d]",
  }[tone];

  return (
    <section
      aria-label={ariaLabel}
      className={`min-w-0 rounded-[22px] border border-[var(--wallet-line)] bg-[var(--wallet-surface)] p-4 shadow-[var(--wallet-shadow)] sm:p-5 ${className}`}
    >
      <header className="mb-4 flex items-start gap-3">
        <span aria-hidden="true" data-testid={`visualization-icon-${tone}`} className={`grid size-10 shrink-0 place-items-center rounded-2xl ${iconToneClass}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#18202b]">{title}</h2>
          <p className="mt-0.5 text-xs font-medium leading-5 text-[#697587]">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#dfe5ec] bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      {label !== undefined ? <p className="mb-1 text-xs font-semibold text-[#697587]">{label}</p> : null}
      {payload.map((item) => (
        <p key={item.name} className="text-xs font-semibold tabular-nums" style={{ color: item.color }}>
          {item.name} {formatKrw(item.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

const repaymentLabels: Record<LoanRepaymentMethod, string> = {
  "equal-payment": "원리금균등",
  "equal-principal": "원금균등",
  bullet: "만기일시",
};

function InsightTile({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "mint" | "blue" | "coral" | "lilac";
}) {
  const toneClass = {
    mint: "bg-[#f3fffa] text-[#087a63] ring-[#cdece2]",
    blue: "bg-[#f6fbff] text-[#3f739d] ring-[#d8e8f6]",
    coral: "bg-[#fff8f8] text-[#9a4f58] ring-[#f2d5d8]",
    lilac: "bg-[#fbfaff] text-[var(--wallet-primary-strong)] ring-[#ded7f6]",
  }[tone];

  return (
    <div className={`min-w-0 rounded-[20px] px-4 py-3 ring-1 ${toneClass}`}>
      <p className="text-xs font-extrabold opacity-80">{label}</p>
      <p className="mt-1 break-words text-lg font-black tabular-nums [overflow-wrap:anywhere]">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[var(--wallet-muted)]">{detail}</p>
    </div>
  );
}

function ProjectionSummary({ scenario, projection }: { scenario: ScenarioResult; projection: FinanceProjectionPoint[] }) {
  const firstPoint = projection[0];
  const lastPoint = projection[projection.length - 1];
  const tenYearChange = firstPoint && lastPoint ? lastPoint.debtAdjusted - firstPoint.debtAdjusted : 0;
  const monthlyNeed = scenario.monthlyNonLoanExpense + scenario.totalLoanPayment;
  const emergencyMonths = monthlyNeed > 0 ? scenario.totalAssetBalances / monthlyNeed : 0;
  const debtToAssetRatio = scenario.totalAssetBalances > 0
    ? scenario.totalLiabilities / scenario.totalAssetBalances * 100
    : scenario.totalLiabilities > 0 ? 100 : 0;

  return (
    <section aria-label="그래프 핵심 요약" className="grid gap-3 rounded-[24px] border border-[var(--wallet-line)] bg-white p-3 shadow-[var(--wallet-shadow)] sm:grid-cols-3">
      <InsightTile
        label={scenario.rawMonthlySurplus < 0 ? "이번 달 위험" : "이번 달 여유"}
        value={formatManwon(scenario.rawMonthlySurplus, true)}
        detail={scenario.rawMonthlySurplus < 0 ? "자산을 소진하기 전에 지출 조정이 필요" : "적금, 파킹, 대출상환으로 배분 가능"}
        tone={scenario.rawMonthlySurplus < 0 ? "coral" : "mint"}
      />
      <InsightTile
        label="비상금 커버"
        value={`${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(emergencyMonths)}개월`}
        detail={emergencyMonths < 3 ? "초년생 기준 3개월치 확보가 우선" : "월 지출 기준 방어력이 확보된 상태"}
        tone={emergencyMonths < 3 ? "blue" : "mint"}
      />
      <InsightTile
        label="10년 순자산 변화"
        value={formatManwon(tenYearChange, true)}
        detail={`부채/자산 비율 ${formatPercent(debtToAssetRatio)} 기준 시나리오`}
        tone={tenYearChange < 0 ? "coral" : "lilac"}
      />
    </section>
  );
}

export function FinanceVisualizations({ assets, loans, scenario, projection }: FinanceVisualizationsProps) {
  const assetTotal = assets.reduce((sum, asset) => sum + asset.balance, 0);
  const composition = assets
    .filter((asset) => asset.balance > 0)
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      value: asset.balance,
      percent: assetTotal > 0 ? Math.round((asset.balance / assetTotal) * 100) : 0,
    }));
  const cashFlow = [
    { name: "월 수입", value: scenario.monthlyIncome },
    { name: "비대출 지출", value: -scenario.monthlyNonLoanExpense },
    { name: "대출 납입", value: -scenario.totalLoanPayment },
    { name: "남는 돈", value: scenario.rawMonthlySurplus },
  ];
  const flowItems = [
    { label: "월급 입금", value: scenario.monthlyIncome, tone: "mint" },
    { label: "생활·고정비", value: -scenario.monthlyNonLoanExpense, tone: "coral" },
    { label: "대출 납입", value: -scenario.totalLoanPayment, tone: "amber" },
    { label: "마지막 여유", value: scenario.rawMonthlySurplus, tone: scenario.rawMonthlySurplus < 0 ? "coral" : "mint" },
  ];
  const totalLoanInterest = scenario.loanSummaries.reduce((sum, loan) => sum + loan.totalInterest, 0);

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <ProjectionSummary scenario={scenario} projection={projection} />
      </div>

      <Panel
        icon={<ChartNoAxesCombined size={19} strokeWidth={1.8} />}
        title="순자산 전망"
        description="현재 조건이 유지되는 경우의 시나리오"
        className="lg:col-span-2"
        tone="lilac"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[var(--wallet-surface-tint)] px-3 py-2">
          <p className={`text-sm font-black tabular-nums ${scenario.netWorth < 0 ? "text-[#b45309]" : "text-[#087a63]"}`}>
            현재 순자산 {formatManwon(scenario.netWorth)}
          </p>
          <p className="text-xs font-bold text-[#7b8797]">부채 반영선이 실제 목표 판단 기준입니다.</p>
        </div>
        <div role="img" aria-label="향후 10년 순자산과 부채 반영 순자산 추이" className="h-64 min-h-64 w-full sm:h-72 sm:min-h-72">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={projection} margin={{ top: 8, right: 8, bottom: 4, left: -14 }}>
              <defs>
                <linearGradient id="debtAdjustedLine" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#5b5bd6" />
                  <stop offset="100%" stopColor="#49bfa0" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#edf0f4" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="month" tickFormatter={(month) => `${month / 12}년`} tick={{ fill: "#7b8797", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={axisMoney} tick={{ fill: "#7b8797", fontSize: 11 }} axisLine={false} tickLine={false} width={58} />
              <ReferenceLine y={0} stroke="#9aa5b4" strokeWidth={1.25} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, color: "#526072" }} />
              <Line type="monotone" dataKey="baseline" name="대출 제외 자산" stroke="#49bfa0" strokeWidth={2.75} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="debtAdjusted" name="부채 반영 순자산" stroke="url(#debtAdjustedLine)" strokeWidth={3.25} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel icon={<PieChart size={19} strokeWidth={1.8} />} title="자산 구성" description="계좌별 잔액과 비중" ariaLabel="자산 구성" tone="mint">
        {composition.length > 0 ? (
          <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div role="img" aria-label="계좌별 자산 구성 도넛 차트" className="relative h-48 min-h-48 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <RechartsPieChart>
                  <Pie data={composition} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="78%" paddingAngle={2} stroke="none">
                    {composition.map((item, index) => <Cell key={item.id} fill={assetColors[index % assetColors.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <span className="rounded-2xl bg-white/90 px-3 py-2 shadow-sm">
                  <span className="block text-[11px] font-extrabold text-[var(--wallet-muted)]">총자산</span>
                  <strong className="block text-sm font-black text-[var(--wallet-ink)]">{formatManwon(assetTotal)}</strong>
                </span>
              </div>
            </div>
            <ul aria-label="계좌별 자산 비중" className="grid gap-2.5">
              {composition.map((item, index) => (
                <li key={item.id} className="flex min-w-0 items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 font-semibold text-[#344154]">
                    <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: assetColors[index % assetColors.length] }} />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-[#697587] tabular-nums">{formatManwon(item.value)} · {item.percent}%</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="rounded-xl bg-[#f6f8fa] px-4 py-8 text-center text-sm font-medium text-[#697587]">등록된 자산 잔액이 없습니다.</p>
        )}
      </Panel>

      <Panel icon={<WalletCards size={19} strokeWidth={1.8} />} title="이번 달 현금흐름" description="수입은 위로, 지출과 납입은 아래로" tone="blue">
        <ul aria-label="월급 흐름 단계" className="mb-3 grid gap-2 sm:grid-cols-2">
          {flowItems.map((item) => (
            <li key={item.label} className="rounded-2xl bg-[var(--wallet-surface-tint)] px-3 py-2 text-xs font-extrabold text-[#526072]">
              <span className="block">{item.label}</span>
              <span className={`mt-1 block text-sm tabular-nums ${
                item.tone === "mint" ? "text-[#087a63]" : item.tone === "amber" ? "text-[#a56a16]" : "text-[#9a4f58]"
              }`}>{formatManwon(item.value, true)}</span>
            </li>
          ))}
        </ul>
        <div role="img" aria-label="이번 달 수입과 지출 및 대출 납입 비교" className="h-52 min-h-52 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={cashFlow} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#edf0f4" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#697587", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={axisMoney} tick={{ fill: "#7b8797", fontSize: 11 }} axisLine={false} tickLine={false} width={58} />
              <ReferenceLine y={0} stroke="#9aa5b4" strokeWidth={1.25} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="금액" radius={[6, 6, 6, 6]} maxBarSize={38}>
                {cashFlow.map((item) => <Cell key={item.name} fill={item.value >= 0 ? "#49bfa0" : "#e89aa0"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel icon={<Landmark size={19} strokeWidth={1.8} />} title="대출 상환 현황" description="첫 달 예상 납입액 기준" className="lg:col-span-2" tone="coral">
        {loans.length > 0 ? (
          <div className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <InsightTile label="등록 부채" value={formatManwon(scenario.totalLiabilities)} detail={`${loans.length}개 대출 포함`} tone="coral" />
              <InsightTile label="월 납입" value={formatManwon(scenario.totalLoanPayment)} detail="이번 달 현금흐름에서 차감" tone="blue" />
              <InsightTile label="남은 이자" value={formatManwon(totalLoanInterest)} detail="현재 조건으로 갚을 때 예상" tone="lilac" />
            </div>
            <ul aria-label="모바일 대출 상환 카드" className="grid gap-2 md:hidden">
              {loans.map((loan) => {
                const summary = scenario.loanSummaries.find((item) => item.loanId === loan.id);
                return (
                  <li key={loan.id} className="rounded-[20px] border border-[#f0dfe1] bg-[#fffafa] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#18202b]">{loan.name}</p>
                        <p className="mt-1 text-xs font-bold text-[#9a4f58]">{repaymentLabels[loan.repaymentMethod]} · 연 {formatPercent(loan.annualRate * 100)}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-[#9a4f58]">{loan.remainingMonths}개월</span>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-[var(--wallet-muted)]">
                      <div className="rounded-2xl bg-white px-3 py-2"><dt>월 납입</dt><dd className="mt-1 text-sm font-black text-[#18202b]">{formatManwon(summary?.firstMonthlyPayment ?? 0)}</dd></div>
                      <div className="rounded-2xl bg-white px-3 py-2"><dt>잔액</dt><dd className="mt-1 text-sm font-black text-[#18202b]">{formatManwon(loan.principal)}</dd></div>
                    </dl>
                  </li>
                );
              })}
            </ul>
            <div aria-label="대출 상환표 가로 스크롤" className="hidden overflow-x-auto rounded-xl border border-[#e9edf2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wallet-primary)] md:block" role="region" tabIndex={0}>
              <table aria-label="대출별 상환 현황" className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead className="bg-[#f7f9fb] text-xs font-semibold text-[#697587]">
                  <tr>
                    <th className="px-4 py-3" scope="col">대출</th>
                    <th className="px-4 py-3" scope="col">상환 방식</th>
                    <th className="px-4 py-3 text-right" scope="col">월 납입</th>
                    <th className="px-4 py-3 text-right" scope="col">현재 잔액</th>
                    <th className="px-4 py-3 text-right" scope="col">남은 기간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0f3]">
                  {loans.map((loan) => {
                    const summary = scenario.loanSummaries.find((item) => item.loanId === loan.id);
                    return (
                      <tr key={loan.id} className="text-[#344154]">
                        <th className="px-4 py-3.5 font-bold text-[#18202b]" scope="row">{loan.name}</th>
                        <td className="px-4 py-3.5"><span className="rounded-lg bg-[#eef0ff] px-2 py-1 text-xs font-semibold text-[#4f46a5]">{repaymentLabels[loan.repaymentMethod]}</span></td>
                        <td className="px-4 py-3.5 text-right font-semibold tabular-nums">{formatManwon(summary?.firstMonthlyPayment ?? 0)}</td>
                        <td className="px-4 py-3.5 text-right font-semibold tabular-nums">{formatManwon(loan.principal)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{loan.remainingMonths}개월</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="rounded-xl bg-[#f6f8fa] px-4 py-8 text-center text-sm font-medium text-[#697587]">등록된 대출이 없습니다.</p>
        )}
      </Panel>
    </div>
  );
}
