import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/**
 * Removes a patient-uploaded result file. Proxies to
 * `DELETE /v1/patient-portal/investigations/:id/result/:attachmentId`.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ investigationId: string; attachmentId: string }> },
) {
  const { investigationId, attachmentId } = await params;
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/investigations/${investigationId}/result/${attachmentId}`,
  );
}
