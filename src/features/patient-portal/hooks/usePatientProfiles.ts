"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchProfiles } from "../data/patient-portal.api";
import { patientPortalQueryKeys } from "../queryKeys";
import { usePatientProfileStore } from "../store/patientProfileStore";

/** All profiles the account can view (self + dependents). */
export function usePatientProfiles() {
  return useQuery({
    queryKey: patientPortalQueryKeys.profiles(),
    queryFn: fetchProfiles,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * The currently active patient profile id (self or a dependent). The persisted
 * value is reconciled against the real profiles: if it isn't one of them (a
 * fresh session, or a stale id from the old mock phase) it falls back to the
 * account holder, then to the first accessible profile.
 */
export function useActivePatientId(): string {
  const stored = usePatientProfileStore((s) => s.activeProfileId);
  const { data: profiles } = usePatientProfiles();
  if (!profiles || profiles.length === 0) return stored;
  if (profiles.some((p) => p.id === stored)) return stored;
  return profiles.find((p) => p.kind === "self")?.id ?? profiles[0].id;
}

/** The resolved active profile object, or undefined while loading. */
export function useActiveProfile() {
  const activeId = useActivePatientId();
  const { data: profiles } = usePatientProfiles();
  return profiles?.find((p) => p.id === activeId);
}
