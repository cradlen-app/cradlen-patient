import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Patient-scoped OB/GYN history proxy. Forwards `patient_id` to
 * `GET /v1/patient-portal/obgyn-history` behind the shared patient guard (token
 * injection + refresh-on-expiry + 401 handling).
 */
export async function GET(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/obgyn-history${request.nextUrl.search}`,
  );
}
