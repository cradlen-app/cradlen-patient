import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test/render";
import type { PatientProfileDetails } from "../../types/patient-portal.types";

const mocks = vi.hoisted(() => ({
  updateMutate: vi.fn(),
  updateNationalIdMutate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../../hooks/usePatientProfileSettings", () => ({
  useUpdatePatientProfile: () => ({ mutateAsync: mocks.updateMutate, isPending: false }),
  useUpdateNationalId: () => ({
    mutateAsync: mocks.updateNationalIdMutate,
    isPending: false,
  }),
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
    <select aria-label="maritalStatus" value={value ?? ""} onChange={(e) => onValueChange(e.target.value)}>
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

import { ProfileInfoForm } from "./ProfileInfoForm";

function profile(overrides: Partial<PatientProfileDetails> = {}): PatientProfileDetails {
  return {
    id: "p1",
    fullName: "Layla Hassan",
    nationalId: "12345678901234",
    dateOfBirth: "1990-01-01",
    phoneNumber: "01012345678",
    address: "Cairo",
    maritalStatus: "MARRIED",
    imageUrl: null,
    ...overrides,
  };
}

const submit = () =>
  userEvent.click(screen.getByRole("button", { name: "Save changes" }));

beforeEach(() => {
  mocks.updateMutate.mockReset();
  mocks.toastSuccess.mockReset();
  mocks.toastError.mockReset();
});

describe("ProfileInfoForm", () => {
  it("prefills the form from the profile and locks the national id", () => {
    renderWithProviders(<ProfileInfoForm profile={profile()} />);
    expect(screen.getByDisplayValue("Layla Hassan")).toBeInTheDocument();
    const nationalId = screen.getByDisplayValue("12345678901234");
    expect(nationalId).toBeDisabled();
  });

  it("rejects a too-short full name", async () => {
    renderWithProviders(<ProfileInfoForm profile={profile()} />);
    const fullName = screen.getByDisplayValue("Layla Hassan");
    await userEvent.clear(fullName);
    await userEvent.type(fullName, "L");
    await submit();
    expect(await screen.findByText("Enter at least 2 characters.")).toBeInTheDocument();
    expect(mocks.updateMutate).not.toHaveBeenCalled();
  });

  it("submits the updated profile and toasts success", async () => {
    mocks.updateMutate.mockResolvedValue(undefined);
    renderWithProviders(<ProfileInfoForm profile={profile()} />);
    const fullName = screen.getByDisplayValue("Layla Hassan");
    await userEvent.clear(fullName);
    await userEvent.type(fullName, "Layla H. Mohamed");
    await submit();

    await waitFor(() =>
      expect(mocks.updateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Layla H. Mohamed",
          maritalStatus: "MARRIED",
        }),
      ),
    );
    expect(mocks.toastSuccess).toHaveBeenCalled();
  });
});
