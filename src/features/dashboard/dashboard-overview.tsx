const metrics = [
  { label: "현재 자산", value: "0원" },
  { label: "예상 달성일", value: "입력 필요" },
  { label: "이번 달 생활비", value: "0원 남음" },
  { label: "최단경로 단축", value: "0개월" },
];

export function DashboardOverview() {
  return (
    <section
      aria-labelledby="dashboard-overview-title"
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10"
    >
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-[#2f7d62]">MillionMoa 대시보드</p>
        <h1
          id="dashboard-overview-title"
          className="mt-3 text-3xl font-semibold tracking-normal text-[#17201a] sm:text-4xl"
        >
          월급으로 1억까지
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#536057]">
          실수령 월급을 기준으로 통장 쪼개기, 생활비, 절세, 투자 시나리오를 한
          화면에서 점검하고 1억 달성까지 필요한 다음 선택을 정리합니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-lg border border-[#ded8cb] bg-[#fffdf8] p-5"
          >
            <h2 className="text-sm font-medium text-[#536057]">{metric.label}</h2>
            <p className="mt-4 text-2xl font-semibold tabular-nums text-[#17201a]">
              {metric.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
