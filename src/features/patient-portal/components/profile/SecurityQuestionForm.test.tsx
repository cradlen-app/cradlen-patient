import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test/render";

const mocks = vi.hoisted(() => ({
  currentQuestion: undefined as string | undefined,
  saveMutate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../../hooks/usePatientProfileSettings", () => ({
  usePatientSecurityQuestion: () => ({ data: mocks.currentQuestion }),
  useSetSecurityQuestion: () => ({ mutateAsync: mocks.saveMutate, isPending: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value?: string;
    onValueChange: (v: string) => void;
    children: ReactNode;
  }) => (
    <select aria-label="securityQuestion" value={value ?? ""} onChange={(e) => onValueChange(e.target.value)}>
      <option value="" disabled>
        choose
      </option>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}));

import { SecurityQuestionForm } from "./SecurityQuestionForm";

function passwordInput(container: HTMLElement) {
  return container.querySelector('input[type="password"]') as HTMLInputElement;
}

// The Field label isn't associated (no htmlFor), so target the lone text input.
function answerInput(container: HTMLElement) {
  return container.querySelector('input[type="text"]') as HTMLInputElement;
}

beforeEach(() => {
  mocks.currentQuestion = undefined;
  mocks.saveMutate.mockReset();
  mocks.toastSuccess.mockReset();
  mocks.toastError.mockReset();
});

describe("SecurityQuestionForm", () => {
  it("shows 'Not set yet' and a Save button when no question is configured", () => {
    renderWithProviders(<SecurityQuestionForm />);
    expect(screen.getByText("Not set yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save security question" }),
    ).toBeInTheDocument();
  });

  it("shows the stored question and an Update button when one is set", () => {
    mocks.currentQuestion = "BIRTH_CITY";
    renderWithProviders(<SecurityQuestionForm />);
    // The question text appears in the current-question line (and the select option).
    expect(
      screen.getAllByText("In which city were you born?").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Update security question" }),
    ).toBeInTheDocument();
  });

  it("blocks submit with validation errors when the form is empty", async () => {
    renderWithProviders(<SecurityQuestionForm />);
    await userEvent.click(
      screen.getByRole("button", { name: "Save security question" }),
    );
    expect(
      await screen.findByText("Please choose a security question."),
    ).toBeInTheDocument();
    expect(mocks.saveMutate).not.toHaveBeenCalled();
  });

  it("saves a new security question and toasts success", async () => {
    mocks.saveMutate.mockResolvedValue(undefined);
    const { container } = renderWithProviders(<SecurityQuestionForm />);

    await userEvent.selectOptions(
      screen.getByLabelText("securityQuestion"),
      "BIRTH_CITY",
    );
    await userEvent.type(answerInput(container), "Cairo");
    await userEvent.type(passwordInput(container), "OldPass1!");
    await userEvent.click(
      screen.getByRole("button", { name: "Save security question" }),
    );

    await waitFor(() =>
      expect(mocks.saveMutate).toHaveBeenCalledWith({
        securityQuestion: "BIRTH_CITY",
        securityAnswer: "Cairo",
        currentPassword: "OldPass1!",
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalled();
  });
});
