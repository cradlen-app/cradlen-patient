import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test/render";
import { ApiError } from "@/infrastructure/http/api";

// --- Mocks --------------------------------------------------------------------
// Hoisted spies so the vi.mock factories (hoisted above imports) can close over them.
const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={typeof href === "string" ? href : "#"}>{children}</a>
  ),
}));

vi.mock("../hooks/usePatientAuth", () => ({
  usePatientLogin: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: mocks.isPending,
  }),
}));

import { PatientSignInForm } from "./PatientSignInForm";

const VALID = { nationalId: "12345678901234", password: "Abcdef1!" };

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText("National ID"), VALID.nationalId);
  await userEvent.type(screen.getByLabelText("Password"), VALID.password);
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

beforeEach(() => {
  mocks.replace.mockReset();
  mocks.mutateAsync.mockReset();
});

describe("PatientSignInForm", () => {
  it("blocks submit and shows validation errors for empty fields", async () => {
    renderWithProviders(<PatientSignInForm />);
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("National ID is required")).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("submits credentials and redirects to the portal on success", async () => {
    mocks.mutateAsync.mockResolvedValue({ data: { authenticated: true } });
    renderWithProviders(<PatientSignInForm />);
    await fillAndSubmit();

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        national_id: VALID.nationalId,
        password: VALID.password,
      }),
    );
    expect(mocks.replace).toHaveBeenCalledWith("/patient");
  });

  it("shows an invalid-credentials message on a 401", async () => {
    mocks.mutateAsync.mockRejectedValue(new ApiError(401, "Unauthorized"));
    renderWithProviders(<PatientSignInForm />);
    await fillAndSubmit();

    expect(
      await screen.findByText("Invalid National ID or password"),
    ).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("surfaces the backend message for non-401 ApiErrors", async () => {
    mocks.mutateAsync.mockRejectedValue(new ApiError(429, "Too many attempts"));
    renderWithProviders(<PatientSignInForm />);
    await fillAndSubmit();

    expect(await screen.findByText("Too many attempts")).toBeInTheDocument();
  });

  it("falls back to a generic server error for non-ApiError failures", async () => {
    mocks.mutateAsync.mockRejectedValue(new Error("network down"));
    renderWithProviders(<PatientSignInForm />);
    await fillAndSubmit();

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    renderWithProviders(<PatientSignInForm />);
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    expect(password.type).toBe("password");
    await userEvent.click(screen.getByRole("button", { name: /^show$/i }));
    expect(password.type).toBe("text");
  });
});
