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

// The single active-patient resolver — every live hook reads it. The
// self/dependent/fallback resolution it performs is covered by
// usePatientProfiles.test.tsx; here we only assert the gating contract.
vi.mock("./usePatientProfiles", () => ({
  useActivePatientId: () => mocks.activeId,
  usePatientProfiles: () => ({ isPending: false }),
}));

import { useMedications } from "./usePortalData";

function setup(opts: { activeId?: string } = {}) {
  mocks.activeId = opts.activeId ?? "";
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
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

describe("useMedications (gating on the active patient id)", () => {
  it("stays idle and does not fetch until a patient id resolves", async () => {
    const { result } = setup({ activeId: "" });
    // Empty id (identity still loading) → query is disabled.
    expect(result.current.fetchStatus).toBe("idle");
    await new Promise((r) => setTimeout(r, 10));
    expect(mocks.fetchMedications).not.toHaveBeenCalled();
  });

  it("fetches for the active patient once an id resolves", async () => {
    setup({ activeId: "acct" });
    await waitFor(() =>
      expect(mocks.fetchMedications).toHaveBeenCalledWith("acct"),
    );
  });

  it("scopes the fetch to the active dependent profile", async () => {
    setup({ activeId: "dep" });
    await waitFor(() =>
      expect(mocks.fetchMedications).toHaveBeenCalledWith("dep"),
    );
  });
});
