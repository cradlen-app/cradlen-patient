import type { UserProfile } from "@/common/types/user.types";
import type { OnboardingRequiredResponse } from "@/lib/auth/redirect";

export type SignInRequest = { email: string; password: string };

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export type AuthTokensResponse = { data: AuthTokens; meta: Record<string, unknown> };

export type AuthenticatedSessionResponse = {
  data: { authenticated: true };
  meta: Record<string, unknown>;
};

export type LoginProfilesResponse = {
  data: { profiles: UserProfile[] } | OnboardingRequiredResponse;
  meta: Record<string, unknown>;
};

export type SelectProfileRequest = {
  branch_id?: string | null;
  profile_id: string;
  organization_id?: string | null;
};

export type SelectProfileResponse = {
  data: {
    organization_id: string | null;
    authenticated: true;
    branch_id?: string | null;
    profile_id: string | null;
  };
  meta: Record<string, unknown>;
};
