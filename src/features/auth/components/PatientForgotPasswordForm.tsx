"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/common/utils/utils";
import { ApiError } from "@/infrastructure/http/api";
import {
  usePatientForgotPasswordComplete,
  usePatientForgotPasswordStart,
} from "../hooks/usePatientAuth";
import {
  createForgotPasswordCompleteSchema,
  createForgotPasswordStartSchema,
  type ForgotPasswordCompleteFormData,
  type ForgotPasswordStartFormData,
} from "../lib/patient-forgot-password.schemas";
import { PhoneInput } from "./PhoneInput";
import { PasswordInput } from "./PasswordInput";

const inputClass = cn(
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
);

const errorInputClass = (hasError: boolean) =>
  hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : "";

const fieldError = (msg?: string) =>
  msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null;

export function PatientForgotPasswordForm() {
  const t = useTranslations("auth.patientForgotPassword");
  const tq = useTranslations("auth.securityQuestions");
  const router = useRouter();
  const [stepError, setStepError] = useState<string | null>(null);
  // The security-question key returned by step 1; null until verified.
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);

  const forgotStart = usePatientForgotPasswordStart();
  const forgotComplete = usePatientForgotPasswordComplete();

  const startSchema = useMemo(() => createForgotPasswordStartSchema(t), [t]);
  const completeSchema = useMemo(
    () => createForgotPasswordCompleteSchema(t),
    [t],
  );

  const startForm = useForm<ForgotPasswordStartFormData>({
    resolver: zodResolver(startSchema),
    mode: "onChange",
    defaultValues: { nationalId: "", phoneNumber: "", dateOfBirth: "" },
  });

  const completeForm = useForm<ForgotPasswordCompleteFormData>({
    resolver: zodResolver(completeSchema),
    mode: "onChange",
    defaultValues: { securityAnswer: "", password: "", confirmPassword: "" },
  });

  const onStart = startForm.handleSubmit(async (data) => {
    setStepError(null);
    try {
      const res = await forgotStart.mutateAsync({
        national_id: data.nationalId,
        date_of_birth: data.dateOfBirth,
        phone_number: data.phoneNumber,
      });
      setSecurityQuestion(res.security_question);
    } catch (error) {
      setStepError(
        error instanceof ApiError
          ? (error.messages[0] ?? t("errors.identityFailed"))
          : t("errors.serverError"),
      );
    }
  });

  const onComplete = completeForm.handleSubmit(async (data) => {
    setStepError(null);
    try {
      await forgotComplete.mutateAsync({
        security_answer: data.securityAnswer,
        password: data.password,
        confirm_password: data.confirmPassword,
      });
      toast.success(t("successMessage"));
      router.replace("/patient/signin");
    } catch (error) {
      setStepError(
        error instanceof ApiError
          ? error.status === 401
            ? t("errors.invalidAnswer")
            : (error.messages[0] ?? t("errors.serverError"))
          : t("errors.serverError"),
      );
    }
  });

  const startErrors = startForm.formState.errors;
  const completeErrors = completeForm.formState.errors;

  // Step 2: answer the security question + set a new password.
  if (securityQuestion) {
    return (
      <form onSubmit={onComplete} className="w-full flex flex-col gap-5">
        {/* The verified security question (read-only) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-brand-black">
            {t("securityQuestionLabel")}
          </span>
          <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-brand-black">
            {tq(securityQuestion)}
          </p>
        </div>

        {/* Security answer */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="securityAnswer" className="text-sm text-brand-black">
            {t("securityAnswerLabel")}
          </label>
          <input
            id="securityAnswer"
            type="text"
            autoComplete="off"
            placeholder={t("securityAnswerPlaceholder")}
            {...completeForm.register("securityAnswer")}
            className={cn(
              inputClass,
              errorInputClass(!!completeErrors.securityAnswer),
            )}
          />
          {fieldError(completeErrors.securityAnswer?.message)}
        </div>

        {/* New password */}
        <PasswordInput
          id="password"
          label={t("passwordLabel")}
          placeholder={t("passwordPlaceholder")}
          registration={completeForm.register("password")}
          error={completeErrors.password?.message}
          inputClassName={inputClass}
          errorInputClassName={errorInputClass(true)}
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
        />

        {/* Confirm password */}
        <PasswordInput
          id="confirmPassword"
          label={t("confirmPasswordLabel")}
          placeholder={t("confirmPasswordPlaceholder")}
          registration={completeForm.register("confirmPassword")}
          error={completeErrors.confirmPassword?.message}
          inputClassName={inputClass}
          errorInputClassName={errorInputClass(true)}
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
        />

        {stepError && (
          <p className="text-sm text-red-500 text-center">{stepError}</p>
        )}

        <button
          type="submit"
          disabled={completeForm.formState.isSubmitting || forgotComplete.isPending}
          className="mt-1 w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99] disabled:opacity-50"
        >
          {t("resetButton")}
        </button>
      </form>
    );
  }

  // Step 1: prove identity.
  return (
    <form onSubmit={onStart} className="w-full flex flex-col gap-5">
      {/* National ID */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nationalId" className="text-sm text-brand-black">
          {t("nationalIdLabel")}
        </label>
        <input
          id="nationalId"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={t("nationalIdPlaceholder")}
          {...startForm.register("nationalId")}
          className={cn(inputClass, errorInputClass(!!startErrors.nationalId))}
        />
        {fieldError(startErrors.nationalId?.message)}
      </div>

      {/* Phone */}
      <PhoneInput
        id="phoneNumber"
        label={t("phoneLabel")}
        placeholder={t("phonePlaceholder")}
        registration={startForm.register("phoneNumber")}
        error={startErrors.phoneNumber?.message}
        inputClassName={inputClass}
        errorInputClassName={errorInputClass(true)}
      />

      {/* Date of birth */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dateOfBirth" className="text-sm text-brand-black">
          {t("dateOfBirthLabel")}
        </label>
        <input
          id="dateOfBirth"
          type="date"
          autoComplete="bday"
          {...startForm.register("dateOfBirth")}
          className={cn(inputClass, errorInputClass(!!startErrors.dateOfBirth))}
        />
        {fieldError(startErrors.dateOfBirth?.message)}
      </div>

      {stepError && (
        <p className="text-sm text-red-500 text-center">{stepError}</p>
      )}

      <button
        type="submit"
        disabled={startForm.formState.isSubmitting || forgotStart.isPending}
        className="mt-1 w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99] disabled:opacity-50"
      >
        {t("continueButton")}
      </button>
    </form>
  );
}
