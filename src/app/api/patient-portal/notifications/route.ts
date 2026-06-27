import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/** Patient-scoped notifications list proxy → GET /v1/patient-portal/notifications. */
export async function GET(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/notifications${request.nextUrl.search}`,
  );
}
