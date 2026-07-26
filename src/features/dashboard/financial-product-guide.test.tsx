import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FinancialProductGuide } from "./financial-product-guide";

describe("FinancialProductGuide", () => {
  it("shows current youth product categories with official source links", () => {
    render(<FinancialProductGuide />);

    expect(screen.getByRole("heading", { name: "청년 금융상품 비교" })).toBeInTheDocument();
    expect(screen.getByText("청년미래적금")).toBeInTheDocument();
    expect(screen.getByText("청년 주택드림 청약통장")).toBeInTheDocument();
    expect(screen.getByText("ISA 서민형")).toBeInTheDocument();
    expect(screen.getByText("2026-07-26 확인")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "공식 출처 검증" })).toBeInTheDocument();
    expect(screen.getByText("연 300만원 한도 · 40%")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /서민금융진흥원/ })[0]).toHaveAttribute("href", "https://www.kinfa.or.kr/financialProduct/youthFutureSavings.do");
    expect(screen.getAllByRole("link", { name: /국토교통부/ })[0]).toHaveAttribute("href", "https://www.molit.go.kr/2024dreamaccount/main.jsp");
    expect(screen.getAllByRole("link", { name: /금융위원회/ })[0]).toHaveAttribute("href", "https://www.fsc.go.kr/po020201/27339");
  });

  it("uses the official 3 million won annual payment cap for housing subscription deduction display", async () => {
    const user = userEvent.setup();
    render(<FinancialProductGuide />);

    await user.click(screen.getAllByRole("button", { name: "계산 열기" })[1]);
    await user.click(screen.getByRole("button", { name: "월 납입액을 100만원으로 설정" }));

    expect(screen.getByRole("heading", { name: "청약통장 저축 예상" })).toBeInTheDocument();
    expect(screen.getByText("1,200,000원")).toBeInTheDocument();
  });

  it("separates closed youth leap account status from active 2026 product calculations", () => {
    render(<FinancialProductGuide />);

    expect(screen.getByText(/청년도약계좌는.*신규 가입이 2025-12-31까지/)).toBeInTheDocument();
    expect(screen.getByText(/ISA 비과세 한도 확대안은 미확정/)).toBeInTheDocument();
  });

  it("lets users switch product workspaces and adjust ISA benefit assumptions", async () => {
    const user = userEvent.setup();
    render(<FinancialProductGuide />);

    await user.click(screen.getAllByRole("button", { name: "계산 열기" })[2]);

    expect(screen.getByRole("heading", { name: "ISA 세금 절감 예상" })).toBeInTheDocument();
    expect(screen.getByText("서민형 비과세 한도 400만원 적용")).toBeInTheDocument();
    expect(screen.getAllByText("616,000원").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("checkbox", { name: "서민형 비과세 한도 400만원 적용" }));

    expect(screen.getByText("418,000원")).toBeInTheDocument();
  });

  it("applies beginner presets so users can avoid manual product input", async () => {
    const user = userEvent.setup();
    render(<FinancialProductGuide />);

    await user.click(screen.getByRole("button", { name: /안전 시작/ }));

    expect(screen.getByRole("textbox", { name: "월 납입액" })).toHaveValue("10");
    expect(screen.getByRole("spinbutton", { name: "청년미래적금 가정 금리" })).toHaveValue(3.5);
    expect(screen.getByRole("checkbox", { name: "우대형 정부기여금 12%로 보기" })).not.toBeChecked();

    await user.click(screen.getAllByRole("button", { name: "계산 열기" })[1]);
    await user.click(screen.getByRole("button", { name: /공제 최대/ }));

    expect(screen.getByRole("textbox", { name: "월 납입액" })).toHaveValue("25");
    expect(screen.getByText("1,200,000원")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "계산 열기" })[2]);
    await user.click(screen.getByRole("button", { name: /일반형 기준/ }));

    expect(screen.getByRole("textbox", { name: "계좌 순이익 가정" })).toHaveValue("200");
    expect(screen.getByRole("checkbox", { name: "서민형 비과세 한도 400만원 적용" })).not.toBeChecked();
  });
});
