import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { FinanceScenarioInput } from "./finance-scenario-model";
import { FinanceScenarioEditor } from "./finance-scenario-editor";

const initialValue: FinanceScenarioInput = {
  assets: [],
  loans: [],
  expenses: [],
  monthlyIncome: 3_200_000,
  monthlyNonLoanExpense: 2_200_000,
};

function ControlledEditor({ initialScenario = initialValue, mode, onChange = vi.fn() }: { initialScenario?: FinanceScenarioInput; mode?: "assets" | "loans"; onChange?: (value: FinanceScenarioInput) => void }) {
  const [value, setValue] = useState(initialScenario);
  return (
    <FinanceScenarioEditor
      mode={mode}
      value={value}
      onChange={(next) => {
        onChange(next);
        setValue(next);
      }}
    />
  );
}

describe("FinanceScenarioEditor", () => {
  it("renders only asset controls when the parent selects the asset workspace", () => {
    render(<ControlledEditor mode="assets" />);

    expect(screen.getByRole("button", { name: "자산 계좌 추가" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "대출" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "대출 추가" })).not.toBeInTheDocument();
  });

  it("renders only loan controls when the parent selects the loan workspace", async () => {
    const user = userEvent.setup();
    render(<ControlledEditor mode="loans" />);

    expect(screen.getByRole("button", { name: "대출 추가" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "자산" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "자산 계좌 추가" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "대출 추가" }));
    expect(screen.getByLabelText("대출 이름")).toHaveFocus();
  });

  it("keeps multiple loans independent in the controlled loan workspace", async () => {
    const user = userEvent.setup();
    render(<ControlledEditor mode="loans" />);

    await user.click(screen.getByRole("button", { name: "대출 추가" }));
    await user.clear(screen.getByLabelText("대출 이름"));
    await user.type(screen.getByLabelText("대출 이름"), "신용대출");
    await user.click(screen.getByRole("button", { name: "대출 추가" }));
    await user.clear(screen.getByLabelText("대출 이름"));
    await user.type(screen.getByLabelText("대출 이름"), "전세대출");
    await user.click(screen.getByRole("button", { name: "신용대출 대출 선택" }));
    await user.clear(screen.getByRole("textbox", { name: "대출 원금" }));
    await user.type(screen.getByRole("textbox", { name: "대출 원금" }), "300");

    await user.click(screen.getByRole("button", { name: "전세대출 대출 선택" }));
    expect(screen.getByRole("textbox", { name: "대출 원금" })).toHaveValue("0");
    expect(screen.getAllByRole("button", { name: /대출 선택/ })).toHaveLength(2);
  });

  it("keeps asset and loan editors unframed inside the outer container", async () => {
    const user = userEvent.setup();
    render(<ControlledEditor />);
    await user.click(screen.getByRole("button", { name: "자산 계좌 추가" }));

    expect(screen.getByTestId("asset-editor-panel")).toHaveClass("border-t");
    expect(screen.getByTestId("asset-editor-panel")).not.toHaveClass("rounded-2xl");

    await user.click(screen.getByRole("tab", { name: "대출" }));
    await user.click(screen.getByRole("button", { name: "대출 추가" }));
    expect(screen.getByTestId("loan-editor-panel")).toHaveClass("border-t");
    expect(screen.getByTestId("loan-editor-panel")).not.toHaveClass("rounded-2xl");
  });

  it("adds multiple asset accounts and keeps them independently editable", async () => {
    const user = userEvent.setup();
    render(<ControlledEditor />);

    await user.click(screen.getByRole("button", { name: "자산 계좌 추가" }));
    await user.clear(screen.getByLabelText("자산 계좌 이름"));
    await user.type(screen.getByLabelText("자산 계좌 이름"), "생활비 통장");
    await user.click(screen.getByRole("button", { name: "자산 계좌 추가" }));

    expect(screen.getByRole("button", { name: /생활비 통장 계좌 선택/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /계좌 선택/ })).toHaveLength(2);
  });

  it("accumulates quick amount buttons in ten-thousand won units", async () => {
    const user = userEvent.setup();
    render(<ControlledEditor />);
    await user.click(screen.getByRole("button", { name: "자산 계좌 추가" }));

    await user.click(screen.getByRole("button", { name: "자산 계좌 잔액에 50만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "자산 계좌 잔액에 100만원 더하기" }));

    expect(screen.getByLabelText("자산 계좌 잔액")).toHaveValue("150");
    expect(screen.getByRole("button", { name: "자산 계좌 잔액에 500만원 더하기" })).toBeInTheDocument();
  });

  it("keeps nearby account context and can undo a deletion", async () => {
    const user = userEvent.setup();
    const accounts = ["첫 계좌", "둘째 계좌", "셋째 계좌"].map((name, index) => ({
      id: `asset-${index}`,
      name,
      category: "checking" as const,
      balance: (index + 1) * 1_000_000,
      annualRate: 0,
      monthlyContribution: 0,
    }));
    render(<ControlledEditor initialScenario={{ ...initialValue, assets: accounts }} />);
    await user.click(screen.getByRole("button", { name: "둘째 계좌 계좌 선택" }));
    await user.click(screen.getByRole("button", { name: "선택한 자산 계좌 삭제" }));

    expect(screen.getByRole("button", { name: "셋째 계좌 계좌 선택" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "둘째 계좌 계좌 선택" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "둘째 계좌 삭제 되돌리기" }));
    expect(screen.getAllByRole("button", { name: /계좌 선택/ }).map((button) => button.getAttribute("aria-label"))).toEqual([
      "첫 계좌 계좌 선택",
      "둘째 계좌 계좌 선택",
      "셋째 계좌 계좌 선택",
    ]);
    expect(screen.getByRole("button", { name: "둘째 계좌 계좌 선택" })).toHaveAttribute("aria-pressed", "true");
  });

  it("undoes a removed loan without a blocking confirmation", async () => {
    const user = userEvent.setup();
    render(<ControlledEditor />);
    await user.click(screen.getByRole("tab", { name: "대출" }));
    await user.click(screen.getByRole("button", { name: "대출 추가" }));

    await user.click(screen.getByRole("button", { name: "선택한 대출 삭제" }));
    expect(screen.queryByRole("button", { name: "새 대출 1 대출 선택" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "새 대출 1 삭제 되돌리기" }));
    expect(screen.getByRole("button", { name: "새 대출 1 대출 선택" })).toHaveAttribute("aria-pressed", "true");
  });

  it("restores consecutive deletions in reverse order", async () => {
    const user = userEvent.setup();
    const accounts = ["첫 계좌", "둘째 계좌"].map((name, index) => ({
      id: `asset-${index}`,
      name,
      category: "checking" as const,
      balance: 1_000_000,
      annualRate: 0,
      monthlyContribution: 0,
    }));
    render(<ControlledEditor initialScenario={{ ...initialValue, assets: accounts }} />);

    await user.click(screen.getByRole("button", { name: "선택한 자산 계좌 삭제" }));
    await user.click(screen.getByRole("button", { name: "선택한 자산 계좌 삭제" }));
    expect(screen.getByRole("status")).toHaveTextContent("이전 삭제 1건 더");

    await user.click(screen.getByRole("button", { name: "둘째 계좌 삭제 되돌리기" }));
    expect(screen.getByRole("button", { name: "첫 계좌 삭제 되돌리기" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getAllByRole("button", { name: /계좌 선택/ }).map((button) => button.getAttribute("aria-label"))).toEqual([
      "첫 계좌 계좌 선택",
      "둘째 계좌 계좌 선택",
    ]);
  });

  it("focuses the name field after adding a financial account", async () => {
    const user = userEvent.setup();
    render(<ControlledEditor />);

    await user.click(screen.getByRole("button", { name: "자산 계좌 추가" }));

    expect(screen.getByLabelText("자산 계좌 이름")).toHaveFocus();
  });

  it("uses stable names and disables autocomplete for editable fields", async () => {
    const user = userEvent.setup();
    render(<ControlledEditor />);
    await user.click(screen.getByRole("button", { name: "자산 계좌 추가" }));

    expect(screen.getByLabelText("자산 계좌 이름")).toHaveAttribute("name", "asset-name");
    expect(screen.getByLabelText("자산 계좌 이름")).toHaveAttribute("autocomplete", "off");
    expect(screen.getByLabelText("자산 연 수익률")).toHaveAttribute("name", "asset-annual-rate");
  });

  it("adds loans and changes the repayment method", async () => {
    const user = userEvent.setup();
    render(<ControlledEditor />);

    await user.click(screen.getByRole("tab", { name: "대출" }));
    await user.click(screen.getByRole("button", { name: "대출 추가" }));
    const methodGroup = screen.getByRole("radiogroup", { name: "상환 방식" });
    await user.click(within(methodGroup).getByRole("radio", { name: "원금균등" }));

    expect(within(methodGroup).getByRole("radio", { name: "원금균등" })).toBeChecked();
  });

  it("clamps loan terms and rates to the supported model boundary", async () => {
    const user = userEvent.setup();
    render(<ControlledEditor />);
    await user.click(screen.getByRole("tab", { name: "대출" }));
    await user.click(screen.getByRole("button", { name: "대출 추가" }));

    await user.clear(screen.getByLabelText("대출 남은 개월"));
    await user.type(screen.getByLabelText("대출 남은 개월"), "10000");
    await user.clear(screen.getByLabelText("대출 연 금리"));
    await user.type(screen.getByLabelText("대출 연 금리"), "150");

    expect(screen.getByLabelText("대출 남은 개월")).toHaveValue(1200);
    expect(screen.getByLabelText("대출 연 금리")).toHaveValue(100);
  });

  it("emits a complete immutable scenario through onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledEditor onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "자산 계좌 추가" }));
    await user.type(screen.getByLabelText("자산 계좌 이름"), "월급");

    const latest = onChange.mock.calls.at(-1)?.[0] as FinanceScenarioInput;
    expect(latest.monthlyIncome).toBe(3_200_000);
    expect(latest.monthlyNonLoanExpense).toBe(2_200_000);
    expect(latest.assets).toHaveLength(1);
    expect(latest.assets[0].name).toContain("월급");
    expect(latest.loans).toEqual([]);
  });
});
