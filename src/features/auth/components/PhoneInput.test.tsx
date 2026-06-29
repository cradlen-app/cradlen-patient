import { describe, expect, it, vi } from "vitest";
import type { UseFormRegisterReturn } from "react-hook-form";
import { renderWithProviders, screen } from "@/test/render";
import { PhoneInput } from "./PhoneInput";

function registration(name = "phoneNumber"): UseFormRegisterReturn {
  return { name, onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() };
}

const baseProps = {
  id: "phoneNumber",
  label: "Phone number",
  placeholder: "01x xxxx xxxx",
  registration: registration(),
  inputClassName: "input",
  errorInputClassName: "error",
};

describe("PhoneInput", () => {
  it("renders a tel input with the label and placeholder", () => {
    renderWithProviders(<PhoneInput {...baseProps} />);
    const input = screen.getByLabelText("Phone number");
    expect(input).toHaveAttribute("type", "tel");
    expect(input).toHaveAttribute("placeholder", "01x xxxx xxxx");
  });

  it("shows the error and applies the error class when present", () => {
    const { container } = renderWithProviders(
      <PhoneInput {...baseProps} error="Invalid phone" />,
    );
    expect(screen.getByText("Invalid phone")).toBeInTheDocument();
    expect(container.querySelector("input")?.className).toContain("error");
  });

  it("does not render an error paragraph when there is no error", () => {
    const { container } = renderWithProviders(<PhoneInput {...baseProps} />);
    expect(container.querySelector("p")).toBeNull();
  });
});
