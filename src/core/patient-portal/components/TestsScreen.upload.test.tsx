import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import { renderWithProviders, screen } from "@/test/render";
import type { PortalTest } from "../types/patient-portal.types";

type InvState = {
  entries: PortalTest[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
};

const mocks = vi.hoisted(() => ({
  entries: [] as PortalTest[],
  uploadMutate: vi.fn(),
  removeMutate: vi.fn(),
}));

vi.mock("../hooks/usePortalData", () => ({
  useInvestigations: (): InvState => ({
    entries: mocks.entries,
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    loadMore: () => {},
  }),
}));

vi.mock("../hooks/useUploadInvestigationResult", () => ({
  useUploadInvestigationResult: () => ({
    mutateAsync: mocks.uploadMutate,
    isPending: false,
  }),
  useRemoveInvestigationAttachment: () => ({
    mutateAsync: mocks.removeMutate,
    isPending: false,
  }),
}));

import { TestsScreen } from "./TestsScreen";

function pendingTest(): PortalTest {
  return {
    id: "t1",
    name: "Complete Blood Count",
    date: "2026-06-01T00:00:00.000Z",
    doctorName: "Dr. Jane Doe",
    category: "lab",
    status: "pending", // editable: patient may attach files
    clinic: { id: "c1", name: "Maadi Branch" },
    results: [],
  } as PortalTest;
}

function makeFile(name: string, type: string, size = 1_000): File {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

/** Set files on a file input bypassing the `accept` filter, then fire change. */
function uploadFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", { value: files, configurable: true });
  fireEvent.change(input);
}

function fileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

beforeEach(() => {
  mocks.entries = [pendingTest()];
  mocks.uploadMutate.mockReset();
  mocks.removeMutate.mockReset();
});

async function expandCard() {
  await userEvent.click(
    screen.getByRole("button", { name: /Complete Blood Count/ }),
  );
}

describe("TestCard upload flow", () => {
  it("rejects an unsupported file type", async () => {
    const { container } = renderWithProviders(<TestsScreen />);
    await expandCard();
    uploadFiles(fileInput(container), [makeFile("notes.txt", "text/plain")]);
    expect(
      await screen.findByText("Only PDF, PNG, JPEG, or WebP files are allowed."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("rejects a file larger than the 15 MB limit", async () => {
    const { container } = renderWithProviders(<TestsScreen />);
    await expandCard();
    uploadFiles(fileInput(container), [
      makeFile("scan.png", "image/png", 16_000_000),
    ]);
    expect(
      await screen.findByText("Each file must be 15 MB or smaller."),
    ).toBeInTheDocument();
  });

  it("accepts a valid file and uploads the pending selection on Save", async () => {
    mocks.uploadMutate.mockResolvedValue(undefined);
    const { container } = renderWithProviders(<TestsScreen />);
    await expandCard();

    const file = makeFile("result.png", "image/png", 2_000);
    uploadFiles(fileInput(container), [file]);

    const saveButton = await screen.findByRole("button", { name: "Save" });
    await userEvent.click(saveButton);

    expect(mocks.uploadMutate).toHaveBeenCalledWith({
      investigationId: "t1",
      files: [file],
    });
  });
});
