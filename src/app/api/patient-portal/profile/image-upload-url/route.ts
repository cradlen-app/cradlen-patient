import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Issues a presigned R2 PUT URL for the patient's avatar. Proxies to
 * `POST /v1/patient-portal/profile/image-upload-url`. The browser uploads the
 * bytes directly to R2 (not through this proxy).
 */
export async function POST(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/profile/image-upload-url${request.nextUrl.search}`,
  );
}
