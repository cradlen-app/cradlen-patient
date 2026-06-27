"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadDocument } from "../data/patient-portal.api";
import { patientPortalQueryKeys } from "../queryKeys";
import type { UploadDocumentInput } from "../types/patient-portal.types";

/**
 * Uploads a patient document to a clinic/doctor. On success it invalidates the
 * documents and lab-orders queries for that patient so the new "Pending review"
 * entry and the flipped order status appear immediately.
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadDocumentInput) => uploadDocument(input),
    onSuccess: (_doc, input) => {
      queryClient.invalidateQueries({
        queryKey: patientPortalQueryKeys.documents(input.forPatientId),
      });
      queryClient.invalidateQueries({
        queryKey: patientPortalQueryKeys.labOrders(input.forPatientId),
      });
    },
  });
}
