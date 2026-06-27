import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Sets or updates the patient account's security question. Proxies to
 * `POST /v1/patient-auth/security-question` behind the shared patient guard
 * (token injection + refresh-on-expiry). Backend replies 204 on success.
 */
export async function POST(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    "/patient-auth/security-question",
  );
}
