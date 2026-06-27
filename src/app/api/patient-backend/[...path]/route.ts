import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

type Context = {
  params: Promise<{ path?: string[] }>;
};

async function handler(request: NextRequest, context: Context) {
  const { path = [] } = await context.params;
  const search = request.nextUrl.search;
  return proxyAuthenticatedPatientRequest(request, `/${path.join("/")}${search}`);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
