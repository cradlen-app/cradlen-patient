/**
 * Re-export of the canonical patient security-question keys. The source of
 * truth now lives in `@/common/constants/security-questions` so both
 * `features/auth` and `core/patient-portal` can share it across layers. This
 * file is kept as a stable import path for existing auth-flow callers.
 */
export {
  SECURITY_QUESTION_KEYS,
  type SecurityQuestionKey,
} from "@/common/constants/security-questions";
