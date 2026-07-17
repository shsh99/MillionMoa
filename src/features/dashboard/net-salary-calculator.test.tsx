import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NetSalaryCalculator } from "./net-salary-calculator";

describe("NetSalaryCalculator", () => {
  it("adds salary shortcuts cumulatively and waits for explicit application", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={onApply} />);

    await user.click(screen.getByRole("button", { name: "월 세전 급여에 100만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 세전 급여에 50만원 더하기" }));

    expect(screen.getByRole("textbox", { name: "월 세전 급여" })).toHaveValue("470");
    expect(onApply).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "계산한 실수령액을 이 기기에 저장되는 내 계획의 월 수입으로 적용" }));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0]).toBeGreaterThan(0);
  });

  it("shows a lower income tax and higher take-home pay for confirmed youth reduction", async () => {
    const user = userEvent.setup();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={vi.fn()} />);

    const before = Number(screen.getByTestId("net-salary-result").textContent?.replace(/\D/g, ""));
    await user.click(screen.getByRole("checkbox", { name: "중소기업 취업자 소득세 감면 적용" }));
    await user.click(screen.getByRole("checkbox", { name: "회사가 감면 대상 중소기업이에요" }));
    await user.click(screen.getByRole("checkbox", { name: "회사의 주 업종이 감면 대상이에요" }));
    await user.click(screen.getByRole("checkbox", { name: "임원·최대주주 친족·일용근로자 등 제외 근로자가 아니에요" }));

    expect(screen.getByText("감면 자격 확인")).toBeInTheDocument();
    const after = Number(screen.getByTestId("net-salary-result").textContent?.replace(/\D/g, ""));
    expect(after).toBeGreaterThan(before);
    expect(screen.getByTestId("income-tax-result")).toHaveTextContent("7,000원");
  });

  it("supports military-adjusted youth reduction from the UI", async () => {
    const user = userEvent.setup();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={vi.fn()} />);

    await user.click(screen.getByRole("checkbox", { name: "중소기업 취업자 소득세 감면 적용" }));
    await user.clear(screen.getByLabelText("생년월일"));
    await user.type(screen.getByLabelText("생년월일"), "1990-12-31");
    await user.clear(screen.getByRole("spinbutton", { name: "병역 이행 개월" }));
    await user.type(screen.getByRole("spinbutton", { name: "병역 이행 개월" }), "72");
    await user.click(screen.getByRole("checkbox", { name: "회사가 감면 대상 중소기업이에요" }));
    await user.click(screen.getByRole("checkbox", { name: "회사의 주 업종이 감면 대상이에요" }));
    await user.click(screen.getByRole("checkbox", { name: "임원·최대주주 친족·일용근로자 등 제외 근로자가 아니에요" }));

    expect(screen.getByTestId("income-tax-result")).toHaveTextContent("7,000원");
  });

  it("supports 60-plus reduction from the UI", async () => {
    const user = userEvent.setup();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={vi.fn()} />);

    await user.click(screen.getByRole("checkbox", { name: "중소기업 취업자 소득세 감면 적용" }));
    await user.selectOptions(screen.getByLabelText("감면 대상 유형"), "age-60-plus");
    await user.clear(screen.getByLabelText("생년월일"));
    await user.type(screen.getByLabelText("생년월일"), "1965-01-01");
    await user.clear(screen.getByLabelText("최초 감면대상 취업일"));
    await user.type(screen.getByLabelText("최초 감면대상 취업일"), "2026-01-01");
    await user.click(screen.getByRole("checkbox", { name: "회사가 감면 대상 중소기업이에요" }));
    await user.click(screen.getByRole("checkbox", { name: "회사의 주 업종이 감면 대상이에요" }));
    await user.click(screen.getByRole("checkbox", { name: "임원·최대주주 친족·일용근로자 등 제외 근로자가 아니에요" }));

    expect(screen.getByTestId("income-tax-result")).toHaveTextContent("21,000원");
  });

  it("shows specific invalid and estimate copy", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={onApply} />);

    await user.clear(screen.getByRole("textbox", { name: "월 비과세 금액" }));
    await user.type(screen.getByRole("textbox", { name: "월 비과세 금액" }), "500");

    expect(screen.getByText("비과세 금액은 세전 급여를 넘을 수 없습니다.")).toBeInTheDocument();
    expect(screen.getByText(/실제 고지 기준액/)).toBeInTheDocument();

    await user.clear(screen.getByRole("textbox", { name: "월 비과세 금액" }));
    await user.type(screen.getByRole("textbox", { name: "월 비과세 금액" }), "20");
    await user.click(screen.getByRole("button", { name: "계산한 실수령액을 이 기기에 저장되는 내 계획의 월 수입으로 적용" }));

    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("exposes assessed insurance bases only when requested", async () => {
    const user = userEvent.setup();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "국민연금 기준소득월액", hidden: true })).not.toBeVisible();
    await user.click(screen.getByText("보험 기준액 직접 맞추기"));
    expect(screen.getByRole("textbox", { name: "국민연금 기준소득월액" })).toBeVisible();
  });
});
