import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Issues a presigned R2 PUT URL for an investigation result file. Proxies to
 * `POST /v1/patient-portal/investigations/:id/result-upload-url`. The browser
 * uploads the bytes directly to R2 (not through this proxy).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ investigationId: string }> },
) {
  const { investigationId } = await params;
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/investigations/${investigationId}/result-upload-url`,
  );
}
