# Goal Quick Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dashboard quick planner that lets a user enter current assets, monthly contribution, and annual return to estimate when they can reach 100 million KRW.

**Architecture:** Keep calculation logic in `src/lib/calculators/goal-timeline.ts`. Add a focused client component in `src/features/dashboard/goal-quick-planner.tsx` that owns form state and calls the pure calculator. Compose it into `DashboardOverview` without moving formulas into React markup.

**Tech Stack:** Next.js App Router, React client component, TypeScript, Tailwind CSS, Vitest, Testing Library.

---

## Files

- Create: `src/features/dashboard/goal-quick-planner.tsx`
- Create: `src/features/dashboard/goal-quick-planner.test.tsx`
- Modify: `src/features/dashboard/dashboard-overview.tsx`

## Task 1: Dashboard Goal Quick Planner

**Files:**
- Create: `src/features/dashboard/goal-quick-planner.test.tsx`
- Create: `src/features/dashboard/goal-quick-planner.tsx`
- Modify: `src/features/dashboard/dashboard-overview.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/dashboard/goal-quick-planner.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GoalQuickPlanner } from "./goal-quick-planner";

describe("GoalQuickPlanner", () => {
  it("calculates a 100 million KRW target date from manual inputs", async () => {
    const user = userEvent.setup();

    render(<GoalQuickPlanner />);

    await user.clear(screen.getByLabelText("현재 자산"));
    await user.type(screen.getByLabelText("현재 자산"), "10000000");
    await user.clear(screen.getByLabelText("월 저축/투자 가능액"));
    await user.type(screen.getByLabelText("월 저축/투자 가능액"), "1000000");
    await user.clear(screen.getByLabelText("연 예상 수익률"));
    await user.type(screen.getByLabelText("연 예상 수익률"), "0");
    await user.click(screen.getByRole("button", { name: "1억 달성 시점 계산" }));

    expect(screen.getByText("예상 소요 기간")).toBeInTheDocument();
    expect(screen.getByText("90개월")).toBeInTheDocument();
    expect(screen.getByText("7년 6개월")).toBeInTheDocument();
  });

  it("shows an unreachable state when monthly contribution is zero", async () => {
    const user = userEvent.setup();

    render(<GoalQuickPlanner />);

    await user.clear(screen.getByLabelText("현재 자산"));
    await user.type(screen.getByLabelText("현재 자산"), "10000000");
    await user.clear(screen.getByLabelText("월 저축/투자 가능액"));
    await user.type(screen.getByLabelText("월 저축/투자 가능액"), "0");
    await user.clear(screen.getByLabelText("연 예상 수익률"));
    await user.type(screen.getByLabelText("연 예상 수익률"), "0");
    await user.click(screen.getByRole("button", { name: "1억 달성 시점 계산" }));

    expect(screen.getByText("현재 조건으로는 목표 달성이 어렵습니다")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/features/dashboard/goal-quick-planner.test.tsx
```

Expected: fails because `./goal-quick-planner` does not exist.

- [ ] **Step 3: Create the client component**

Create `src/features/dashboard/goal-quick-planner.tsx`:

```tsx
"use client";

import { FormEvent, useMemo, useState } from "react";
import { calculateMonthsToGoal } from "@/lib/calculators/goal-timeline";

const goalAmount = 100_000_000;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDuration(months: number) {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths}개월`;
  }

  if (remainingMonths === 0) {
    return `${years}년`;
  }

  return `${years}년 ${remainingMonths}개월`;
}

