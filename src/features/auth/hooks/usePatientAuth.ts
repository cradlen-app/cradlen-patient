import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/infrastructure/http/api";
import { queryClient } from "@/infrastructure/query/queryClient";
import { patientPortalQueryKeys } from "@/core/patient-portal/api";
import type {
  PatientAuthenticatedResponse,
  PatientForgotPasswordCompleteRequest,
  PatientForgotPasswordStartRequest,
  PatientForgotPasswordStartResponse,
  PatientLoginRequest,
  PatientMeResponse,
  PatientSignupCompleteRequest,
  PatientSignupStartRequest,
  PatientSignupStartResponse,
} from "../types/patient-auth.types";

export function usePatientLogin() {
  return useMutation({
    mutationFn: (data: PatientLoginRequest) =>
      apiFetch<PatientAuthenticatedResponse>("/patient-auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function usePatientSignupStart() {
  return useMutation({
    mutationFn: (data: PatientSignupStartRequest) =>
      apiFetch<PatientSignupStartResponse>("/patient-auth/signup/start", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function usePatientSignupComplete() {
  return useMutation({
    mutationFn: (data: PatientSignupCompleteRequest) =>
      apiFetch<PatientAuthenticatedResponse>("/patient-auth/signup/complete", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function usePatientForgotPasswordStart() {
  return useMutation({
    mutationFn: (data: PatientForgotPasswordStartRequest) =>
      apiFetch<PatientForgotPasswordStartResponse>(
        "/api/patient-auth/forgot-password/start",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      ).then((r) => r.data),
  });
}

export function usePatientForgotPasswordComplete() {
  return useMutation({
    mutationFn: (data: PatientForgotPasswordCompleteRequest) =>
      apiFetch<PatientAuthenticatedResponse>(
        "/api/patient-auth/forgot-password/complete",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      ),
  });
}

export function usePatientMe(enabled = true) {
  return useQuery({
    queryKey: patientPortalQueryKeys.me(),
    // Hit the local route directly (not apiAuthFetch — that injects staff
    // context and redirects to the staff sign-in on 401).
    queryFn: () =>
      apiFetch<PatientMeResponse>("/api/patient-auth/me").then((r) => r.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function usePatientLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: () =>
      apiFetch<PatientAuthenticatedResponse>("/api/patient-auth/logout", {
        method: "POST",
      }),
    onSettled: () => {
      queryClient.clear();
      router.replace("/patient/signin");
    },
  });
}
