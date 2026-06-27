import { useTranslations } from "next-intl";
import z from "zod";
import { SECURITY_QUESTION_KEYS } from "./security-questions";

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
  // Must not be in the future.
  return date.getTime() <= Date.now();
}

export const createPatientSignUpSchema = (
  t: ReturnType<typeof useTranslations<"auth.patientSignUp">>,
) =>
  z
    .object({
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
      securityQuestion: z
        .string()
        .refine(
          (v) => (SECURITY_QUESTION_KEYS as readonly string[]).includes(v),
          t("errors.securityQuestionRequired"),
        ),
      securityAnswer: z
        .string()
        .min(2, t("errors.securityAnswerRequired")),
      password: z
        .string()
        .min(8, t("errors.passwordMinLength"))
        .regex(/[a-z]/, t("errors.passwordLowercase"))
        .regex(/[A-Z]/, t("errors.passwordUppercase"))
        .regex(/[0-9]/, t("errors.passwordNumber"))
        .regex(/[^A-Za-z0-9]/, t("errors.passwordSymbol")),
      confirmPassword: z
        .string()
        .min(1, t("errors.confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("errors.passwordMismatch"),
      path: ["confirmPassword"],
    });

export type PatientSignUpFormData = z.infer<
  ReturnType<typeof createPatientSignUpSchema>
>;
