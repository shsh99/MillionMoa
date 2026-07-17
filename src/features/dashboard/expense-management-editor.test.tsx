import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ExpenseItem } from "./expense-management-model";
import { ExpenseManagementEditor } from "./expense-management-editor";

const expenses: ExpenseItem[] = [
  { id: "rent", name: "월세", kind: "fixed", categoryId: "fixed.housing", amount: 500_000, frequency: "monthly", paymentDay: 25, startDate: "2026-01-01", autoRenewal: true },
  { id: "phone", name: "휴대폰", kind: "fixed", categoryId: "fixed.telecom", amount: 70_000, frequency: "monthly", paymentDay: 10, startDate: "2026-01-01", autoRenewal: true },
  { id: "food", name: "식비", kind: "living", categoryId: "living.food", amount: 300_000, frequency: "monthly", startDate: "2026-01-01", autoRenewal: false },
  { id: "trip", name: "여행", kind: "irregular", categoryId: "irregular.travel", amount: 1_200_000, frequency: "annual", nextPaymentDate: "2026-12-01", startDate: "2026-01-01", autoRenewal: false },
];

function ControlledEditor({ initialValue = expenses, onChange = vi.fn() }: { initialValue?: ExpenseItem[]; onChange?: (value: ExpenseItem[]) => void }) {
  const [value, setValue] = useState(initialValue);
  return <ExpenseManagementEditor value={value} onChange={(next) => { setValue(next); onChange(next); }} />;
}

describe("ExpenseManagementEditor", () => {
  it("offers three keyboard-operable expense kind tabs with category subtotals", async () => {
    const user = userEvent.setup();
    render(<ControlledEditor />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(screen.getByRole("tab", { name: /고정비/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("570,000원")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /생활비/ }));
    expect(screen.getByRole("tab", { name: /생활비/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: /식비 선택/ })).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /비정기/ })).toHaveFocus();
    expect(screen.getByRole("tab", { name: /비정기/ })).toHaveAttribute("aria-selected", "true");
  });

  it("adds and edits an item while emitting a new immutable array", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledEditor onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "고정비 추가" }));
    expect(screen.getByRole("textbox", { name: "지출 이름" })).toHaveFocus();
    await user.clear(screen.getByRole("textbox", { name: "지출 이름" }));
    await user.type(screen.getByRole("textbox", { name: "지출 이름" }), "관리비");
    await user.click(screen.getByRole("button", { name: "금액에 10만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "금액에 10만원 더하기" }));

    const latest = onChange.mock.calls.at(-1)?.[0] as ExpenseItem[];
    expect(latest).not.toBe(expenses);
    expect(latest.slice(0, expenses.length)).toEqual(expenses);
    expect(latest.at(-1)).toMatchObject({ name: "관리비", amount: 200_000, kind: "fixed" });
  });

  it("shows schedule fields appropriate to the selected frequency", async () => {
    const user = userEvent.setup();
    render(<ControlledEditor />);

    await user.click(screen.getByRole("button", { name: /월세 선택/ }));
    expect(screen.getByRole("spinbutton", { name: "결제일" })).toBeInTheDocument();
    expect(screen.queryByLabelText("다음 결제일")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "반복 주기" }), "annual");
    expect(screen.getByLabelText("다음 결제일")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton", { name: "결제일" })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "반복 주기" }), "one-time");
    expect(screen.getByLabelText("지출 예정일")).toBeInTheDocument();
    expect(screen.queryByLabelText("자동 갱신")).not.toBeInTheDocument();
  });

  it("duplicates an item and supports undo-delete without confirmation", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm");
    render(<ControlledEditor />);

    await user.click(screen.getByRole("button", { name: /월세 선택/ }));
    await user.click(screen.getByRole("button", { name: "선택한 지출 복제" }));
    expect(screen.getByRole("textbox", { name: "지출 이름" })).toHaveValue("월세 복사본");

    await user.click(screen.getByRole("button", { name: "선택한 지출 삭제" }));
    expect(confirm).not.toHaveBeenCalled();
    const status = screen.getByRole("status");
    expect(within(status).getByText(/삭제했습니다/)).toBeInTheDocument();
    const undo = within(status).getByRole("button", { name: /되돌리기/ });
    expect(undo).toHaveFocus();
    await user.click(undo);
    expect(screen.getByRole("textbox", { name: "지출 이름" })).toHaveValue("월세 복사본");
  });

  it("renders a useful empty state", () => {
    render(<ControlledEditor initialValue={[]} />);
    expect(screen.getByText("등록된 고정비가 없어요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "첫 고정비 추가" })).toBeInTheDocument();
  });
});
