import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/** Marks one notification read → PATCH …/notifications/:id/read. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/notifications/${id}/read`,
  );
}
