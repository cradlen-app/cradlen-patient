import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test/render";
import { ApiError } from "@/infrastructure/http/api";

const mocks = vi.hoisted(() => ({
  changeMutate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../../hooks/usePatientProfileSettings", () => ({
  useChangePassword: () => ({ mutateAsync: mocks.changeMutate, isPending: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { ChangePasswordForm } from "./ChangePasswordForm";

const STRONG = "Abcdef1!";

function passwordInputs(container: HTMLElement) {
  const [current, next, confirm] = Array.from(
    container.querySelectorAll<HTMLInputElement>('input[type="password"]'),
  );
  return { current, next, confirm };
}

async function fill(container: HTMLElement, values: {
  current: string;
  next: string;
  confirm: string;
}) {
  const inputs = passwordInputs(container);
  if (values.current) await userEvent.type(inputs.current, values.current);
  if (values.next) await userEvent.type(inputs.next, values.next);
  if (values.confirm) await userEvent.type(inputs.confirm, values.confirm);
}

const submit = () =>
  userEvent.click(screen.getByRole("button", { name: "Change password" }));

beforeEach(() => {
  mocks.changeMutate.mockReset();
  mocks.toastSuccess.mockReset();
  mocks.toastError.mockReset();
});

describe("ChangePasswordForm", () => {
  it("blocks submit and shows required errors on an empty form", async () => {
    renderWithProviders(<ChangePasswordForm />);
    await submit();
    expect((await screen.findAllByText("Required")).length).toBeGreaterThan(0);
    expect(mocks.changeMutate).not.toHaveBeenCalled();
  });

  it("rejects a weak new password", async () => {
    const { container } = renderWithProviders(<ChangePasswordForm />);
    await fill(container, { current: "OldPass1!", next: "weakpass", confirm: "weakpass" });
    await submit();
    expect(
      await screen.findByText(
        "Password must include uppercase, lowercase, a number, and a special character.",
      ),
    ).toBeInTheDocument();
    expect(mocks.changeMutate).not.toHaveBeenCalled();
  });

  it("flags mismatched confirmation", async () => {
    const { container } = renderWithProviders(<ChangePasswordForm />);
    await fill(container, { current: "OldPass1!", next: STRONG, confirm: "Different1!" });
    await submit();
    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
  });

  it("submits the change and toasts success", async () => {
    mocks.changeMutate.mockResolvedValue(undefined);
    const { container } = renderWithProviders(<ChangePasswordForm />);
    await fill(container, { current: "OldPass1!", next: STRONG, confirm: STRONG });
    await submit();

    await waitFor(() =>
      expect(mocks.changeMutate).toHaveBeenCalledWith({
        currentPassword: "OldPass1!",
        newPassword: STRONG,
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalled();
  });

  it("toasts the backend message on an ApiError", async () => {
    mocks.changeMutate.mockRejectedValue(new ApiError(400, "Current password is wrong"));
    const { container } = renderWithProviders(<ChangePasswordForm />);
    await fill(container, { current: "OldPass1!", next: STRONG, confirm: STRONG });
    await submit();

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Current password is wrong"),
    );
  });
});
