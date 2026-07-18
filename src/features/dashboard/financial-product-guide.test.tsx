import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FinancialProductGuide } from "./financial-product-guide";

describe("FinancialProductGuide", () => {
  it("shows current youth product categories with official source links", () => {
    render(<FinancialProductGuide />);

    expect(screen.getByRole("heading", { name: "청년 금융상품 비교" })).toBeInTheDocument();
    expect(screen.getByText("청년미래적금")).toBeInTheDocument();
    expect(screen.getByText("청년 주택드림 청약통장")).toBeInTheDocument();
    expect(screen.getByText("ISA 서민형")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /서민금융진흥원/ })).toHaveAttribute("href", "https://www.kinfa.or.kr/financialProduct/youthFutureSavings.do");
    expect(screen.getByRole("link", { name: /국토교통부/ })).toHaveAttribute("href", "https://www.molit.go.kr/2024dreamaccount/main.jsp");
    expect(screen.getByRole("link", { name: /금융투자협회/ })).toHaveAttribute("href", "https://law.kofia.or.kr/service/law/lawFullScreenContent.do?historySeq=1617&seq=343");
  });

  it("separates closed youth leap account status from active 2026 product calculations", () => {
    render(<FinancialProductGuide />);

    expect(screen.getByText(/청년도약계좌는.*신규 가입이 2025-12-31까지/)).toBeInTheDocument();
    expect(screen.getByText(/ISA 비과세 한도 확대안은 미확정/)).toBeInTheDocument();
  });
});
