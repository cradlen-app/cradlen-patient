import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/** Remove a Web Push subscription → POST /v1/patient-portal/push/unsubscribe. */
export async function POST(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    "/patient-portal/push/unsubscribe",
  );
}
