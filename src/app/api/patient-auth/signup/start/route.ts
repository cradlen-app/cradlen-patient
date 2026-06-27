import { patientSignupStartResponse } from "@/infrastructure/auth-transport/patient-auth";

export function POST(request: Request) {
  return patientSignupStartResponse(request);
}
