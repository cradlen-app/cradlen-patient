import type { UserProfile } from "@/common/types/user.types";

export type OnboardingRequiredStep = "VERIFY_OTP" | "COMPLETE_ONBOARDING";

export type OnboardingRequiredResponse = {
  type: "ONBOARDING_REQUIRED";
  step: OnboardingRequiredStep;
};

export type AuthRedirectPath =
  | "/sign-up"
  | "/sign-up/complete"
  | "/select-profile"
  | "/sign-in";

// COMPLETE_ONBOARDING login responses now carry a fresh signup_token (set as an
// HttpOnly cookie by the login route), so the user can resume onboarding directly
// at step 3. VERIFY_OTP still restarts at /sign-up, where /auth/signup/start
// re-sends the OTP and re-issues the token for the still-PENDING account.
const ONBOARDING_REDIRECTS: Record<OnboardingRequiredStep, AuthRedirectPath> = {
  VERIFY_OTP: "/sign-up",
  COMPLETE_ONBOARDING: "/sign-up/complete",
};

function getObject(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function getResponseSource(response: unknown) {
  const root = getObject(response);
  const data = getObject(root?.data);

  return data ?? root;
}

function getOnboardingStep(value: unknown): OnboardingRequiredStep | null {
  return value === "VERIFY_OTP" || value === "COMPLETE_ONBOARDING"
    ? value
    : null;
}

export function getProfilesFromAuthResponse(response: unknown): UserProfile[] {
  const source = getResponseSource(response);
  const profiles = source?.profiles;

  return Array.isArray(profiles) ? (profiles as UserProfile[]) : [];
}

export function isOnboardingRedirectPath(
  path: string | null,
): path is "/sign-up" {
  return path === "/sign-up";
}

export function resolveAuthRedirect(
  response: unknown,
  email?: string,
): AuthRedirectPath | null {
  void email;

  const source = getResponseSource(response);

  if (!source) return null;

  if (source.type === "ONBOARDING_REQUIRED") {
    const step = getOnboardingStep(source.step);

    return step ? ONBOARDING_REDIRECTS[step] : "/sign-in";
  }

  if (getProfilesFromAuthResponse(response).length > 0) {
    return "/select-profile";
  }

  return null;
}
