import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// The portal data fetchers hit the network; stub them so each test controls
// query *state*, not the payload. The active patient identity now flows through
// `fetchProfiles` (the profiles list), so it drives both the loading signal and
// whether the data queries are enabled.
vi.mock("../data/patient-portal.api", () => ({
  fetchProfiles: vi.fn(),
  fetchMedications: vi.fn(),
  fetchInvestigations: vi.fn(),
  fetchUpcomingVisits: vi.fn(),
}));

import { useHomeSummary } from "./usePortalData";
import { patientPortalQueryKeys } from "../queryKeys";
import type { PatientProfile } from "../types/patient-portal.types";
import {
  fetchProfiles,
  fetchMedications,
  fetchInvestigations,
  fetchUpcomingVisits,
} from "../data/patient-portal.api";

const PROFILES: PatientProfile[] = [
  { id: "p1", kind: "self", fullName: "Self" },
];
const pending = () => new Promise<never>(() => {});

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function freshClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderSummary(client: QueryClient) {
  return renderHook(() => useHomeSummary(), { wrapper: wrapperFor(client) });
}

beforeEach(() => {
  // Default everything to "in flight" so a test only overrides what it needs.
  vi.mocked(fetchProfiles).mockImplementation(pending);
  vi.mocked(fetchMedications).mockImplementation(pending);
  vi.mocked(fetchInvestigations).mockImplementation(pending);
  vi.mocked(fetchUpcomingVisits).mockImplementation(pending);
});

describe("useHomeSummary loading state", () => {
  it("reports loading while the patient identity is still resolving", () => {
    // Profiles in flight → the three data queries are disabled (not "loading"),
    // so the summary must still report loading or the card flashes "all clear".
    const { result } = renderSummary(freshClient());
    expect(result.current.isLoading).toBe(true);
  });

  it("reports loading once the id resolves but data is still in flight", async () => {
    const client = freshClient();
    client.setQueryData(patientPortalQueryKeys.profiles(), PROFILES);
    // Data fetchers stay pending (default) → queries enabled and loading.
    const { result } = renderSummary(client);
    await waitFor(() => expect(result.current.isLoading).toBe(true));
  });

  it("clears loading once identity and all home data have resolved", async () => {
    const client = freshClient();
    client.setQueryData(patientPortalQueryKeys.profiles(), PROFILES);
    vi.mocked(fetchMedications).mockResolvedValue([]);
    const emptyPage = { data: [], meta: { page: 1, limit: 10, total: 0 } };
    vi.mocked(fetchInvestigations).mockResolvedValue(emptyPage);
    vi.mocked(fetchUpcomingVisits).mockResolvedValue(emptyPage);

    const { result } = renderSummary(client);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("does not get stuck loading when the identity fetch fails", async () => {
    // A failed profiles fetch must not leave an eternal skeleton: `isPending` is
    // false once the query errors, and the data queries stay disabled.
    vi.mocked(fetchProfiles).mockRejectedValue(new Error("identity failed"));
    const { result } = renderSummary(freshClient());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
