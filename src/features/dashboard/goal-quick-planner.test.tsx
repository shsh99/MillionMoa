import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GoalQuickPlanner } from "./goal-quick-planner";

describe("GoalQuickPlanner", () => {
  it("calculates a 100 million KRW target date from man-won inputs", async () => {
    const user = userEvent.setup();

    render(<GoalQuickPlanner />);

    await user.clear(screen.getByLabelText("현재 순자산"));
    await user.type(screen.getByLabelText("현재 순자산"), "1000");
    await user.clear(screen.getByLabelText("월 저축/투자 가능액"));
    await user.type(screen.getByLabelText("월 저축/투자 가능액"), "100");
    await user.clear(screen.getByLabelText("연 예상 수익률"));
    await user.type(screen.getByLabelText("연 예상 수익률"), "0");

    expect(screen.getByText("대출 전 목표 기간")).toBeInTheDocument();
    expect(screen.getByText("90개월")).toBeInTheDocument();
    expect(screen.getByText("7년 6개월")).toBeInTheDocument();
    expect(screen.getByText(/대출 조건에 따른 단순 추정/)).toBeInTheDocument();
  });

  it("sanitizes pasted money text and keeps calculations in KRW", async () => {
    const user = userEvent.setup();

    render(<GoalQuickPlanner />);

    await user.clear(screen.getByLabelText("현재 순자산"));
    await user.type(screen.getByLabelText("현재 순자산"), "1,000만원");
    await user.clear(screen.getByLabelText("월 저축/투자 가능액"));
    await user.type(screen.getByLabelText("월 저축/투자 가능액"), "100만원");

    expect(screen.getByLabelText("현재 순자산")).toHaveValue("1,000");
    expect(screen.getByLabelText("월 저축/투자 가능액")).toHaveValue("100");
    expect(screen.getByText("90개월")).toBeInTheDocument();
    expect(screen.getByText("10,000,000원")).toBeInTheDocument();
  });

  it("adds quick money buttons cumulatively and supports stepper controls", async () => {
    const user = userEvent.setup();

    render(<GoalQuickPlanner />);

    await user.click(screen.getByRole("button", { name: "+50만원" }));
    expect(screen.getByLabelText("월 저축/투자 가능액")).toHaveValue("150");

    await user.click(screen.getByRole("button", { name: "월 저축/투자 가능액 10만원 늘리기" }));
    expect(screen.getByLabelText("월 저축/투자 가능액")).toHaveValue("160");

    await user.click(screen.getByRole("button", { name: "월 저축/투자 가능액 10만원 줄이기" }));
    expect(screen.getByLabelText("월 저축/투자 가능액")).toHaveValue("150");
  });

  it("supports subtract mode, clearing, and negative net asset input", async () => {
    const user = userEvent.setup();

    render(<GoalQuickPlanner />);

    await user.clear(screen.getByLabelText("현재 순자산"));
    await user.type(screen.getByLabelText("현재 순자산"), "-500");
    expect(screen.getByLabelText("현재 순자산")).toHaveValue("-500");
    expect(screen.getByText("-5,000,000원")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "빼기" })[1]);
    await user.click(screen.getByRole("button", { name: "-50만원" }));
    expect(screen.getByLabelText("월 저축/투자 가능액")).toHaveValue("50");

    await user.click(screen.getByRole("button", { name: "월 저축/투자 가능액 지우기" }));
    expect(screen.getByLabelText("월 저축/투자 가능액")).toHaveValue("0");
  });

  it("shows loan repayment impact on monthly saving power", async () => {
    render(<GoalQuickPlanner />);

    expect(screen.getByRole("heading", { name: "대출 상환" })).toBeInTheDocument();
    expect(screen.getByLabelText("대출 원금")).toHaveValue("3,000");
    expect(screen.getByText("예상 월 상환액")).toBeInTheDocument();
    expect(screen.getByText("첫 달 이자")).toBeInTheDocument();
    expect(screen.getByText("총 이자 추정")).toBeInTheDocument();
  });

  it("shows a loan validation message instead of masking invalid loan inputs", async () => {
    const user = userEvent.setup();

    render(<GoalQuickPlanner />);

    await user.clear(screen.getByLabelText("대출 남은 기간"));
    await user.type(screen.getByLabelText("대출 남은 기간"), "0");

    expect(screen.getByText("대출 남은 기간은 1개월 이상이어야 합니다.")).toBeInTheDocument();
    expect(screen.getAllByText("확인 필요").length).toBeGreaterThan(0);
  });

  it("treats blank loan rate as invalid instead of a zero percent loan", async () => {
    const user = userEvent.setup();

    render(<GoalQuickPlanner />);

    await user.clear(screen.getByLabelText("대출 금리"));

    expect(screen.getByText("대출 금리와 남은 기간을 숫자로 입력해 주세요.")).toBeInTheDocument();
    expect(screen.getAllByText("확인 필요").length).toBeGreaterThan(0);
  });

  it("shows an unreachable state when monthly contribution is zero", async () => {
    const user = userEvent.setup();

    render(<GoalQuickPlanner />);

    await user.clear(screen.getByLabelText("현재 순자산"));
    await user.type(screen.getByLabelText("현재 순자산"), "1000");
    await user.clear(screen.getByLabelText("월 저축/투자 가능액"));
    await user.type(screen.getByLabelText("월 저축/투자 가능액"), "0");
    await user.clear(screen.getByLabelText("연 예상 수익률"));
    await user.type(screen.getByLabelText("연 예상 수익률"), "0");

    expect(screen.getByText("현재 조건으로는 목표 달성이 어렵습니다")).toBeInTheDocument();
  });

  it("shows validation copy when the return assumption is outside supported bounds", async () => {
    const user = userEvent.setup();

    render(<GoalQuickPlanner />);

    await user.clear(screen.getByLabelText("연 예상 수익률"));
    await user.type(screen.getByLabelText("연 예상 수익률"), "-101");

    expect(screen.getByLabelText("연 예상 수익률")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("연 수익률은 -100%에서 50% 사이로 입력해 주세요.")).toBeInTheDocument();
  });

  it("explains when the target is not reached within the model horizon", async () => {
    const user = userEvent.setup();

    render(<GoalQuickPlanner />);

    await user.clear(screen.getByLabelText("현재 순자산"));
    await user.type(screen.getByLabelText("현재 순자산"), "0");
    await user.clear(screen.getByLabelText("월 저축/투자 가능액"));
    await user.type(screen.getByLabelText("월 저축/투자 가능액"), "1");
    await user.clear(screen.getByLabelText("연 예상 수익률"));
    await user.type(screen.getByLabelText("연 예상 수익률"), "0");

    expect(screen.getByText("현재 가정으로는 100년 안에 목표에 도달하지 못합니다.")).toBeInTheDocument();
  });

  it("warns when the expected return assumption is unusually high", async () => {
    const user = userEvent.setup();

    render(<GoalQuickPlanner />);

    await user.clear(screen.getByLabelText("연 예상 수익률"));
    await user.type(screen.getByLabelText("연 예상 수익률"), "25");

    expect(screen.getByText("높은 연 수익률 가정은 실제 결과와 크게 달라질 수 있습니다.")).toBeInTheDocument();
  });
});
