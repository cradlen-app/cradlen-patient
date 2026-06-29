import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mocks = vi.hoisted(() => ({
  fetchMedications: vi.fn(),
  activeId: "",
}));

// usePortalData imports many fetchers; useMedications only uses fetchMedications,
// so the rest can stay undefined (never invoked in these tests).
vi.mock("../data/patient-portal.api", () => ({
  fetchMedications: mocks.fetchMedications,
}));

// Control the fixture-profile id that feeds useResolvedPatientId.
vi.mock("./usePatientProfiles", () => ({
  useActivePatientId: () => mocks.activeId,
}));

import { useMedications } from "./usePortalData";

const ME_KEY = ["patient-portal", "me"];

type Identity = { patient_id: string | null; accessible_patient_ids: string[] };

function setup(opts: { identity?: Identity; activeId?: string } = {}) {
  mocks.activeId = opts.activeId ?? "";
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  if (opts.identity) client.setQueryData(ME_KEY, opts.identity);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useMedications(), { wrapper });
}

beforeEach(() => {
  mocks.fetchMedications.mockReset();
  mocks.fetchMedications.mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useMedications (identity resolution + gating)", () => {
  it("stays idle and does not fetch until a patient id resolves", async () => {
    const { result } = setup({ identity: undefined });
    // No identity in the cache and no fixture id → query is disabled.
    expect(result.current.fetchStatus).toBe("idle");
    await new Promise((r) => setTimeout(r, 10));
    expect(mocks.fetchMedications).not.toHaveBeenCalled();
  });

  it("resolves the account holder when no accessible fixture id is active", async () => {
    setup({
      identity: { patient_id: "acct", accessible_patient_ids: ["acct"] },
      activeId: "",
    });
    await waitFor(() =>
      expect(mocks.fetchMedications).toHaveBeenCalledWith("acct"),
    );
  });

  it("prefers the active fixture id when it is an accessible patient", async () => {
    setup({
      identity: { patient_id: "acct", accessible_patient_ids: ["acct", "dep"] },
      activeId: "dep",
    });
    await waitFor(() =>
      expect(mocks.fetchMedications).toHaveBeenCalledWith("dep"),
    );
  });

  it("falls back to the first accessible id when patient_id is null", async () => {
    setup({
      identity: { patient_id: null, accessible_patient_ids: ["first", "second"] },
      activeId: "",
    });
    await waitFor(() =>
      expect(mocks.fetchMedications).toHaveBeenCalledWith("first"),
    );
  });
});
