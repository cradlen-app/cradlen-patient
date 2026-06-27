import { ApiError } from "@/infrastructure/http/api";

export function getErrorCode(error: unknown): string | undefined {
  const body = (error instanceof ApiError ? error.body : null) as
    | { error?: { code?: string } }
    | null
    | undefined;
  return body?.error?.code;
}
