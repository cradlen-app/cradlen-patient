import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import { renderWithProviders, screen } from "@/test/render";
import type { PatientProfileDetails } from "../../types/patient-portal.types";

const mocks = vi.hoisted(() => ({
  uploadMutate: vi.fn(),
  removeMutate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../../hooks/usePatientProfileSettings", () => ({
  useUploadProfileImage: () => ({ mutate: mocks.uploadMutate, isPending: false }),
  useRemoveProfileImage: () => ({ mutate: mocks.removeMutate, isPending: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { AvatarUploader } from "./AvatarUploader";

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

function makeFile(name: string, type: string, size = 1_000): File {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

function uploadFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", { value: files, configurable: true });
  fireEvent.change(input);
}

function fileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

beforeEach(() => {
  mocks.uploadMutate.mockReset();
  mocks.removeMutate.mockReset();
  mocks.toastSuccess.mockReset();
  mocks.toastError.mockReset();
});

describe("AvatarUploader", () => {
  it("shows initials and an 'Add photo' action when there is no image", () => {
    renderWithProviders(<AvatarUploader profile={profile()} />);
    expect(screen.getByText("LH")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add photo/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
  });

  it("shows the image and change/remove actions when an avatar exists", () => {
    renderWithProviders(
      <AvatarUploader profile={profile({ imageUrl: "https://x/a.png" })} />,
    );
    expect(screen.getByRole("img", { name: "Layla Hassan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Change photo/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Remove/ })).toBeInTheDocument();
  });

  it("rejects a non-image file type without uploading", () => {
    const { container } = renderWithProviders(<AvatarUploader profile={profile()} />);
    uploadFiles(fileInput(container), [makeFile("doc.pdf", "application/pdf")]);
    expect(mocks.toastError).toHaveBeenCalledWith("Choose a PNG, JPG, or WEBP image.");
    expect(mocks.uploadMutate).not.toHaveBeenCalled();
  });

  it("rejects an image larger than 5 MB", () => {
    const { container } = renderWithProviders(<AvatarUploader profile={profile()} />);
    uploadFiles(fileInput(container), [makeFile("big.png", "image/png", 6_000_000)]);
    expect(mocks.toastError).toHaveBeenCalledWith("Image must be 5 MB or smaller.");
    expect(mocks.uploadMutate).not.toHaveBeenCalled();
  });

  it("uploads a valid image", () => {
    const { container } = renderWithProviders(<AvatarUploader profile={profile()} />);
    const file = makeFile("avatar.png", "image/png", 2_000);
    uploadFiles(fileInput(container), [file]);
    expect(mocks.uploadMutate).toHaveBeenCalledWith(file, expect.anything());
  });

  it("removes the existing avatar", async () => {
    renderWithProviders(
      <AvatarUploader profile={profile({ imageUrl: "https://x/a.png" })} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Remove/ }));
    expect(mocks.removeMutate).toHaveBeenCalled();
  });
});
