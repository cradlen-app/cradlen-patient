import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/** Marks all of the patient's notifications read → PATCH …/notifications/read-all. */
export async function PATCH(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    `/patient-portal/notifications/read-all`,
  );
}
