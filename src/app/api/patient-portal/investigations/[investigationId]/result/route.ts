import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Confirms an uploaded result file (by object key) on an investigation. Proxies
 * to `POST /v1/patient-portal/investigations/:id/result`.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ investigationId: string }> },
) {
  const { investigationId } = await params;
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/investigations/${investigationId}/result`,
  );
}
