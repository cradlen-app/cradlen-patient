import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Patient-scoped journey-timeline proxy. Forwards `patient_id` / `page` / `limit`
 * to `GET /v1/patient-portal/visits/journeys/timeline` behind the shared patient
 * guard (token injection + refresh-on-expiry + 401 handling). Returns the
 * Journey → Episode → Visit tree backing the Visits-page timeline.
 */
export async function GET(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/visits/journeys/timeline${request.nextUrl.search}`,
  );
}
