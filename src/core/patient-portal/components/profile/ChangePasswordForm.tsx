"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { toast } from "sonner";

import { cn } from "@/common/utils/utils";
import { ApiError } from "@/infrastructure/http/api";
import { useChangePassword } from "../../hooks/usePatientProfileSettings";
import { SectionCard } from "../portal-ui";

type Translate = ReturnType<typeof useTranslations>;

/** Mirrors the backend strong-password policy (upper, lower, digit, special). */
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

function createSchema(t: Translate) {
  return z
    .object({
      currentPassword: z.string().min(1, t("profile.passwordRequired")),
      newPassword: z
        .string()
        .min(8, t("profile.passwordMinLength"))
        .max(128, t("profile.passwordMaxLength"))
        .regex(STRONG_PASSWORD_REGEX, t("profile.passwordWeak")),
      confirmNewPassword: z.string().min(1, t("profile.passwordRequired")),
    })
    .refine((d) => d.newPassword === d.confirmNewPassword, {
      path: ["confirmNewPassword"],
      message: t("profile.passwordMismatch"),
    });
}

const inputClass = cn(
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
);

export function ChangePasswordForm() {
  const t = useTranslations("patientPortal");
  const change = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<ReturnType<typeof createSchema>>>({
    resolver: zodResolver(createSchema(t)),
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await change.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success(t("profile.passwordChanged"));
      reset();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? (error.messages[0] ?? t("profile.saveError"))
          : t("profile.saveError"),
      );
    }
  });

  return (
    <SectionCard title={t("profile.accountSecurity")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field
          label={t("profile.currentPassword")}
          error={errors.currentPassword?.message}
        >
          <input
            type="password"
            autoComplete="current-password"
            {...register("currentPassword")}
            className={cn(inputClass, errors.currentPassword && "border-red-400")}
          />
        </Field>

        <Field
          label={t("profile.newPassword")}
          error={errors.newPassword?.message}
        >
          <input
            type="password"
            autoComplete="new-password"
            {...register("newPassword")}
            className={cn(inputClass, errors.newPassword && "border-red-400")}
          />
        </Field>

        <Field
          label={t("profile.confirmPassword")}
          error={errors.confirmNewPassword?.message}
        >
          <input
            type="password"
            autoComplete="new-password"
            {...register("confirmNewPassword")}
            className={cn(
              inputClass,
              errors.confirmNewPassword && "border-red-400",
            )}
          />
        </Field>

        <button
          type="submit"
          disabled={change.isPending}
          className="mt-1 inline-flex h-11 items-center justify-center self-start rounded-full bg-brand-primary px-8 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-50"
        >
          {change.isPending
            ? t("profile.saving")
            : t("profile.changePassword")}
        </button>
      </form>
    </SectionCard>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-brand-black">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
