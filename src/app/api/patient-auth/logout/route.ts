import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PATIENT_AUTH_REFRESH_TOKEN_COOKIE } from "@/features/auth/lib/auth.constants";
import { backendFetch } from "@/infrastructure/auth-transport/backend";
import { clearPatientAuthCookies } from "@/infrastructure/auth-transport/patient-auth";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(PATIENT_AUTH_REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    // Best-effort server-side revocation; the cookies are cleared regardless.
    await backendFetch("/patient-auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => null);
  }

  const response = NextResponse.json({ data: { authenticated: false }, meta: {} });
  clearPatientAuthCookies(response);
  return response;
}
