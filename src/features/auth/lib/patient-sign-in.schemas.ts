import { useTranslations } from "next-intl";
import z from "zod";

export const createPatientSignInSchema = (
  t: ReturnType<typeof useTranslations<"auth.patientSignIn">>,
) =>
  z.object({
    nationalId: z
      .string()
      .min(1, t("errors.nationalIdRequired"))
      .regex(/^\d{14}$/, t("errors.nationalIdInvalid")),
    password: z
      .string()
      .min(1, t("errors.passwordRequired"))
      .min(8, t("errors.passwordMinLength"))
      .regex(/[a-z]/, t("errors.passwordLowercase"))
      .regex(/[A-Z]/, t("errors.passwordUppercase"))
      .regex(/[0-9]/, t("errors.passwordNumber"))
      .regex(/[^A-Za-z0-9]/, t("errors.passwordSymbol")),
  });

export type PatientSignInFormData = z.infer<
  ReturnType<typeof createPatientSignInSchema>
>;
