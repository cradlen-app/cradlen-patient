import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Patient national-ID change proxy. Forwards the optional `patient_id` query to
 * `PATCH /v1/patient-portal/profile/national-id` behind the shared patient
 * guard. The backend re-verifies the current password and enforces uniqueness.
 */
export async function PATCH(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/profile/national-id${request.nextUrl.search}`,
  );
}
