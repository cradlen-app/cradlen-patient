"use client";

import { useTranslations } from "next-intl";

import { usePatientProfileDetails } from "../hooks/usePatientProfileSettings";
import { EmptyState, ScreenHeader } from "./portal-ui";
import { AvatarUploader } from "./profile/AvatarUploader";
import { ProfileInfoForm } from "./profile/ProfileInfoForm";
import { ChangePasswordForm } from "./profile/ChangePasswordForm";
import { SecurityQuestionForm } from "./profile/SecurityQuestionForm";
import { PushNotificationsSection } from "./profile/PushNotificationsSection";

export function ProfileScreen() {
  const t = useTranslations("patientPortal");
  const { data: profile, isLoading } = usePatientProfileDetails();

  return (
    <div className="flex w-full flex-col gap-4">
      <ScreenHeader title={t("profile.title")} />

      <div className="space-y-4">
        {isLoading || !profile ? (
          <EmptyState message={t("common.loading")} />
        ) : (
          <>
            <AvatarUploader profile={profile} />
            <ProfileInfoForm key={profile.id} profile={profile} />
            <ChangePasswordForm />
            <SecurityQuestionForm />
            <PushNotificationsSection />
          </>
        )}
      </div>
    </div>
  );
}
