import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

// The portal data fetchers hit the network; stub them so each test controls
// query *state*, not the payload. Profiles is irrelevant to the home summary
// (whose id comes from `me()`), so it stays perpetually pending.
vi.mock("../data/patient-portal.api", () => ({
  fetchProfiles: vi.fn(),
  fetchMedications: vi.fn(),
  fetchInvestigations: vi.fn(),
  fetchUpcomingVisits: vi.fn(),
}));

import { useHomeSummary } from "./usePortalData";
import { patientPortalQueryKeys } from "../queryKeys";
import {
  fetchProfiles,
  fetchMedications,
  fetchInvestigations,
  fetchUpcomingVisits,
} from "../data/patient-portal.api";

const ME = { patient_id: "p1", accessible_patient_ids: ["p1"] };
const pending = () => new Promise<never>(() => {});

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function freshClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/** Render useHomeSummary while a companion observer drives the shared `me()`
 *  cache, mirroring how PatientNavbar's `usePatientMe` populates it. */
function renderSummary(client: QueryClient, meQueryFn: () => Promise<unknown>) {
  return renderHook(
    () => {
      useQuery({ queryKey: patientPortalQueryKeys.me(), queryFn: meQueryFn });
      return useHomeSummary();
    },
    { wrapper: wrapperFor(client) },
  );
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
    // `me()` in flight → the three data queries are disabled (not "loading"),
    // so the summary must still report loading or the card flashes "all clear".
    const { result } = renderSummary(freshClient(), pending);
    expect(result.current.isLoading).toBe(true);
  });

  it("reports loading once the id resolves but data is still in flight", async () => {
    const client = freshClient();
    client.setQueryData(patientPortalQueryKeys.me(), ME);
    // Data fetchers stay pending (default) → queries enabled and loading.
    const { result } = renderSummary(client, pending);
    await waitFor(() => expect(result.current.isLoading).toBe(true));
  });

  it("clears loading once identity and all home data have resolved", async () => {
    const client = freshClient();
    client.setQueryData(patientPortalQueryKeys.me(), ME);
    vi.mocked(fetchMedications).mockResolvedValue([]);
    const emptyPage = { data: [], meta: { page: 1, limit: 10, total: 0 } };
    vi.mocked(fetchInvestigations).mockResolvedValue(emptyPage);
    vi.mocked(fetchUpcomingVisits).mockResolvedValue(emptyPage);

    const { result } = renderSummary(client, pending);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("does not get stuck loading when the identity fetch fails", async () => {
    // A failed `me()` must not leave an eternal skeleton: `isPending` is false
    // once the query errors, and the data queries stay disabled.
    const { result } = renderSummary(freshClient(), () =>
      Promise.reject(new Error("identity failed")),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
