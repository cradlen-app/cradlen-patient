import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Changes the patient account password. Proxies to
 * `POST /v1/patient-auth/change-password` behind the shared patient guard
 * (token injection + refresh-on-expiry). Backend replies 204 on success.
 */
export async function POST(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    "/patient-auth/change-password",
  );
}
