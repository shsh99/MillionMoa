import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { formatKoreanMoney, MoneyInput } from "./money-input";

function ControlledMoneyInput({
  initialValue = 3_200_000,
  allowNegative = false,
  onChange = vi.fn(),
}: {
  initialValue?: number;
  allowNegative?: boolean;
  onChange?: (value: number) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <MoneyInput
      id="monthly-pay"
      label="월급"
      value={value}
      allowNegative={allowNegative}
      onChange={(nextValue) => {
        onChange(nextValue);
        setValue(nextValue);
      }}
    />
  );
}

describe("formatKoreanMoney", () => {
  it("formats integer KRW with natural Korean units", () => {
    expect(formatKoreanMoney(5_200_000)).toBe("오백이십만원");
    expect(formatKoreanMoney(0)).toBe("영원");
    expect(formatKoreanMoney(-50_000)).toBe("마이너스 오만원");
  });
});

describe("MoneyInput", () => {
  it("accumulates quick amounts from the latest controlled value", async () => {
    const user = userEvent.setup();
    render(<ControlledMoneyInput />);

    const addButton = screen.getByRole("button", { name: "월급에 100만원 더하기" });
    await user.click(addButton);
    await user.click(addButton);

    expect(screen.getByRole("textbox", { name: "월급" })).toHaveValue("520");
    expect(screen.getByText("오백이십만원")).toBeInTheDocument();
  });

  it("clears the amount to zero", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledMoneyInput onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "월급 금액 지우기" }));

    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(screen.getByRole("textbox", { name: "월급" })).toHaveValue("0");
  });

  it("sanitizes direct manwon entry and emits integer KRW", () => {
    const onChange = vi.fn();
    render(<ControlledMoneyInput onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox", { name: "월급" }), {
      target: { value: "1,234abc" },
    });

    expect(onChange).toHaveBeenLastCalledWith(12_340_000);
    expect(screen.getByRole("textbox", { name: "월급" })).toHaveValue("1,234");
  });

  it("clamps negative direct entry unless negatives are allowed", () => {
    const clampedChange = vi.fn();
    const { unmount } = render(<ControlledMoneyInput onChange={clampedChange} />);

    fireEvent.change(screen.getByRole("textbox", { name: "월급" }), {
      target: { value: "-50" },
    });
    expect(clampedChange).toHaveBeenLastCalledWith(0);

    unmount();
    const negativeChange = vi.fn();
    render(<ControlledMoneyInput allowNegative onChange={negativeChange} />);
    fireEvent.change(screen.getByRole("textbox", { name: "월급" }), {
      target: { value: "-50" },
    });
    expect(negativeChange).toHaveBeenLastCalledWith(-500_000);
  });

  it("preserves input focus and selection across controlled updates", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <MoneyInput id="monthly-pay" label="월급" value={3_200_000} onChange={onChange} />,
    );
    const input = screen.getByRole("textbox", { name: "월급" }) as HTMLInputElement;
    input.focus();
    input.setSelectionRange(1, 2);
    fireEvent.select(input);

    rerender(<MoneyInput id="monthly-pay" label="월급" value={3_250_000} onChange={onChange} />);

    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(1);
    expect(input.selectionEnd).toBe(2);
  });
});
