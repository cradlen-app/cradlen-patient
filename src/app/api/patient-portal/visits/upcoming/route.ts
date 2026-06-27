import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Patient-scoped upcoming-follow-ups proxy. Forwards `patient_id` / `page` /
 * `limit` to `GET /v1/patient-portal/visits/upcoming` behind the shared patient
 * guard (token injection + refresh-on-expiry + 401 handling).
 */
export async function GET(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/visits/upcoming${request.nextUrl.search}`,
  );
}
