import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/** Register a Web Push subscription → POST /v1/patient-portal/push/subscribe. */
export async function POST(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    "/patient-portal/push/subscribe",
  );
}
