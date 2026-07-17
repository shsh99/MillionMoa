import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GoalQuickPlanner } from "./goal-quick-planner";

describe("GoalQuickPlanner", () => {
  it("restores a deep-linked tab and supports arrow-key tab navigation", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#planner-loan");

    render(<GoalQuickPlanner />);

    await waitFor(() => expect(screen.getByRole("tab", { name: "대출" })).toHaveAttribute("aria-selected", "true"));
    await user.click(screen.getByRole("tab", { name: "월 현금흐름" }));
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "대출" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "대출" })).toHaveFocus();
    expect(window.location.hash).toBe("#planner-loan");
  });

  it("derives the default goal period from category totals", () => {
    window.history.replaceState(null, "", "#planner-net-worth");
    render(<GoalQuickPlanner />);

    expect(screen.getByRole("tab", { name: /순자산/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /월 현금흐름/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /대출/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /수익률/ })).toBeInTheDocument();
    expect(screen.getByText("현재 순자산", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("월 저축 가능액", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByLabelText("자산 합계")).toHaveTextContent("1,000만원");
    expect(screen.getByLabelText("부채 합계")).toHaveTextContent("0만원");
    expect(screen.getByLabelText("수입 합계")).toHaveTextContent("320만원");
    expect(screen.getByLabelText("지출 합계")).toHaveTextContent("220만원");
    expect(screen.getByText("대출 전 목표 기간")).toBeInTheDocument();
    expect(screen.getByText("90개월")).toBeInTheDocument();
    expect(screen.getByText("7년 6개월")).toBeInTheDocument();
  });

  it("adjusts a cash-flow row cumulatively and recalculates the aggregate", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#planner-net-worth");
    render(<GoalQuickPlanner />);

    await user.click(screen.getByRole("tab", { name: /월 현금흐름/ }));
    await user.click(screen.getByRole("button", { name: "월 실수령 수정" }));
    await user.click(screen.getByRole("button", { name: "월 실수령에 50만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 실수령에 50만원 더하기" }));

    expect(screen.getByLabelText("월 실수령 금액")).toHaveValue("420");
    expect(screen.getByText("200만원", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("45개월")).toBeInTheDocument();
  });

  it("adds, removes, and restores category rows", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#planner-net-worth");
    render(<GoalQuickPlanner />);

    await user.click(screen.getByRole("button", { name: "부채 항목 추가" }));
    await user.click(screen.getByRole("button", { name: "기타 부채 추가" }));
    await user.clear(screen.getByLabelText("기타 부채 이름"));
    await user.type(screen.getByLabelText("새 부채 이름"), "학자금 대출");
    await user.clear(screen.getByLabelText("학자금 대출 금액"));
    await user.type(screen.getByLabelText("학자금 대출 금액"), "1500");

    expect(screen.getByText("-500만원", { selector: "strong" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /월 현금흐름/ }));
    await user.click(screen.getByRole("button", { name: "생활비 삭제" }));
    expect(screen.queryByText("생활비", { selector: "input" })).not.toBeInTheDocument();
    expect(screen.getByText("생활비 항목을 삭제했습니다.")).toBeInTheDocument();
    expect(screen.getByText("185만원", { selector: "strong" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "생활비 되돌리기" }));
    expect(screen.getByRole("button", { name: "생활비 수정" })).toBeInTheDocument();
    expect(screen.getByText("100만원", { selector: "strong" })).toBeInTheDocument();
  });

  it("shows loan repayment impact and validates loan inputs", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#planner-net-worth");
    render(<GoalQuickPlanner />);

    await user.click(screen.getByRole("tab", { name: /대출/ }));
    expect(screen.getByRole("heading", { name: "대출 상환" })).toBeInTheDocument();
    expect(screen.getByLabelText("대출 원금")).toHaveValue("3,000");
    expect(screen.getByText("예상 월 상환액")).toBeInTheDocument();
    expect(screen.getByText("첫 달 이자")).toBeInTheDocument();
    expect(screen.getByText("총 이자 추정")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("대출 남은 기간"));
    await user.type(screen.getByLabelText("대출 남은 기간"), "0");
    expect(screen.getByText("대출 남은 기간은 1개월 이상이어야 합니다.")).toBeInTheDocument();
  });

  it("validates return assumptions in the return tab", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#planner-net-worth");
    render(<GoalQuickPlanner />);

    await user.click(screen.getByRole("tab", { name: /수익률/ }));
    await user.clear(screen.getByLabelText("연 예상 수익률"));
    await user.type(screen.getByLabelText("연 예상 수익률"), "-101");

    expect(screen.getByLabelText("연 예상 수익률")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("연 수익률은 -100%에서 50% 사이로 입력해 주세요.")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("연 예상 수익률"));
    await user.type(screen.getByLabelText("연 예상 수익률"), "25");
    expect(screen.getByText("높은 연 수익률 가정은 실제 결과와 크게 달라질 수 있습니다.")).toBeInTheDocument();
  });
});
