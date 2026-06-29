"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  removeInvestigationAttachment,
  uploadInvestigationResult,
} from "../data/patient-portal.api";
import { patientPortalQueryKeys } from "../queryKeys";

/**
 * Uploads result files for an investigation via the presigned R2 flow. On
 * success it invalidates every investigations query — across patients and
 * status/type filters — so the new result files appear immediately.
 */
export function useUploadInvestigationResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { investigationId: string; files: File[] }) =>
      uploadInvestigationResult(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...patientPortalQueryKeys.all(), "investigations"],
      });
    },
  });
}

/** Removes a patient-uploaded result file, then refreshes the investigations. */
export function useRemoveInvestigationAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { investigationId: string; attachmentId: string }) =>
      removeInvestigationAttachment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...patientPortalQueryKeys.all(), "investigations"],
      });
    },
  });
}
