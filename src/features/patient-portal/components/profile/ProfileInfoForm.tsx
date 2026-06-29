"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { toast } from "sonner";

import { cn } from "@/common/utils/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/infrastructure/http/api";
import { useUpdatePatientProfile } from "../../hooks/usePatientProfileSettings";
import type {
  MaritalStatus,
  PatientProfileDetails,
} from "../../types/patient-portal.types";
import { SectionCard } from "../portal-ui";

const MARITAL_STATUSES: readonly MaritalStatus[] = [
  "SINGLE",
  "MARRIED",
  "DIVORCED",
  "WIDOWED",
  "SEPARATED",
  "ENGAGED",
  "UNKNOWN",
];

type Translate = ReturnType<typeof useTranslations>;

const MAX_AGE_YEARS = 120;

/** Mirror the `book_visit` template's phone rule: lenient international. */
const PHONE_RE = /^\+?[0-9\s-]{7,20}$/;

/** True when the YYYY-MM-DD value parses to a day after today. */
function isFutureDate(value: string): boolean {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() > today.getTime();
}

/** True when the value is older than the max supported age. */
function isTooOld(value: string): boolean {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const min = new Date();
  min.setHours(0, 0, 0, 0);
  min.setFullYear(min.getFullYear() - MAX_AGE_YEARS);
  return d.getTime() < min.getTime();
}

function createSchema(t: Translate) {
  return z.object({
    fullName: z.string().trim().min(2, { message: t("profile.fullNameInvalid") }),
    dateOfBirth: z
      .string()
      .optional()
      .refine((v) => !v || !isFutureDate(v), {
        message: t("profile.dobFuture"),
      })
      .refine((v) => !v || !isTooOld(v), {
        message: t("profile.dobTooOld"),
      }),
    phoneNumber: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || PHONE_RE.test(v), {
        message: t("profile.phoneInvalid"),
      }),
    address: z.string().trim().optional(),
    maritalStatus: z.enum([
      "SINGLE",
      "MARRIED",
      "DIVORCED",
      "WIDOWED",
      "SEPARATED",
      "ENGAGED",
      "UNKNOWN",
    ]),
  });
}

type FormData = z.infer<ReturnType<typeof createSchema>>;

const inputClass = cn(
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
);

export function ProfileInfoForm({
  profile,
}: {
  profile: PatientProfileDetails;
}) {
  const t = useTranslations("patientPortal");
  const update = useUpdatePatientProfile();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(createSchema(t)),
    defaultValues: {
      fullName: profile.fullName,
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "",
      phoneNumber: profile.phoneNumber,
      address: profile.address,
      maritalStatus: profile.maritalStatus,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await update.mutateAsync({
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth || undefined,
        phoneNumber: data.phoneNumber || undefined,
        address: data.address || undefined,
        maritalStatus: data.maritalStatus,
      });
      toast.success(t("profile.saved"));
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? (error.messages[0] ?? t("profile.saveError"))
          : t("profile.saveError"),
      );
    }
  });

  return (
    <SectionCard title={t("profile.profileInfo")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label={t("profile.fullName")} error={errors.fullName?.message}>
          <input
            type="text"
            {...register("fullName")}
            className={cn(inputClass, errors.fullName && "border-red-400")}
          />
        </Field>

        <Field
          label={t("profile.dateOfBirth")}
          error={errors.dateOfBirth?.message}
        >
          <input
            type="date"
            {...register("dateOfBirth")}
            className={cn(inputClass, errors.dateOfBirth && "border-red-400")}
          />
        </Field>

        <Field
          label={t("profile.phoneNumber")}
          error={errors.phoneNumber?.message}
        >
          <input
            type="tel"
            inputMode="tel"
            {...register("phoneNumber")}
            className={cn(inputClass, errors.phoneNumber && "border-red-400")}
          />
        </Field>

        <Field label={t("profile.address")}>
          <input type="text" {...register("address")} className={inputClass} />
        </Field>

        <Field label={t("profile.maritalStatus")}>
          <Controller
            control={control}
            name="maritalStatus"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={cn(inputClass, "h-auto")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MARITAL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`profile.maritalStatusOptions.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field label={t("profile.nationalId")}>
          <input
            type="text"
            value={profile.nationalId}
            disabled
            readOnly
            className={cn(inputClass, "cursor-not-allowed bg-gray-50 text-gray-500")}
          />
          <p className="mt-1 text-[11px] text-gray-400">
            {t("profile.nationalIdReadonly")}
          </p>
        </Field>

        <button
          type="submit"
          disabled={update.isPending || !isDirty}
          className="mt-1 inline-flex h-11 items-center justify-center self-start rounded-full bg-brand-primary px-8 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-50"
        >
          {update.isPending ? t("profile.saving") : t("profile.save")}
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
