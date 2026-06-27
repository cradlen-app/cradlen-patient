import { patientSignupCompleteResponse } from "@/infrastructure/auth-transport/patient-auth";

export function POST(request: Request) {
  return patientSignupCompleteResponse(request);
}
