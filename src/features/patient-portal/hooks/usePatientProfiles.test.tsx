import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { patientPortalQueryKeys } from "../queryKeys";
import type { PatientProfile } from "../types/patient-portal.types";

const mocks = vi.hoisted(() => ({ stored: "" }));

// Control the persisted active-profile id without touching real storage.
vi.mock("../store/patientProfileStore", () => ({
  usePatientProfileStore: (selector: (s: { activeProfileId: string }) => unknown) =>
    selector({ activeProfileId: mocks.stored }),
  DEFAULT_PROFILE_ID: "",
}));

// Tests seed the profiles cache directly; when they don't (the "still loading"
// case), keep the fetch pending so the query never resolves to `undefined`.
vi.mock("../data/patient-portal.api", () => ({
  fetchProfiles: vi.fn(() => new Promise<never>(() => {})),
}));

import { useActivePatientId } from "./usePatientProfiles";

const SELF: PatientProfile = { id: "acct", kind: "self", fullName: "Self" };
const DEP: PatientProfile = {
  id: "dep",
  kind: "dependent",
  fullName: "Dependent",
  relation: "Daughter",
};

function renderActiveId(opts: {
  stored?: string;
  profiles?: PatientProfile[];
}) {
  mocks.stored = opts.stored ?? "";
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  if (opts.profiles) {
    client.setQueryData(patientPortalQueryKeys.profiles(), opts.profiles);
  }
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useActivePatientId(), { wrapper });
}

beforeEach(() => {
  mocks.stored = "";
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useActivePatientId", () => {
  it("returns the stored id while the profiles are still loading", () => {
    const { result } = renderActiveId({ stored: "pending", profiles: undefined });
    expect(result.current).toBe("pending");
  });

  it("defaults to the account holder (self) when nothing is stored", () => {
    const { result } = renderActiveId({ stored: "", profiles: [SELF, DEP] });
    expect(result.current).toBe("acct");
  });

  it("keeps the stored id when it is an accessible profile (dependent)", () => {
    const { result } = renderActiveId({ stored: "dep", profiles: [SELF, DEP] });
    expect(result.current).toBe("dep");
  });

  it("falls back to self when the stored id is not accessible (stale)", () => {
    const { result } = renderActiveId({ stored: "ghost", profiles: [SELF, DEP] });
    expect(result.current).toBe("acct");
  });

  it("falls back to the first profile when there is no self", () => {
    const { result } = renderActiveId({ stored: "ghost", profiles: [DEP] });
    expect(result.current).toBe("dep");
  });
});
