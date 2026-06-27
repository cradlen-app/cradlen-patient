import { NextResponse } from "next/server";
import { backendFetch, readBackendJson } from "@/infrastructure/auth-transport/backend";
import {
  clearPatientAuthCookies,
  getValidPatientAccessToken,
  setPatientAuthCookies,
} from "@/infrastructure/auth-transport/patient-auth";

export async function GET() {
  const { accessToken, refreshedTokens } = await getValidPatientAccessToken();

  if (!accessToken) {
    const response = NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
    clearPatientAuthCookies(response);
    return response;
  }

  const backendResponse = await backendFetch("/patient-auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await readBackendJson(backendResponse);

  const response = NextResponse.json(body, { status: backendResponse.status });

  if (refreshedTokens) {
    setPatientAuthCookies(response, refreshedTokens);
  }
  if (backendResponse.status === 401) {
    clearPatientAuthCookies(response);
  }

  return response;
}
