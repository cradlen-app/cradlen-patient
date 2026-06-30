"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { toast } from "sonner";

import { cn } from "@/common/utils/utils";
import { ApiError } from "@/infrastructure/http/api";
import { useUpdateNationalId } from "../../hooks/usePatientProfileSettings";
import type { PatientProfileDetails } from "../../types/patient-portal.types";

type Translate = ReturnType<typeof useTranslations>;

/** Shared Egyptian national-ID rule (exactly 14 digits) — mirrors the backend. */
const NATIONAL_ID_RE = /^\d{14}$/;

function createSchema(t: Translate) {
  return z.object({
    nationalId: z
      .string()
      .trim()
      .regex(NATIONAL_ID_RE, t("profile.nationalIdFormatInvalid")),
    currentPassword: z.string().min(1, t("profile.passwordRequired")),
  });
}

const inputClass = cn(
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
);

/**
 * National ID display + guarded editor. National ID is the login credential, so
 * the edit form requires the current password (re-verified server-side) and
 * warns that changing it updates how the patient signs in. Rendered as its own
 * form (not nested in the demographics form). Self or dependent is resolved by
 * the mutation hook via the active patient id.
 */
export function NationalIdField({
  profile,
}: {
  profile: PatientProfileDetails;
}) {
  const t = useTranslations("patientPortal");
  const update = useUpdateNationalId();
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<ReturnType<typeof createSchema>>>({
    resolver: zodResolver(createSchema(t)),
    defaultValues: { nationalId: "", currentPassword: "" },
  });

  function close() {
    setEditing(false);
    reset();
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      await update.mutateAsync({
        nationalId: data.nationalId.trim(),
        currentPassword: data.currentPassword,
      });
      toast.success(t("profile.nationalIdChanged"));
      close();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(t("profile.nationalIdInUse"));
      } else if (error instanceof ApiError && error.status === 401) {
        toast.error(t("profile.nationalIdWrongPassword"));
      } else {
        toast.error(t("profile.nationalIdChangeError"));
      }
    }
  });

  if (!editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-brand-black">
            {t("profile.nationalId")}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-brand-primary hover:underline"
          >
            {t("profile.nationalIdEdit")}
          </button>
        </div>
        <input
          type="text"
          value={profile.nationalId}
          disabled
          readOnly
          className={cn(
            inputClass,
            "cursor-not-allowed bg-gray-50 text-gray-500",
          )}
        />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} autoComplete="off" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-brand-black">
          {t("profile.nationalIdEditTitle")}
        </span>
        <p
          role="note"
          className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700"
        >
          {t("profile.nationalIdEditWarning")}
        </p>
      </div>

      <Field
        label={t("profile.nationalIdNew")}
        error={errors.nationalId?.message}
      >
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          {...register("nationalId")}
          className={cn(inputClass, errors.nationalId && "border-red-400")}
        />
      </Field>

      <Field
        label={t("profile.currentPassword")}
        error={errors.currentPassword?.message}
      >
        <input
          type="password"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-bwignore
          data-form-type="other"
          {...register("currentPassword")}
          className={cn(inputClass, errors.currentPassword && "border-red-400")}
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={update.isPending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-brand-primary px-8 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-50"
        >
          {update.isPending ? t("profile.saving") : t("profile.save")}
        </button>
        <button
          type="button"
          onClick={close}
          disabled={update.isPending}
          className="inline-flex h-11 items-center justify-center rounded-full border border-gray-200 px-8 text-sm font-semibold text-brand-black hover:bg-gray-50 disabled:opacity-50"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
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
      <label className="flex flex-col gap-1.5 text-sm text-brand-black">
        {label}
        {children}
      </label>
      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
