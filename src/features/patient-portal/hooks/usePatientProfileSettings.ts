"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  changePassword,
  fetchPatientProfile,
  fetchSecurityQuestion,
  removeProfileImage,
  setSecurityQuestion,
  updatePatientProfile,
  uploadProfileImage,
} from "../data/patient-portal.api";
import { patientPortalQueryKeys } from "../queryKeys";
import type { UpdatePatientProfileInput } from "../types/patient-portal.types";
import { useActivePatientId } from "./usePatientProfiles";

/**
 * Read/write hooks for the active patient's profile & account settings. Every
 * call is scoped to the active profile id (self or a dependent) so a guardian
 * edits whoever is in view. Mutations invalidate both the profile details and
 * the profile list (so the switcher name stays in sync).
 */
export function usePatientProfileDetails() {
  const patientId = useActivePatientId();
  return useQuery({
    queryKey: patientPortalQueryKeys.profileDetails(patientId || "none"),
    queryFn: () => fetchPatientProfile(patientId || undefined),
    enabled: Boolean(patientId),
  });
}

function useInvalidateProfile() {
  const queryClient = useQueryClient();
  const patientId = useActivePatientId();
  return () => {
    queryClient.invalidateQueries({
      queryKey: patientPortalQueryKeys.profileDetails(patientId || "none"),
    });
    queryClient.invalidateQueries({
      queryKey: patientPortalQueryKeys.profiles(),
    });
  };
}

export function useUpdatePatientProfile() {
  const patientId = useActivePatientId();
  const invalidate = useInvalidateProfile();
  return useMutation({
    mutationFn: (input: UpdatePatientProfileInput) =>
      updatePatientProfile({ patientId: patientId || undefined, input }),
    onSuccess: invalidate,
  });
}

export function useUploadProfileImage() {
  const patientId = useActivePatientId();
  const invalidate = useInvalidateProfile();
  return useMutation({
    mutationFn: (file: File) =>
      uploadProfileImage({ patientId: patientId || undefined, file }),
    onSuccess: invalidate,
  });
}

export function useRemoveProfileImage() {
  const patientId = useActivePatientId();
  const invalidate = useInvalidateProfile();
  return useMutation({
    mutationFn: () => removeProfileImage(patientId || undefined),
    onSuccess: invalidate,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      changePassword(input),
  });
}

/** The account's current security-question key (null when none is set yet). */
export function usePatientSecurityQuestion() {
  return useQuery({
    queryKey: patientPortalQueryKeys.securityQuestion(),
    queryFn: fetchSecurityQuestion,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Sets/updates the account security question. On success invalidates the patient
 * identity query so the profile's "current question" display refreshes.
 */
export function useSetSecurityQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      securityQuestion: string;
      securityAnswer: string;
      currentPassword: string;
    }) => setSecurityQuestion(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: patientPortalQueryKeys.me(),
      });
    },
  });
}
