import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Patient-scoped active-journey proxy. Forwards the optional `patient_id` query
 * to `GET /v1/patient-portal/journey` behind the shared patient guard (token
 * injection + refresh-on-expiry + 401 handling). Backs the home dashboard hero
 * + stepper.
 */
export async function GET(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/journey${request.nextUrl.search}`,
  );
}
