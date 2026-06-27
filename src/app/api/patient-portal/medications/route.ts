import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Patient-scoped medications proxy. Forwards the optional `patient_id` query to
 * `GET /v1/patient-portal/medications` behind the shared patient guard (token
 * injection + refresh-on-expiry + 401 handling).
 */
export async function GET(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/medications${request.nextUrl.search}`,
  );
}
