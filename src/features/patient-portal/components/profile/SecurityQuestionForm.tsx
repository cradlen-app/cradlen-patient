"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { toast } from "sonner";

import { cn } from "@/common/utils/utils";
import { SECURITY_QUESTION_KEYS } from "@/common/constants/security-questions";
import { ApiError } from "@/infrastructure/http/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePatientSecurityQuestion,
  useSetSecurityQuestion,
} from "../../hooks/usePatientProfileSettings";
import { SectionCard } from "../portal-ui";

type Translate = ReturnType<typeof useTranslations>;

function createSchema(t: Translate) {
  return z.object({
    securityQuestion: z
      .string()
      .refine(
        (v) => (SECURITY_QUESTION_KEYS as readonly string[]).includes(v),
        t("profile.securityQuestionRequired"),
      ),
    securityAnswer: z
      .string()
      .min(2, t("profile.securityAnswerMinLength"))
      .max(128, t("profile.securityAnswerMaxLength")),
    currentPassword: z.string().min(1, t("profile.passwordRequired")),
  });
}

const inputClass = cn(
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
);

export function SecurityQuestionForm() {
  const t = useTranslations("patientPortal");
  const tq = useTranslations("auth.securityQuestions");
  const { data: currentQuestion } = usePatientSecurityQuestion();
  const save = useSetSecurityQuestion();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<ReturnType<typeof createSchema>>>({
    resolver: zodResolver(createSchema(t)),
    defaultValues: {
      securityQuestion: "",
      securityAnswer: "",
      currentPassword: "",
    },
  });

  // Preselect the stored question once it loads (or after an update).
  useEffect(() => {
    if (currentQuestion) {
      reset((prev) => ({ ...prev, securityQuestion: currentQuestion }));
    }
  }, [currentQuestion, reset]);

  const isSet = Boolean(currentQuestion);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await save.mutateAsync({
        securityQuestion: data.securityQuestion,
        securityAnswer: data.securityAnswer,
        currentPassword: data.currentPassword,
      });
      toast.success(t("profile.securityQuestionSaved"));
      reset((prev) => ({
        ...prev,
        securityAnswer: "",
        currentPassword: "",
      }));
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? (error.messages[0] ?? t("profile.saveError"))
          : t("profile.saveError"),
      );
    }
  });

  return (
    <SectionCard title={t("profile.securityQuestionTitle")}>
      <p className="mb-4 text-sm text-gray-500">
        {t("profile.securityQuestionDescription")}
      </p>

      <p className="mb-4 text-sm">
        <span className="text-gray-500">
          {t("profile.currentSecurityQuestion")}:{" "}
        </span>
        <span className="font-medium text-brand-black">
          {isSet ? tq(currentQuestion as string) : t("profile.securityQuestionNotSet")}
        </span>
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field
          label={t("profile.securityQuestionLabel")}
          error={errors.securityQuestion?.message}
        >
          <Controller
            control={control}
            name="securityQuestion"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  className={cn(
                    inputClass,
                    "!h-auto min-h-11 w-full justify-between font-normal",
                    errors.securityQuestion && "border-red-400",
                  )}
                >
                  <SelectValue
                    placeholder={t("profile.securityQuestionPlaceholder")}
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
        </Field>

        <Field
          label={t("profile.securityAnswerLabel")}
          error={errors.securityAnswer?.message}
        >
          <input
            type="text"
            autoComplete="off"
            placeholder={t("profile.securityAnswerPlaceholder")}
            {...register("securityAnswer")}
            className={cn(inputClass, errors.securityAnswer && "border-red-400")}
          />
        </Field>

        <Field
          label={t("profile.currentPassword")}
          error={errors.currentPassword?.message}
        >
          <input
            type="password"
            autoComplete="current-password"
            {...register("currentPassword")}
            className={cn(
              inputClass,
              errors.currentPassword && "border-red-400",
            )}
          />
        </Field>

        <button
          type="submit"
          disabled={save.isPending}
          className="mt-1 inline-flex h-11 items-center justify-center self-start rounded-full bg-brand-primary px-8 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-50"
        >
          {save.isPending
            ? t("profile.saving")
            : isSet
              ? t("profile.updateSecurityQuestion")
              : t("profile.saveSecurityQuestion")}
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
