import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import { renderWithProviders, screen, waitFor } from "@/test/render";
import { ApiError } from "@/infrastructure/http/api";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  startMutate: vi.fn(),
  completeMutate: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
}));

vi.mock("../hooks/usePatientAuth", () => ({
  usePatientForgotPasswordStart: () => ({
    mutateAsync: mocks.startMutate,
    isPending: false,
  }),
  usePatientForgotPasswordComplete: () => ({
    mutateAsync: mocks.completeMutate,
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess } }));

import { PatientForgotPasswordForm } from "./PatientForgotPasswordForm";

const STRONG = "Abcdef1!";

async function completeStepOne() {
  await userEvent.type(screen.getByLabelText("National ID"), "12345678901234");
  await userEvent.type(screen.getByLabelText("Phone number"), "01012345678");
  fireEvent.change(screen.getByLabelText("Date of birth"), {
    target: { value: "1990-01-01" },
  });
  await userEvent.click(screen.getByRole("button", { name: "Continue" }));
}

beforeEach(() => {
  mocks.replace.mockReset();
  mocks.startMutate.mockReset();
  mocks.completeMutate.mockReset();
  mocks.toastSuccess.mockReset();
});

describe("PatientForgotPasswordForm", () => {
  it("advances to step 2 and shows the verified security question", async () => {
    mocks.startMutate.mockResolvedValue({ security_question: "BIRTH_CITY" });
    renderWithProviders(<PatientForgotPasswordForm />);

    await completeStepOne();

    await waitFor(() =>
      expect(mocks.startMutate).toHaveBeenCalledWith({
        national_id: "12345678901234",
        date_of_birth: "1990-01-01",
        phone_number: "01012345678",
      }),
    );
    expect(
      await screen.findByText("In which city were you born?"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset password" })).toBeInTheDocument();
  });

  it("shows an identity error when step 1 fails with an ApiError", async () => {
    mocks.startMutate.mockRejectedValue(new ApiError(404, "no match"));
    renderWithProviders(<PatientForgotPasswordForm />);

    await completeStepOne();

    expect(await screen.findByText("no match")).toBeInTheDocument();
    // Still on step 1 — no security question rendered.
    expect(
      screen.queryByRole("button", { name: "Reset password" }),
    ).not.toBeInTheDocument();
  });

  it("resets the password, toasts success, and redirects to sign-in", async () => {
    mocks.startMutate.mockResolvedValue({ security_question: "BIRTH_CITY" });
    mocks.completeMutate.mockResolvedValue({ data: { reset: true } });
    renderWithProviders(<PatientForgotPasswordForm />);

    await completeStepOne();
    await screen.findByRole("button", { name: "Reset password" });

    await userEvent.type(screen.getByLabelText("Answer"), "Cairo");
    await userEvent.type(screen.getByLabelText("New password"), STRONG);
    await userEvent.type(screen.getByLabelText("Confirm password"), STRONG);
    await userEvent.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() =>
      expect(mocks.completeMutate).toHaveBeenCalledWith({
        security_answer: "Cairo",
        password: STRONG,
        confirm_password: STRONG,
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("/patient/signin");
  });

  it("shows an invalid-answer error on a 401 at step 2", async () => {
    mocks.startMutate.mockResolvedValue({ security_question: "BIRTH_CITY" });
    mocks.completeMutate.mockRejectedValue(new ApiError(401, "unauthorized"));
    renderWithProviders(<PatientForgotPasswordForm />);

    await completeStepOne();
    await screen.findByRole("button", { name: "Reset password" });

    await userEvent.type(screen.getByLabelText("Answer"), "Wrong");
    await userEvent.type(screen.getByLabelText("New password"), STRONG);
    await userEvent.type(screen.getByLabelText("Confirm password"), STRONG);
    await userEvent.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByText("That answer is incorrect.")).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
