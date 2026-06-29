import { describe, expect, it, vi } from "vitest";
import type { UseFormRegisterReturn } from "react-hook-form";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";
import { PasswordInput } from "./PasswordInput";

function registration(name = "password"): UseFormRegisterReturn {
  return { name, onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() };
}

const baseProps = {
  id: "password",
  label: "Password",
  placeholder: "Enter password",
  registration: registration(),
  inputClassName: "input",
  errorInputClassName: "error",
  showLabel: "Show",
  hideLabel: "Hide",
};

describe("PasswordInput", () => {
  it("renders masked by default and toggles to text", async () => {
    renderWithProviders(<PasswordInput {...baseProps} />);
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    expect(input.type).toBe("password");

    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(input.type).toBe("text");
    await userEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(input.type).toBe("password");
  });

  it("renders the error message and applies the error class when present", () => {
    const { container } = renderWithProviders(
      <PasswordInput {...baseProps} error="Too weak" />,
    );
    expect(screen.getByText("Too weak")).toBeInTheDocument();
    expect(container.querySelector("input")?.className).toContain("error");
  });

  it("wires the field registration name onto the input", () => {
    renderWithProviders(
      <PasswordInput {...baseProps} registration={registration("confirmPassword")} />,
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "name",
      "confirmPassword",
    );
  });
});
