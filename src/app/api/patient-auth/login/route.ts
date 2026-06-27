import { patientLoginResponse } from "@/infrastructure/auth-transport/patient-auth";

export function POST(request: Request) {
  return patientLoginResponse(request);
}
