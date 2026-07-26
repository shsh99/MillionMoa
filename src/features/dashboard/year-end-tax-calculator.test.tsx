import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { YearEndTaxCalculator } from "./year-end-tax-calculator";

describe("YearEndTaxCalculator", () => {
  it("shows pension and rent credits only after rent confirmations", async () => {
    const user = userEvent.setup();
    render(<YearEndTaxCalculator currentMonthlySurplus={500_000} />);

    expect(screen.getByTestId("year-end-credit-total")).toHaveTextContent("990,000원");
    expect(screen.getByText("월세 공제는 총급여 또는 주택 요건을 확인해야 반영됩니다.")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "무주택 세대 요건을 확인했어요" }));
    await user.click(screen.getByRole("checkbox", { name: "국민주택규모 또는 기준시가 4억원 이하 주택이에요" }));
    await user.click(screen.getByRole("checkbox", { name: "임대차계약·전입 주소 요건을 확인했어요" }));

    expect(screen.getByTestId("year-end-credit-total")).toHaveTextContent("2,214,000원");
    expect(screen.getByText("기납부 소득세 기준 환급 후보 900,000원")).toBeInTheDocument();
  });

  it("uses ten-thousand-won inputs and cumulative quick amounts", async () => {
    const user = userEvent.setup();
    render(<YearEndTaxCalculator currentMonthlySurplus={0} />);

    await user.click(screen.getByRole("button", { name: "올해 기납부 소득세에 50만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "올해 기납부 소득세에 10만원 더하기" }));

    expect(screen.getByRole("textbox", { name: "올해 기납부 소득세" })).toHaveValue("150");
  });

  it("shows official source context and separates credits from refund candidates", () => {
    render(<YearEndTaxCalculator currentMonthlySurplus={500_000} />);

    const sourcePanel = screen.getByRole("region", { name: "연말정산 공식 기준" });

    expect(within(sourcePanel).getByText("2026-07-26 확인")).toBeInTheDocument();
    expect(within(sourcePanel).getByText(/환급 후보는 전체 결정세액이 아니라/)).toBeInTheDocument();
    expect(within(sourcePanel).getByRole("link", { name: /연금계좌 세액공제/ })).toHaveAttribute("href", expect.stringContaining("nts.go.kr"));
    expect(within(sourcePanel).getByRole("link", { name: /월세액 세액공제/ })).toHaveAttribute("href", expect.stringContaining("nts.go.kr"));
  });
});
