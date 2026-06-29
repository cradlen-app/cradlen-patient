"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { ageFromDob } from "../lib/format";
import {
  useActivePatientId,
  usePatientProfiles,
} from "../hooks/usePatientProfiles";
import { usePatientProfileDetails } from "../hooks/usePatientProfileSettings";
import { usePatientProfileStore } from "../store/patientProfileStore";
import { EmptyState, ScreenHeader, SectionCard } from "./portal-ui";
import { AvatarUploader } from "./profile/AvatarUploader";
import { ProfileInfoForm } from "./profile/ProfileInfoForm";
import { ChangePasswordForm } from "./profile/ChangePasswordForm";
import { SecurityQuestionForm } from "./profile/SecurityQuestionForm";

export function ProfileScreen() {
  const t = useTranslations("patientPortal");
  const { data: profiles } = usePatientProfiles();
  const { data: profile, isLoading } = usePatientProfileDetails();
  const activeId = useActivePatientId();
  const setActive = usePatientProfileStore((s) => s.setActiveProfile);

  const dependents = profiles?.filter((p) => p.kind === "dependent") ?? [];

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <ScreenHeader title={t("profile.title")} />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        {isLoading || !profile ? (
          <EmptyState message={t("common.loading")} />
        ) : (
          <>
            <AvatarUploader profile={profile} />
            <ProfileInfoForm key={profile.id} profile={profile} />
            <ChangePasswordForm />
            <SecurityQuestionForm />
          </>
        )}

        <SectionCard title={t("profile.dependents")}>
          {dependents.length === 0 ? (
            <p className="py-1 text-sm text-gray-400">—</p>
          ) : (
            <ul className="space-y-1.5">
              {dependents.map((d) => {
                const isActive = d.id === activeId;
                const age = ageFromDob(d.dateOfBirth);
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setActive(d.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-2.5 text-start transition-colors",
                        isActive
                          ? "border-brand-primary bg-brand-primary/5"
                          : "border-gray-100 hover:bg-gray-50",
                      )}
                    >
                      <span className="flex size-9 items-center justify-center rounded-full bg-brand-secondary/20 text-lg">
                        {d.avatar ?? "👤"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-brand-black">
                          {d.fullName}
                        </span>
                        <span className="block text-xs text-gray-400">
                          {t("shell.dependent")}
                          {age !== undefined ? ` · ${age}` : ""}
                        </span>
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-bold text-brand-primary">
                          {t("profile.viewing")}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
