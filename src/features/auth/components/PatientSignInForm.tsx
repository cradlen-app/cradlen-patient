"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/common/utils/utils";
import { ApiError } from "@/infrastructure/http/api";
import { usePatientLogin } from "../hooks/usePatientAuth";
import {
  createPatientSignInSchema,
  type PatientSignInFormData,
} from "../lib/patient-sign-in.schemas";

export function PatientSignInForm() {
  const t = useTranslations("auth.patientSignIn");
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();
  const login = usePatientLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientSignInFormData>({
    resolver: zodResolver(createPatientSignInSchema(t)),
  });

  const onSubmit = async (data: PatientSignInFormData) => {
    setApiError(null);
    try {
      await login.mutateAsync({
        national_id: data.nationalId,
        password: data.password,
      });
      router.replace("/patient");
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(
          error.status === 401
            ? t("errors.invalidCredentials")
            : (error.messages[0] ?? t("errors.serverError")),
        );
      } else {
        setApiError(t("errors.serverError"));
      }
    }
  };

  const inputClass = cn(
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
    "placeholder:text-gray-400 outline-none transition-colors",
    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full flex flex-col gap-5"
    >
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
          {...register("nationalId")}
          className={cn(inputClass, errors.nationalId && "border-red-400")}
        />
        {errors.nationalId && (
          <p className="text-xs text-red-500">{errors.nationalId.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm text-brand-black">
            {t("passwordLabel")}
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4" />
            )}
            {showPassword ? t("hidePassword") : t("showPassword")}
          </button>
        </div>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          {...register("password")}
          className={cn(inputClass, errors.password && "border-red-400")}
        />
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        )}
        <Link
          href="/patient/forgot-password"
          className="text-end text-xs text-brand-secondary transition-opacity hover:opacity-80"
        >
          {t("forgotPassword")}
        </Link>
      </div>

      {/* API error */}
      {apiError && (
        <p className="text-sm text-red-500 text-center">{apiError}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || login.isPending}
        className="mt-1 w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white hover:bg-brand-primary/90 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
      >
        {t("submitButton")}
      </button>
    </form>
  );
}
