"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/common/utils/utils";
import { ApiError } from "@/infrastructure/http/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePatientSignupComplete,
  usePatientSignupStart,
} from "../hooks/usePatientAuth";
import {
  createPatientSignUpSchema,
  type PatientSignUpFormData,
} from "../lib/patient-sign-up.schemas";
import { SECURITY_QUESTION_KEYS } from "../lib/security-questions";
import { PhoneInput } from "./PhoneInput";
import { PasswordInput } from "./PasswordInput";

const STEP_LABEL_KEYS = ["step1Label", "step2Label"] as const;

function StepIndicator({
  currentStep,
  labels,
}: {
  currentStep: 1 | 2;
  labels: string[];
}) {
  return (
    <div className="w-full">
      <div className="flex items-center">
        {labels.map((label, i) => {
          const stepNumber = i + 1;
          const isActive = currentStep >= stepNumber;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "size-7 rounded-full border-2 flex items-center justify-center text-sm font-semibold shrink-0 transition-colors",
                    isActive
                      ? "bg-brand-primary border-brand-primary text-white"
                      : "bg-white border-gray-300 text-gray-400",
                  )}
                >
                  {stepNumber}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium text-center whitespace-nowrap",
                    isActive ? "text-brand-black" : "text-gray-400",
                  )}
                >
                  {label}
                </span>
              </div>
              {i < labels.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-3 mb-6 transition-colors",
                    currentStep > stepNumber ? "bg-brand-primary" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PatientSignUpForm() {
  const t = useTranslations("auth.patientSignUp");
  const tq = useTranslations("auth.securityQuestions");
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const signupStart = usePatientSignupStart();
  const signupComplete = usePatientSignupComplete();
  const schema = useMemo(() => createPatientSignUpSchema(t), [t]);

  const form = useForm<PatientSignUpFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      nationalId: "",
      phoneNumber: "",
      dateOfBirth: "",
      securityQuestion: "",
      securityAnswer: "",
      password: "",
      confirmPassword: "",
    },
  });

  const inputClass = cn(
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
    "placeholder:text-gray-400 outline-none transition-colors",
    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
  );

  const errorInputClass = (hasError: boolean) =>
    hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : "";

  const fieldError = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null;

  const handleNext = async () => {
    setStepError(null);
    const valid = await form.trigger([
      "nationalId",
      "phoneNumber",
      "dateOfBirth",
      "securityQuestion",
      "securityAnswer",
    ]);
    if (!valid) return;

    const values = form.getValues();
    try {
      // Backend matches national_id + date_of_birth + phone_number against an
      // existing patient/guardian and mints a short-lived signup token (cookie).
      await signupStart.mutateAsync({
        national_id: values.nationalId,
        date_of_birth: values.dateOfBirth,
        phone_number: values.phoneNumber,
      });
      setStep(2);
    } catch (error) {
      setStepError(
        error instanceof ApiError
          ? (error.messages[0] ?? t("errors.signupStartFailed"))
          : t("errors.serverError"),
      );
    }
  };

  // Step 2: complete creates the account and auto-logs-in (sets patient cookies).
  const handleSubmit = form.handleSubmit(async (data) => {
    setStepError(null);
    try {
      await signupComplete.mutateAsync({
        password: data.password,
        confirm_password: data.confirmPassword,
        security_question: data.securityQuestion,
        security_answer: data.securityAnswer,
      });
      router.replace("/patient");
    } catch (error) {
      setStepError(
        error instanceof ApiError
          ? (error.messages[0] ?? t("errors.serverError"))
          : t("errors.serverError"),
      );
    }
  });

  const errors = form.formState.errors;
  const labels = STEP_LABEL_KEYS.map((key) => t(key));

  return (
    <div className="w-full flex flex-col gap-7">
      <StepIndicator currentStep={step} labels={labels} />

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
        {step === 1 ? (
          <>
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
                {...form.register("nationalId")}
                className={cn(inputClass, errorInputClass(!!errors.nationalId))}
              />
              {fieldError(errors.nationalId?.message)}
            </div>

            {/* Phone */}
            <PhoneInput
              id="phoneNumber"
              label={t("phoneLabel")}
              placeholder={t("phonePlaceholder")}
              registration={form.register("phoneNumber")}
              error={errors.phoneNumber?.message}
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
                {...form.register("dateOfBirth")}
                className={cn(inputClass, errorInputClass(!!errors.dateOfBirth))}
              />
              {fieldError(errors.dateOfBirth?.message)}
            </div>

            {/* Security question — used to recover a forgotten password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="securityQuestion"
                className="text-sm text-brand-black"
              >
                {t("securityQuestionLabel")}
              </label>
              <Controller
                control={form.control}
                name="securityQuestion"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="securityQuestion"
                      className={cn(
                        inputClass,
                        "!h-auto min-h-11 w-full justify-between font-normal",
                        errorInputClass(!!errors.securityQuestion),
                      )}
                    >
                      <SelectValue
                        placeholder={t("securityQuestionPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {SECURITY_QUESTION_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {tq(key)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {fieldError(errors.securityQuestion?.message)}
            </div>

            {/* Security answer */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="securityAnswer"
                className="text-sm text-brand-black"
              >
                {t("securityAnswerLabel")}
              </label>
              <input
                id="securityAnswer"
                type="text"
                autoComplete="off"
                placeholder={t("securityAnswerPlaceholder")}
                {...form.register("securityAnswer")}
                className={cn(
                  inputClass,
                  errorInputClass(!!errors.securityAnswer),
                )}
              />
              {fieldError(errors.securityAnswer?.message)}
            </div>

            {stepError && (
              <p className="text-sm text-red-500 text-center">{stepError}</p>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={signupStart.isPending}
              className="mt-1 w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99] disabled:opacity-50"
            >
              {t("nextButton")}
            </button>
          </>
        ) : (
          <>
            {/* Password */}
            <PasswordInput
              id="password"
              label={t("passwordLabel")}
              placeholder={t("passwordPlaceholder")}
              registration={form.register("password")}
              error={errors.password?.message}
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
              registration={form.register("confirmPassword")}
              error={errors.confirmPassword?.message}
              inputClassName={inputClass}
              errorInputClassName={errorInputClass(true)}
              showLabel={t("showPassword")}
              hideLabel={t("hidePassword")}
            />

            {stepError && (
              <p className="text-sm text-red-500 text-center">{stepError}</p>
            )}

            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStepError(null);
                  setStep(1);
                }}
                disabled={signupComplete.isPending}
                className="w-full rounded-full border border-gray-200 py-3.5 text-sm font-semibold text-brand-black transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {t("backButton")}
              </button>
              <button
                type="submit"
                disabled={form.formState.isSubmitting || signupComplete.isPending}
                className="w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99] disabled:opacity-50"
              >
                {t("submitButton")}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
