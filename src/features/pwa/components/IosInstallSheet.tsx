"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Check, Plus, Share, X } from "lucide-react";
import { cn } from "@/common/utils/utils";

type IosInstallSheetProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Bottom-sheet with the manual "Share → Add to Home Screen" steps for iOS
 * Safari, which has no `beforeinstallprompt` API. Built self-contained because
 * the project has no Dialog/Sheet primitive: a dimmed overlay + slide-up panel,
 * focus moved into the panel on open, closable via Esc, overlay click, or the
 * Close button.
 */
export function IosInstallSheet({ open, onClose }: IosInstallSheetProps) {
  const t = useTranslations("pwa");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const steps = [
    { icon: Share, text: t("ios.step1") },
    { icon: Plus, text: t("ios.step2") },
    { icon: Check, text: t("ios.step3") },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t("ios.title")}
    >
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40"
      />
      <div
        className={cn(
          "relative w-full max-w-md rounded-t-2xl bg-white p-5 pb-8 shadow-xl",
          "animate-in slide-in-from-bottom duration-200",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-brand-black">
            {t("ios.title")}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("ios.close")}
            className="-me-1 flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-primary"
          >
            <X className="size-5" />
          </button>
        </div>

        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={index} className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                <step.icon className="size-5" />
              </span>
              <span className="text-sm text-gray-700">{step.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
