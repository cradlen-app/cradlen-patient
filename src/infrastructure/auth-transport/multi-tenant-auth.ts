import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_SELECTION_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "@/features/auth/lib/auth.constants";
import {
  backendFetch,
  clearSignupTokenCookie,
  extractTokens,
  readBackendJson,
  sessionResponse,
  setSelectionTokenCookie,
} from "./backend";
import {
  getSignupTokenFromRequest,
  persistSignupTokenFromBody,
} from "./signup-session";

function getObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function extractSelectionToken(body: unknown) {
  const root = getObject(body);
  const data = getObject(root?.data);
  const source = data ?? root;
  const token = source?.selection_token;
  return typeof token === "string" ? token : null;
}

export function sanitizeProfileSelection(body: unknown) {
  const root = getObject(body);
  const data = getObject(root?.data);
  const source = data ?? root;
  const meta = getObject(root?.meta) ?? {};
  const profiles = source?.profiles;
  // Pass through the ONBOARDING_REQUIRED discriminator so the client can tell a
  // not-yet-onboarded login apart from a profile selection. The signup_token is
  // deliberately NOT echoed here — it is set as an HttpOnly cookie by
  // persistSignupTokenFromBody and must stay out of the JS-readable response.
  const type = source?.type;
  const step = source?.step;

  return {
    data: {
      profiles: Array.isArray(profiles) ? profiles : [],
      ...(typeof type === "string" ? { type } : {}),
      ...(typeof step === "string" ? { step } : {}),
    },
    meta,
  };
}

export async function profileSelectionResponse(
  backendPath: string,
  request: Request,
) {
  const requestBody = await request.arrayBuffer();
  const response = await backendFetch(backendPath, {
    method: "POST",
    body: requestBody,
  });
  const body = await readBackendJson(response);

  if (!response.ok) {
    return NextResponse.json(body ?? { message: response.statusText }, {
      status: response.status,
    });
  }

  const selectionToken = extractSelectionToken(body);
  const frontendResponse = NextResponse.json(sanitizeProfileSelection(body), {
    status: response.status,
  });

  if (selectionToken) {
    setSelectionTokenCookie(frontendResponse, selectionToken);
  }
  persistSignupTokenFromBody(frontendResponse, body);

  return frontendResponse;
}

export async function signupCompleteResponse(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const signupToken = await getSignupTokenFromRequest(body);

  if (!signupToken) {
    return NextResponse.json(
      { message: "Session expired. Please start registration again." },
      { status: 401 },
    );
  }

  const bodyWithoutToken = { ...body };
  delete bodyWithoutToken.signup_token;
  const payload = {
    ...bodyWithoutToken,
    signup_token: signupToken,
  };
  const response = await backendFetch("/auth/signup/complete", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const responseBody = await readBackendJson(response);

  if (!response.ok) {
    return NextResponse.json(responseBody ?? { message: response.statusText }, {
      status: response.status,
    });
  }

  const selectionToken = extractSelectionToken(responseBody);
  const frontendResponse = NextResponse.json(
    sanitizeProfileSelection(responseBody),
    { status: response.status },
  );

  if (selectionToken) {
    setSelectionTokenCookie(frontendResponse, selectionToken);
  }
  clearSignupTokenCookie(frontendResponse);

  return frontendResponse;
}

export async function switchBranchSession(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const previousRefreshToken = cookieStore.get(AUTH_REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json()) as { branch_id?: string };
  const response = await backendFetch("/auth/branches/switch", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ branch_id: body.branch_id }),
  });
  const responseBody = await readBackendJson(response);

  if (!response.ok) {
    return NextResponse.json(responseBody ?? { message: response.statusText }, {
      status: response.status,
    });
  }

  const tokens = extractTokens(responseBody);

  // /auth/branches/switch issues a fresh token pair but does NOT revoke the old refresh
  // token server-side. Revoke it explicitly so a stolen old refresh can't keep refreshing.
  if (tokens && previousRefreshToken && previousRefreshToken !== tokens.refresh_token) {
    backendFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: previousRefreshToken }),
    }).catch(() => null);
  }

  return sessionResponse(
    { data: { branch_id: body.branch_id ?? null }, meta: {} },
    tokens,
    response.status,
  );
}

export async function selectProfileSession(request: Request) {
  const cookieStore = await cookies();
  const selectionToken = cookieStore.get(AUTH_SELECTION_TOKEN_COOKIE)?.value;
  const body = (await request.json()) as Record<string, unknown>;
  const { organization_id: bodyOrganizationId, ...bodyWithoutOrganization } = body;
  const payload = {
    ...bodyWithoutOrganization,
    ...(selectionToken ? { selection_token: selectionToken } : {}),
  };

  // /auth/profiles/select is a public endpoint authenticated by selection_token;
  // it must not be called with a stale access token from a prior session.
  const response = await backendFetch("/auth/profiles/select", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const responseBody = await readBackendJson(response);

  if (!response.ok) {
    return NextResponse.json(responseBody ?? { message: response.statusText }, {
      status: response.status,
    });
  }

  const tokens = extractTokens(responseBody);
  // Backend's success body only carries the token pair — echo the IDs the client
  // sent (or that were paired with the picked profile) back to the caller.
  // Selection token cookie is intentionally retained: it has a 30-min TTL on the
  // backend and is reused for org/profile switching without re-login. It's cleared
  // on /auth/logout via clearAuthCookies.
  return sessionResponse(
    {
      data: {
        authenticated: true,
        organization_id: bodyOrganizationId ?? null,
        branch_id: body.branch_id ?? null,
        profile_id: body.profile_id ?? null,
      },
      meta: getObject(getObject(responseBody)?.meta) ?? {},
    },
    tokens,
    response.status,
  );
}
