import { GoalQuickPlanner } from "./goal-quick-planner";

const metrics = [
  { label: "현재 자산", value: "0원", caption: "연동 전" },
  { label: "예상 달성일", value: "입력 필요", caption: "월 저축액 입력 필요" },
  { label: "이번 달 생활비", value: "0원 남음", caption: "생활비 통장 기준" },
  { label: "최단경로 단축", value: "0개월", caption: "추가 납입 전" },
];

const actions = [
  "월급 입금일 기준으로 생활비, 저축, 투자 통장 배분안을 비교합니다.",
  "연금저축/IRP 세액공제 한도와 ISA 납입 여력을 함께 확인합니다.",
  "성과급은 사용자가 설정한 비상금 기준을 반영해 목표 단축 시나리오로 비교합니다.",
];

const investmentCandidates = [
  { name: "ISA", detail: "중개형 ISA의 세제 효과와 수익 가정을 분리해 비교" },
  { name: "IRP", detail: "연말정산 추정 금액 재배분 시나리오" },
  { name: "적금", detail: "고정 저축액을 유지하는 기준 시나리오" },
  { name: "배당", detail: "배당금 재투자 가정 시나리오" },
];

export function DashboardOverview() {
  return (
    <section
      aria-labelledby="dashboard-overview-title"
      className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[1.35fr_0.85fr] lg:px-10"
    >
      <div className="grid gap-5">
        <div className="rounded-lg border border-[#d9e3d7] bg-[#fbfdf8] p-5 shadow-[0_18px_50px_rgba(23,32,26,0.08)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#2f7d62]">MillionMoa 대시보드</p>
              <h1
                id="dashboard-overview-title"
                className="mt-2 text-3xl font-semibold tracking-normal text-[#17201a] sm:text-4xl"
              >
                월급으로 1억까지
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#536057]">
                실수령 월급을 기준으로 통장 쪼개기, 생활비, 절세, 투자 시나리오를
                한 화면에서 점검하고 1억 달성까지 필요한 다음 선택을 정리합니다.
              </p>
            </div>
            <div className="border-l border-[#d9e3d7] pl-4">
              <p className="text-xs font-medium text-[#536057]">오늘의 목표</p>
              <p className="mt-1 text-lg font-semibold text-[#17201a]">저축률 55%</p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 border-t border-[#d9e3d7] pt-5 lg:grid-cols-[1fr_220px]">
            <div>
              <p className="text-sm font-medium text-[#536057]">1억까지 남은 금액</p>
              <p className="mt-2 text-4xl font-semibold tabular-nums text-[#17201a]">
                100,000,000원
              </p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e8efe6]">
                <div className="h-full w-[8%] rounded-full bg-[#2f7d62]" />
              </div>
              <p className="mt-2 text-sm text-[#536057]">
                첫 월급 정보를 입력하면 목표까지 남은 기간과 필요 저축액을 다시 계산합니다.
              </p>
            </div>
            <div className="border-l border-[#f2d27b] pl-4">
              <p className="text-sm font-semibold text-[#725b12]">연말정산 추정 영향</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[#17201a]">0원</p>
              <p className="mt-2 text-sm leading-6 text-[#6f6547]">
                IRP와 연금저축 납입액, 원천징수액을 함께 입력하면 예상 환급 또는
                추가 납부 가능성을 추정합니다. 실제 결과는 홈택스에서 확인해야 합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-lg border border-[#ded8cb] bg-[#fffdf8] p-4 shadow-[0_10px_30px_rgba(23,32,26,0.05)]"
            >
              <h2 className="text-sm font-medium text-[#536057]">{metric.label}</h2>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-[#17201a]">
                {metric.value}
              </p>
              <p className="mt-2 text-xs text-[#7b857d]">{metric.caption}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-5">
        <GoalQuickPlanner />

        <aside className="rounded-lg border border-[#ded8cb] bg-[#fffdf8] p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-[#17201a]">
              이번 달 시뮬레이션 후보
            </h2>
            <span className="rounded-md bg-[#e6f3eb] px-2 py-1 text-xs font-semibold text-[#2f7d62]">
              3개
            </span>
          </div>
          <ol className="mt-4 grid gap-3">
            {actions.map((action, index) => (
              <li className="flex gap-3 text-sm leading-6 text-[#536057]" key={action}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#17201a] text-xs font-semibold text-[#fffdf8]">
                  {index + 1}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ol>
        </aside>

        <aside className="rounded-lg border border-[#ded8cb] bg-[#fffdf8] p-5">
          <h2 className="text-base font-semibold text-[#17201a]">생활비 통장 상태</h2>
          <div className="mt-4 grid gap-3">
            <div className="flex items-center justify-between border-b border-[#ebe6da] pb-3">
              <span className="text-sm text-[#536057]">월 생활비 한도</span>
              <span className="font-semibold tabular-nums text-[#17201a]">0원</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#ebe6da] pb-3">
              <span className="text-sm text-[#536057]">CMA 파킹 예상 이자</span>
              <span className="font-semibold tabular-nums text-[#17201a]">0원</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#536057]">비상금 목표</span>
              <span className="font-semibold tabular-nums text-[#17201a]">3개월</span>
            </div>
          </div>
        </aside>

        <aside className="rounded-lg border border-[#d9e3d7] bg-[#eef7f1] p-5">
          <h2 className="text-base font-semibold text-[#17201a]">
            ISA/IRP/적금/배당 비교 시나리오
          </h2>
          <div className="mt-4 divide-y divide-[#d4e4d8]">
            {investmentCandidates.map((candidate) => (
              <div className="py-3 first:pt-0 last:pb-0" key={candidate.name}>
                <p className="text-sm font-semibold text-[#2f7d62]">{candidate.name}</p>
                <p className="mt-1 text-sm leading-6 text-[#536057]">{candidate.detail}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
