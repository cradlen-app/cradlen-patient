import { patientForgotPasswordStartResponse } from "@/infrastructure/auth-transport/patient-auth";

export function POST(request: Request) {
  return patientForgotPasswordStartResponse(request);
}
