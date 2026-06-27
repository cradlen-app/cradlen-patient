import { useTranslations } from "next-intl";
import z from "zod";

const PHONE_NUMBER_REGEXES = [
  /^(?:\+20|0020|0)?1[0125]\d{8}$/,
  /^\+[1-9]\d{7,14}$/,
];

function isValidPhone(value: string) {
  const normalized = value.replace(/[\s().-]/g, "");
  return PHONE_NUMBER_REGEXES.some((regex) => regex.test(normalized));
}

function isValidPastDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now();
}

/** Step 1: identity verification (mirrors patient sign-up step 1). */
export const createForgotPasswordStartSchema = (
  t: ReturnType<typeof useTranslations<"auth.patientForgotPassword">>,
) =>
  z.object({
    nationalId: z
      .string()
      .min(1, t("errors.nationalIdRequired"))
      .regex(/^\d{14}$/, t("errors.nationalIdInvalid")),
    phoneNumber: z
      .string()
      .min(1, t("errors.phoneRequired"))
      .refine(isValidPhone, t("errors.invalidPhone")),
    dateOfBirth: z
      .string()
      .min(1, t("errors.dateOfBirthRequired"))
      .refine(isValidPastDate, t("errors.dateOfBirthInvalid")),
  });

export type ForgotPasswordStartFormData = z.infer<
  ReturnType<typeof createForgotPasswordStartSchema>
>;

/** Step 2: answer the security question and choose a new password. */
export const createForgotPasswordCompleteSchema = (
  t: ReturnType<typeof useTranslations<"auth.patientForgotPassword">>,
) =>
  z
    .object({
      securityAnswer: z.string().min(2, t("errors.securityAnswerRequired")),
      password: z
        .string()
        .min(8, t("errors.passwordMinLength"))
        .regex(/[a-z]/, t("errors.passwordLowercase"))
        .regex(/[A-Z]/, t("errors.passwordUppercase"))
        .regex(/[0-9]/, t("errors.passwordNumber"))
        .regex(/[^A-Za-z0-9]/, t("errors.passwordSymbol")),
      confirmPassword: z.string().min(1, t("errors.confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("errors.passwordMismatch"),
      path: ["confirmPassword"],
    });

export type ForgotPasswordCompleteFormData = z.infer<
  ReturnType<typeof createForgotPasswordCompleteSchema>
>;
