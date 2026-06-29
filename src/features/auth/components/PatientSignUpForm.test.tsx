import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import { renderWithProviders, screen, waitFor } from "@/test/render";
import { ApiError } from "@/infrastructure/http/api";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  startMutate: vi.fn(),
  completeMutate: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
}));

vi.mock("../hooks/usePatientAuth", () => ({
  usePatientSignupStart: () => ({ mutateAsync: mocks.startMutate, isPending: false }),
  usePatientSignupComplete: () => ({
    mutateAsync: mocks.completeMutate,
    isPending: false,
  }),
}));

// Radix Select is unreliable in jsdom (pointer capture / portals); swap it for a
// native <select> so the test exercises the form's logic, not radix internals.
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
    <select
      aria-label="securityQuestion"
      value={value ?? ""}
      onChange={(e) => onValueChange(e.target.value)}
    >
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

import { PatientSignUpForm } from "./PatientSignUpForm";

async function fillStepOne() {
  await userEvent.type(screen.getByLabelText("National ID"), "12345678901234");
  await userEvent.type(screen.getByLabelText("Phone number"), "01012345678");
  fireEvent.change(screen.getByLabelText("Date of birth"), {
    target: { value: "1990-01-01" },
  });
  await userEvent.selectOptions(
    screen.getByLabelText("securityQuestion"),
    "BIRTH_CITY",
  );
  await userEvent.type(screen.getByLabelText("Answer"), "Cairo");
}

beforeEach(() => {
  mocks.replace.mockReset();
  mocks.startMutate.mockReset();
  mocks.completeMutate.mockReset();
});

describe("PatientSignUpForm", () => {
  it("does not advance or call the backend when step 1 is invalid", async () => {
    renderWithProviders(<PatientSignUpForm />);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(mocks.startMutate).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Create account" }),
    ).not.toBeInTheDocument();
  });

  it("verifies identity and advances to step 2 on valid step 1 input", async () => {
    mocks.startMutate.mockResolvedValue({});
    renderWithProviders(<PatientSignUpForm />);

    await fillStepOne();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() =>
      expect(mocks.startMutate).toHaveBeenCalledWith({
        national_id: "12345678901234",
        date_of_birth: "1990-01-01",
        phone_number: "01012345678",
      }),
    );
    expect(
      await screen.findByRole("button", { name: "Create account" }),
    ).toBeInTheDocument();
  });

  it("surfaces a backend error on step 1 and stays put", async () => {
    mocks.startMutate.mockRejectedValue(new ApiError(409, "already registered"));
    renderWithProviders(<PatientSignUpForm />);

    await fillStepOne();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("already registered")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create account" }),
    ).not.toBeInTheDocument();
  });

  it("creates the account and redirects to the portal on step 2 submit", async () => {
    mocks.startMutate.mockResolvedValue({});
    mocks.completeMutate.mockResolvedValue({});
    renderWithProviders(<PatientSignUpForm />);

    await fillStepOne();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByRole("button", { name: "Create account" });

    await userEvent.type(screen.getByLabelText("Password"), "Abcdef1!");
    await userEvent.type(screen.getByLabelText("Confirm password"), "Abcdef1!");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(mocks.completeMutate).toHaveBeenCalledWith({
        password: "Abcdef1!",
        confirm_password: "Abcdef1!",
        security_question: "BIRTH_CITY",
        security_answer: "Cairo",
      }),
    );
    expect(mocks.replace).toHaveBeenCalledWith("/patient");
  });

  it("returns to step 1 via the Back button", async () => {
    mocks.startMutate.mockResolvedValue({});
    renderWithProviders(<PatientSignUpForm />);

    await fillStepOne();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByRole("button", { name: "Create account" });

    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });
});
