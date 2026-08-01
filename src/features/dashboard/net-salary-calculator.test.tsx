import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NetSalaryCalculator } from "./net-salary-calculator";

async function openNonTaxableDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText("식대·차량·보육수당이 있을 때만 입력"));
}

describe("NetSalaryCalculator", () => {
  it("adds salary shortcuts cumulatively and waits for explicit application", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={onApply} />);

    expect(screen.getByRole("region", { name: "내 월급 실수령액" })).toHaveClass("border-[var(--wallet-line)]");
    const workflow = screen.getByRole("region", { name: "실수령액 계산 순서" });
    expect(within(workflow).getByText("급여")).toBeInTheDocument();
    expect(within(workflow).getByText("소득세")).toBeInTheDocument();
    expect(within(workflow).getByText("계획 반영")).toBeInTheDocument();
    expect(screen.getByText("공식 요율 자동")).toBeInTheDocument();
    expect(screen.getAllByText("소득세 필요").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("계획 반영 전")).toBeInTheDocument();
    expect(screen.getByRole("complementary")).toHaveClass("bg-[#17352d]");
    expect(screen.getByRole("complementary")).not.toHaveClass("bg-[#2f2950]");
    expect(screen.getByRole("button", { name: "계산한 실수령액을 이 기기에 저장되는 내 계획의 월 수입으로 적용" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "월 세전 급여에 100만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 세전 급여에 50만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 소득세에 5만원 더하기" }));

    expect(screen.getByRole("textbox", { name: "월 세전 급여" })).toHaveValue("470");
    expect(onApply).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "계산한 실수령액을 이 기기에 저장되는 내 계획의 월 수입으로 적용" }));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0]).toBeGreaterThan(0);
  }, 10_000);

  it("applies simple salary presets and keeps optional details collapsed by default", async () => {
    const user = userEvent.setup();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={vi.fn()} />);

    expect(screen.getByRole("region", { name: "실수령액 빠른 시작" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "식대", hidden: true })).not.toBeVisible();

    await user.click(screen.getByRole("button", { name: /첫 월급/ }));

    expect(screen.getByRole("textbox", { name: "월 세전 급여" })).toHaveValue("280");
    expect(screen.getByRole("textbox", { name: "월 소득세" })).toHaveValue("3");
    expect(screen.getAllByText("명세서 입력").length).toBeGreaterThanOrEqual(1);
  });

  it("shows a lower income tax and higher take-home pay for confirmed youth reduction", async () => {
    const user = userEvent.setup();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "월 소득세에 5만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 소득세에 1만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 소득세에 1만원 더하기" }));
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

    await user.click(screen.getByRole("button", { name: "월 소득세에 5만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 소득세에 1만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 소득세에 1만원 더하기" }));
    await user.click(screen.getByRole("checkbox", { name: "중소기업 취업자 소득세 감면 적용" }));
    await user.clear(screen.getByLabelText("생년월일"));
    await user.type(screen.getByLabelText("생년월일"), "1990-12-31");
    await user.clear(screen.getByRole("spinbutton", { name: "병역 이행 개월" }));
    await user.type(screen.getByRole("spinbutton", { name: "병역 이행 개월" }), "72");
    await user.click(screen.getByRole("checkbox", { name: "회사가 감면 대상 중소기업이에요" }));
    await user.click(screen.getByRole("checkbox", { name: "회사의 주 업종이 감면 대상이에요" }));
    await user.click(screen.getByRole("checkbox", { name: "임원·최대주주 친족·일용근로자 등 제외 근로자가 아니에요" }));

    expect(screen.getByTestId("income-tax-result")).toHaveTextContent("7,000원");
  }, 10_000);

  it("supports 60-plus reduction from the UI", async () => {
    const user = userEvent.setup();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "월 소득세에 5만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 소득세에 1만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 소득세에 1만원 더하기" }));
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
  }, 10_000);

  it("builds taxable salary from itemized non-taxable pay and official table inputs", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={onApply} />);

    await openNonTaxableDetails(user);
    expect(screen.getByRole("textbox", { name: "식대" })).toHaveValue("0");
    expect(screen.getByText("홈택스 월급여 입력값")).toBeInTheDocument();
    expect(screen.getByText(/소득세 입력 필요/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "식대에 20만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "자기차량운전보조금에 20만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 소득세에 5만원 더하기" }));
    await user.selectOptions(screen.getByLabelText("소득세 입력 기준"), "official-table");

    expect(screen.getByText("비과세 합계")).toBeInTheDocument();
    expect(screen.getByText("2,800,000원")).toBeInTheDocument();
    expect(screen.getAllByText(/2026.03.01 이후 홈택스 근로소득 간이세액표/).length).toBeGreaterThan(0);
    expect(screen.getByText(/자동 보정하지 않습니다/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "계산한 실수령액을 이 기기에 저장되는 내 계획의 월 수입으로 적용" }));

    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("shows official source context for payroll, insurance, and SME reduction assumptions", () => {
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={vi.fn()} />);

    const sourcePanel = screen.getByRole("region", { name: "실수령액 공식 기준" });

    expect(within(sourcePanel).getByText("2026-07-26 확인")).toBeInTheDocument();
    expect(within(sourcePanel).getByText(/소득세는 앱이 임의 계산하지 않고/)).toBeInTheDocument();
    expect(within(sourcePanel).getByRole("link", { name: /국세청 홈택스 근로소득간이세액표/ })).toHaveAttribute("href", expect.stringContaining("hometax.go.kr"));
    expect(within(sourcePanel).getByRole("link", { name: /국민연금공단 2026 기준소득월액/ })).toHaveAttribute("href", expect.stringContaining("nps.or.kr"));
    expect(within(sourcePanel).getByRole("link", { name: /국세청 중소기업 취업자 소득세 감면/ })).toHaveAttribute("href", expect.stringContaining("nts.go.kr"));
  });

  it("requires confirmation for zero income tax and confirmed other non-taxable pay", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={onApply} />);

    await openNonTaxableDetails(user);
    await user.click(screen.getByRole("button", { name: "기타 비과세에 20만원 더하기" }));
    expect(screen.getByText(/기타 비과세 · 확인 전 0원 반영/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "계산한 실수령액을 이 기기에 저장되는 내 계획의 월 수입으로 적용" })).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "기타 비과세 금액이 급여명세서에 비과세로 확정되어 있어요" }));
    expect(screen.getByText(/기타 비과세 · 급여명세서 확인 금액/)).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "홈택스 또는 급여명세서에서 월 소득세 0원을 확인했어요" }));
    await user.click(screen.getByRole("button", { name: "계산한 실수령액을 이 기기에 저장되는 내 계획의 월 수입으로 적용" }));

    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("uses the remaining annual cap for production overtime non-taxable pay", async () => {
    const user = userEvent.setup();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={vi.fn()} />);

    await openNonTaxableDetails(user);
    await user.click(screen.getByRole("button", { name: "생산직 연장·야간·휴일수당에 20만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "생산직 연장·야간·휴일수당에 20만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "올해 이미 비과세 반영한 생산직 수당에 100만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "올해 이미 비과세 반영한 생산직 수당에 100만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "올해 이미 비과세 반영한 생산직 수당에 20만원 더하기" }));
    await user.click(screen.getByRole("checkbox", { name: /생산직 수당 비과세 요건을 확인했어요/ }));

    expect(screen.getByText(/생산직 연장·야간·휴일수당 · 연 240만원 잔여 200,000원/)).toBeInTheDocument();
    expect(screen.getByText(/초과 과세 200,000원/)).toBeInTheDocument();
  });

  it("shows specific invalid and estimate copy when non-taxable total exceeds gross pay", async () => {
    const user = userEvent.setup();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={vi.fn()} />);

    await openNonTaxableDetails(user);
    await user.clear(screen.getByRole("textbox", { name: "월 세전 급여" }));
    await user.type(screen.getByRole("textbox", { name: "월 세전 급여" }), "10");
    await user.click(screen.getByRole("button", { name: "식대에 20만원 더하기" }));

    expect(screen.getByText("비과세 금액은 세전 급여를 넘을 수 없습니다.")).toBeInTheDocument();
    expect(screen.getAllByText(/실제 고지 기준액/).length).toBeGreaterThan(0);
  });

  it("exposes assessed insurance bases only when requested", async () => {
    const user = userEvent.setup();
    render(<NetSalaryCalculator currentMonthlyIncome={3_200_000} onApply={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "국민연금 기준소득월액", hidden: true })).not.toBeVisible();
    await user.click(screen.getByText("보험 기준액 직접 맞추기"));
    expect(screen.getByRole("textbox", { name: "국민연금 기준소득월액" })).toBeVisible();
  });
});
