import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Confirms an uploaded avatar (`POST`) or removes the current one (`DELETE`),
 * proxying to `/v1/patient-portal/profile/image` behind the shared patient guard.
 */
export async function POST(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/profile/image${request.nextUrl.search}`,
  );
}

export async function DELETE(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/profile/image${request.nextUrl.search}`,
  );
}
