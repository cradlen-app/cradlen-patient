import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Patient-scoped investigations proxy. Forwards `patient_id` / `page` / `limit`
 * (and optional `status` / `type`) to `GET /v1/patient-portal/investigations`
 * behind the shared patient guard (token injection + refresh-on-expiry + 401
 * handling).
 */
export async function GET(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/investigations${request.nextUrl.search}`,
  );
}
