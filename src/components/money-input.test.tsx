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

function ExternalResetHarness() {
  const [value, setValue] = useState(3_200_000);
  return (
    <>
      <MoneyInput id="monthly-pay" label="월급" value={value} allowNegative onChange={setValue} />
      <button type="button" onClick={() => setValue(7_500_000)}>외부 값 설정</button>
      <button type="button" onClick={() => setValue(3_200_000)}>원래 값 복원</button>
    </>
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

  it("ignores whitespace and treats only a leading minus as negative", () => {
    const onChange = vi.fn();
    render(<ControlledMoneyInput allowNegative onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox", { name: "월급" }), {
      target: { value: "  1 234  " },
    });
    expect(onChange).toHaveBeenLastCalledWith(12_340_000);

    fireEvent.change(screen.getByRole("textbox", { name: "월급" }), {
      target: { value: "5-0" },
    });
    expect(onChange).toHaveBeenLastCalledWith(500_000);
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

  it("keeps a standalone minus draft while sequentially typing a negative amount", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledMoneyInput initialValue={0} allowNegative onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "월급" });

    await user.clear(input);
    const callsAfterClear = onChange.mock.calls.length;
    await user.type(input, "-");

    expect(input).toHaveValue("-");
    expect(onChange).toHaveBeenCalledTimes(callsAfterClear);

    await user.type(input, "50");
    expect(input).toHaveValue("-50");
    expect(onChange).toHaveBeenLastCalledWith(-500_000);
  });

  it("emits zero and updates the preview when a nonzero edit is cleared", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledMoneyInput initialValue={3_200_000} onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "월급" });

    await user.clear(input);

    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(input).toHaveValue("");
    expect(screen.getByText("영원")).toBeInTheDocument();
  });

  it("synchronizes its display when an external value replaces a complete draft", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <MoneyInput id="monthly-pay" label="월급" value={3_200_000} onChange={onChange} />,
    );

    rerender(<MoneyInput id="monthly-pay" label="월급" value={7_500_000} onChange={onChange} />);

    expect(screen.getByRole("textbox", { name: "월급" })).toHaveValue("750");
  });

  it("clears an incomplete draft when the controlled value changes externally", async () => {
    const user = userEvent.setup();
    render(<ExternalResetHarness />);
    const input = screen.getByRole("textbox", { name: "월급" });

    await user.clear(input);
    await user.type(input, "-");
    expect(input).toHaveValue("-");

    await user.click(screen.getByRole("button", { name: "외부 값 설정" }));
    expect(input).toHaveValue("750");
  });

  it("roundtrips integer KRW through four decimal manwon places", () => {
    const onChange = vi.fn();
    render(<ControlledMoneyInput initialValue={1} onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "월급" });

    expect(input).toHaveValue("0.0001");
    fireEvent.change(input, { target: { value: "0.0001 " } });
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(input).toHaveValue("0.0001");
  });

  it("preserves partial decimal drafts during sequential typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledMoneyInput initialValue={0} onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "월급" });

    await user.clear(input);
    await user.type(input, "1.");
    expect(input).toHaveValue("1.");
    await user.type(input, "5");

    expect(input).toHaveValue("1.5");
    expect(onChange).toHaveBeenLastCalledWith(15_000);
  });

  it("lets a later controlled reset supersede an acknowledged clear draft", async () => {
    const user = userEvent.setup();
    render(<ExternalResetHarness />);
    const input = screen.getByRole("textbox", { name: "월급" });

    await user.clear(input);
    expect(input).toHaveValue("");
    expect(screen.getByText("영원")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "원래 값 복원" }));
    expect(input).toHaveValue("320");
  });

  it("gives the textbox a minimum 44px hit area", () => {
    render(<MoneyInput id="monthly-pay" label="월급" value={0} onChange={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "월급" })).toHaveClass("min-h-11");
  });

  it("preserves logical caret positions through controlled insertion, replacement, and deletion", () => {
    const { unmount } = render(<ControlledMoneyInput initialValue={1_230_000} />);
    const input = screen.getByRole("textbox", { name: "월급" }) as HTMLInputElement;
    input.focus();

    fireEvent.change(input, { target: { value: "1234", selectionStart: 4, selectionEnd: 4 } });
    expect(input).toHaveValue("1,234");
    expect(input.selectionStart).toBe(5);

    fireEvent.change(input, { target: { value: "1,934", selectionStart: 3, selectionEnd: 3 } });
    expect(input).toHaveValue("1,934");
    expect(input.selectionStart).toBe(3);

    fireEvent.change(input, { target: { value: "1,34", selectionStart: 2, selectionEnd: 2 } });
    expect(input).toHaveValue("134");
    expect(input.selectionStart).toBe(1);
    unmount();
  });

  it("renders every default quick amount and supports a custom list", () => {
    const { rerender } = render(
      <MoneyInput id="monthly-pay" label="월급" value={0} onChange={vi.fn()} />,
    );

    for (const amount of [10, 50, 100, 500]) {
      expect(screen.getByRole("button", { name: `월급에 ${amount}만원 더하기` })).toBeInTheDocument();
    }

    rerender(
      <MoneyInput
        id="monthly-pay"
        label="월급"
        value={0}
        onChange={vi.fn()}
        quickAmountsManwon={[20, 200]}
      />,
    );
    expect(screen.getByRole("button", { name: "월급에 20만원 더하기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "월급에 200만원 더하기" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "월급에 10만원 더하기" })).not.toBeInTheDocument();
  });

  it("supports subtracting quick amounts for adjustment-heavy inputs", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MoneyInput
        id="monthly-pay"
        label="월급"
        value={3_200_000}
        onChange={onChange}
        quickAmountMode="adjust"
        quickAmountsManwon={[50, 100]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "월급에서 50만원 빼기" }));
    expect(onChange).toHaveBeenLastCalledWith(2_700_000);
    expect(screen.getByRole("button", { name: "월급에 100만원 더하기" })).toBeInTheDocument();
  });

  it("supports setting common amounts without repeated zeros", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MoneyInput
        id="monthly-pay"
        label="월급"
        value={3_200_000}
        onChange={onChange}
        quickAmountMode="set"
        quickAmountsManwon={[250, 300]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "월급을 250만원으로 설정" }));
    expect(onChange).toHaveBeenLastCalledWith(2_500_000);
  });

  it("filters invalid quick amounts and clamps boundary additions to a safe manwon multiple", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const largestSafeKrwMultiple = Math.floor(Number.MAX_SAFE_INTEGER / 10_000) * 10_000;
    render(
      <MoneyInput
        id="monthly-pay"
        label="월급"
        value={largestSafeKrwMultiple - 10_000}
        onChange={onChange}
        quickAmountsManwon={[1, 0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1.5]}
      />,
    );

    expect(screen.getAllByRole("button", { name: /만원 더하기/ })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "월급에 1만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월급에 1만원 더하기" }));
    expect(onChange).toHaveBeenLastCalledWith(largestSafeKrwMultiple);
    expect(Number.isSafeInteger(onChange.mock.calls.at(-1)?.[0])).toBe(true);
  });

  it("associates the unit and preview help with the textbox", () => {
    render(<MoneyInput id="monthly-pay" label="월급" value={5_200_000} onChange={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: "월급" });
    const describedBy = input.getAttribute("aria-describedby")?.split(" ") ?? [];

    expect(describedBy).toEqual(["monthly-pay-unit", "monthly-pay-preview"]);
    expect(document.getElementById(describedBy[0])).toHaveTextContent("만원");
    expect(document.getElementById(describedBy[1])).toHaveTextContent("오백이십만원");
  });

  it("provides an accessible sign toggle while retaining the numeric keypad mode", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledMoneyInput initialValue={500_000} allowNegative onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "월급" });

    expect(input).toHaveAttribute("inputmode", "numeric");
    await user.click(screen.getByRole("button", { name: "월급 부호 전환" }));
    expect(onChange).toHaveBeenLastCalledWith(-500_000);
    expect(input).toHaveValue("-50");
  });

  it("hides the Korean money preview when requested", () => {
    render(
      <MoneyInput
        id="monthly-pay"
        label="월급"
        value={5_200_000}
        onChange={vi.fn()}
        showPreview={false}
      />,
    );

    expect(screen.queryByText("오백이십만원")).not.toBeInTheDocument();
  });

  it("clamps oversized manwon input to the largest safe KRW multiple", () => {
    const onChange = vi.fn();
    render(<ControlledMoneyInput onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox", { name: "월급" }), {
      target: { value: "999999999999999999999999" },
    });

    const largestSafeKrwMultiple = Math.floor(Number.MAX_SAFE_INTEGER / 10_000) * 10_000;
    expect(Number.isSafeInteger(largestSafeKrwMultiple)).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(largestSafeKrwMultiple);
  });
});
