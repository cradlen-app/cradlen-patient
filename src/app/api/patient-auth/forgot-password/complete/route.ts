import { patientForgotPasswordCompleteResponse } from "@/infrastructure/auth-transport/patient-auth";

export function POST(request: Request) {
  return patientForgotPasswordCompleteResponse(request);
}
