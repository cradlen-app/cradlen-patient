import { ApiError } from "@/infrastructure/http/api";

export type SubscriptionLimitResource = "branches" | "organizations" | string;

export type SubscriptionLimitInfo = {
  resource: SubscriptionLimitResource;
  limit: number;
  current: number;
};

export function getSubscriptionLimit(error: unknown): SubscriptionLimitInfo | null {
  if (!(error instanceof ApiError) || error.status !== 403) return null;
  // The backend's GlobalExceptionFilter wraps every error body as
  // `{ error: { code, details, ... } }`, but some responses arrive flat. Read
  // top-level first, then fall back to the nested `error` object.
  const body = error.body as
    | {
        code?: string;
        details?: SubscriptionLimitInfo;
        error?: { code?: string; details?: SubscriptionLimitInfo };
      }
    | null
    | undefined;
  const code = body?.code ?? body?.error?.code;
  const details = body?.details ?? body?.error?.details;
  if (code !== "SUBSCRIPTION_LIMIT_REACHED" || !details) return null;
  return details;
}

export type PlanLimitOverage = {
  resource: "staff" | "branches";
  limit: number;
  current: number;
  excess: number;
};

export type SuggestedAddOn = {
  code: string;
  quantity: number;
  resource: "branches" | "staff";
};

export type PlanChangeOverLimit = {
  over: PlanLimitOverage[];
  /**
   * The add-on set (branch bundles + extra seats) the FE can buy together with
   * the plan to cover the whole overage in one combined payment.
   */
  suggested_add_ons?: SuggestedAddOn[];
};

/**
 * Parses a blocked plan purchase: the backend returns 403
 * `SUBSCRIPTION_LIMIT_REACHED` with `details.reason = 'PLAN_CHANGE_OVER_LIMIT'`,
 * the per-resource overage, and a suggested seat add-on. Returns null for any
 * other error (callers fall back to a toast).
 */
export function getPlanChangeOverLimit(error: unknown): PlanChangeOverLimit | null {
  if (!(error instanceof ApiError) || error.status !== 403) return null;
  type Details = {
    reason?: string;
    over?: PlanLimitOverage[];
    suggested_add_ons?: SuggestedAddOn[];
  };
  const body = error.body as
    | { code?: string; details?: Details; error?: { code?: string; details?: Details } }
    | null
    | undefined;
  const code = body?.code ?? body?.error?.code;
  const details = body?.details ?? body?.error?.details;
  if (
    code !== "SUBSCRIPTION_LIMIT_REACHED" ||
    details?.reason !== "PLAN_CHANGE_OVER_LIMIT" ||
    !Array.isArray(details.over)
  ) {
    return null;
  }
  return { over: details.over, suggested_add_ons: details.suggested_add_ons };
}

/**
 * True when a write was blocked because the org's subscription has lapsed. The
 * backend `SubscriptionGuard` returns 403 with `error.code` SUBSCRIPTION_EXPIRED.
 * The error body is shaped `{ error: { code, message } }` (GlobalExceptionFilter).
 */
export function isSubscriptionExpired(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 403) return false;
  const body = error.body as
    | { code?: string; error?: { code?: string } }
    | null
    | undefined;
  return (
    body?.code === "SUBSCRIPTION_EXPIRED" ||
    body?.error?.code === "SUBSCRIPTION_EXPIRED"
  );
}
