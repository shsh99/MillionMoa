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
    expect(screen.getByText(/입력한 수익률 가정에 따른 단순 추정/)).toBeInTheDocument();
    expect(screen.getByText(/연 수익률 0% 가정 기준입니다/)).toBeInTheDocument();
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

  it("shows validation copy when the return assumption is outside supported bounds", async () => {
    const user = userEvent.setup();

    render(<GoalQuickPlanner />);

    await user.clear(screen.getByLabelText("연 예상 수익률"));
    await user.type(screen.getByLabelText("연 예상 수익률"), "-101");
    await user.click(screen.getByRole("button", { name: "1억 달성 시점 계산" }));

    expect(screen.getByText("연 수익률은 -100%에서 50% 사이로 입력해 주세요.")).toBeInTheDocument();
  });

  it("explains when the target is not reached within the model horizon", async () => {
    const user = userEvent.setup();

    render(<GoalQuickPlanner />);

    await user.clear(screen.getByLabelText("현재 자산"));
    await user.type(screen.getByLabelText("현재 자산"), "0");
    await user.clear(screen.getByLabelText("월 저축/투자 가능액"));
    await user.type(screen.getByLabelText("월 저축/투자 가능액"), "1");
    await user.clear(screen.getByLabelText("연 예상 수익률"));
    await user.type(screen.getByLabelText("연 예상 수익률"), "0");
    await user.click(screen.getByRole("button", { name: "1억 달성 시점 계산" }));

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