export function GoalQuickPlanner() {
  const [currentAmount, setCurrentAmount] = useState("10000000");
  const [monthlyContribution, setMonthlyContribution] = useState("1000000");
  const [annualReturnPercent, setAnnualReturnPercent] = useState("0");
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => {
    return calculateMonthsToGoal({
      currentAmount: Number(currentAmount) || 0,
      goalAmount,
      monthlyContribution: Number(monthlyContribution) || 0,
      annualReturnRate: (Number(annualReturnPercent) || 0) / 100,
    });
  }, [annualReturnPercent, currentAmount, monthlyContribution]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="rounded-lg border border-[#d9e3d7] bg-[#fbfdf8] p-5" aria-labelledby="goal-quick-planner-title">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-[#2f7d62]">빠른 시뮬레이션</p>
        <h2 id="goal-quick-planner-title" className="text-xl font-semibold text-[#17201a]">
          1억 달성 계산기
        </h2>
        <p className="text-sm leading-6 text-[#536057]">
          현재 자산과 매달 넣을 수 있는 돈을 입력하면 1억까지 걸리는 기간을 바로 계산합니다.
        </p>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-[#17201a]">
          현재 자산
          <input
            className="h-11 rounded-md border border-[#cfd9ce] bg-white px-3 text-base tabular-nums text-[#17201a]"
            inputMode="numeric"
            min="0"
            name="currentAmount"
            onChange={(event) => setCurrentAmount(event.target.value)}
            type="number"
            value={currentAmount}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#17201a]">
          월 저축/투자 가능액
          <input
            className="h-11 rounded-md border border-[#cfd9ce] bg-white px-3 text-base tabular-nums text-[#17201a]"
            inputMode="numeric"
            min="0"
            name="monthlyContribution"
            onChange={(event) => setMonthlyContribution(event.target.value)}
            type="number"
            value={monthlyContribution}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#17201a]">
          연 예상 수익률
          <input
            className="h-11 rounded-md border border-[#cfd9ce] bg-white px-3 text-base tabular-nums text-[#17201a]"
            inputMode="decimal"
            name="annualReturnPercent"
            onChange={(event) => setAnnualReturnPercent(event.target.value)}
            step="0.1"
            type="number"
            value={annualReturnPercent}
          />
        </label>

        <button
          className="h-11 rounded-md bg-[#17201a] px-4 text-sm font-semibold text-[#fffdf8] hover:bg-[#2f7d62]"
          type="submit"
        >
          1억 달성 시점 계산
        </button>
      </form>

      <div className="mt-5 border-t border-[#d9e3d7] pt-4" aria-live="polite">
        {submitted && result.reached && result.months !== null ? (
          <div>
            <p className="text-sm font-medium text-[#536057]">예상 소요 기간</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-[#17201a]">{result.months}개월</p>
            <p className="mt-1 text-sm text-[#536057]">{formatDuration(result.months)}</p>
          </div>
        ) : null}

        {submitted && !result.reached ? (
          <p className="text-sm font-semibold text-[#725b12]">현재 조건으로는 목표 달성이 어렵습니다</p>
        ) : null}

        {!submitted ? (
          <p className="text-sm text-[#536057]">
            기본값은 현재 자산 {formatCurrency(10_000_000)}원, 월 저축 {formatCurrency(1_000_000)}원입니다.
          </p>
        ) : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Compose it into the dashboard**

Modify `src/features/dashboard/dashboard-overview.tsx`:

```tsx
import { GoalQuickPlanner } from "./goal-quick-planner";
```

Render `<GoalQuickPlanner />` in the right-side dashboard column above `이번 달 추천 액션`.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
npm test -- src/features/dashboard/goal-quick-planner.test.tsx
npm test -- src/features/dashboard/dashboard-overview.test.tsx
npm run lint
npm run typecheck
npm run build
```

Expected: all commands exit with code 0. `npm run build` may still print the known Next workspace-root warning caused by the parent `C:\Users\ggg99\package-lock.json`.

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/goal-quick-planner.tsx src/features/dashboard/goal-quick-planner.test.tsx src/features/dashboard/dashboard-overview.tsx
git commit -m "feat: add dashboard goal quick planner"
```

## Self-Review

- Spec coverage: This implements the first interactive calculator on the dashboard using the existing pure goal timeline calculator.
- Placeholder scan: No TBD/TODO/placeholder steps.
- Type consistency: Component names and imports use `GoalQuickPlanner`; calculator input uses the existing `calculateMonthsToGoal` API.

