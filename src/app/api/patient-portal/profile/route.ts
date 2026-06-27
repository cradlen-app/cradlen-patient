import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Patient profile read/update proxy. Forwards the optional `patient_id` query to
 * `GET`/`PATCH /v1/patient-portal/profile` behind the shared patient guard.
 */
export async function GET(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/profile${request.nextUrl.search}`,
  );
}

export async function PATCH(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/profile${request.nextUrl.search}`,
  );
}
