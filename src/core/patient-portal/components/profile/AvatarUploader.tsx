"use client";

import { useRef } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ApiError } from "@/infrastructure/http/api";
import {
  useRemoveProfileImage,
  useUploadProfileImage,
} from "../../hooks/usePatientProfileSettings";
import type { PatientProfileDetails } from "../../types/patient-portal.types";
import { SectionCard } from "../portal-ui";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Mirror the backend storage allowlist for avatars (images only). */
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function AvatarUploader({ profile }: { profile: PatientProfileDetails }) {
  const t = useTranslations("patientPortal");
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadProfileImage();
  const remove = useRemoveProfileImage();
  const busy = upload.isPending || remove.isPending;

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-picking the same file
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(t("profile.imageTypeError"));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t("profile.imageTooLarge"));
      return;
    }

    upload.mutate(file, {
      onSuccess: () => toast.success(t("profile.imageUpdated")),
      onError: (error) =>
        toast.error(
          error instanceof ApiError
            ? (error.messages[0] ?? t("profile.saveError"))
            : t("profile.saveError"),
        ),
    });
  };

  const onRemove = () => {
    remove.mutate(undefined, {
      onSuccess: () => toast.success(t("profile.imageRemoved")),
      onError: () => toast.error(t("profile.saveError")),
    });
  };

  return (
    <SectionCard title={t("profile.account")}>
      <div className="flex items-center gap-4">
        <div className="relative size-16 shrink-0">
          {profile.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL (dynamic host); next/image not practical
            <img
              src={profile.imageUrl}
              alt={profile.fullName}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-full bg-brand-secondary/20 text-xl font-bold text-brand-primary">
              {initials(profile.fullName)}
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
              <Loader2 className="size-5 animate-spin text-white" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-brand-black">
            {profile.fullName}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-brand-black hover:bg-gray-50 disabled:opacity-50"
            >
              <Camera className="size-3.5" />
              {profile.imageUrl
                ? t("profile.changePhoto")
                : t("profile.addPhoto")}
            </button>
            {profile.imageUrl && (
              <button
                type="button"
                disabled={busy}
                onClick={onRemove}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
                {t("profile.removePhoto")}
              </button>
            )}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onPick}
        />
      </div>
    </SectionCard>
  );
}
