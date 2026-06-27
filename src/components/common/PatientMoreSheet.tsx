"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
  LifeBuoy,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import type { Locale } from "@/i18n/routing";
import { Link, usePathname } from "@/i18n/navigation";
import { usePatientLogout } from "@/features/auth/hooks/usePatientAuth";
import {
  useActivePatientId,
  usePatientProfiles,
  usePatientProfileStore,
} from "@/core/patient-portal/api";
import { PATIENT_NAV, patientHref } from "./patient-nav";
import { PatientAvatar } from "./PatientAvatar";
import LanguageSelect from "./LanguageSelect";

/**
 * Full-screen mobile "More" overlay opened from `PatientBottomTabs`. Hosts the
 * affordances the mobile navbar no longer carries: the account bar + profile
 * switcher, the secondary nav (items not in the bottom tab bar), and logout.
 * Hidden on lg+ (where the sidebar owns these).
 */
export function PatientMoreSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("patientPortal");
  const tRoot = useTranslations();
  const tFooter = useTranslations("auth.signUp");
  const locale = useLocale();
  const pathname = usePathname();
  const { data: profiles } = usePatientProfiles();
  const activeId = useActivePatientId();
  const setActive = usePatientProfileStore((s) => s.setActiveProfile);
  const logout = usePatientLogout();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const active = profiles?.find((p) => p.id === activeId);
  const overflowItems = PATIENT_NAV.filter((i) => !i.primary);

  // Tear the overlay down once navigation has actually changed the route.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white duration-200 animate-in fade-in-0 slide-in-from-bottom-4 motion-reduce:animate-none lg:hidden">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-5">
        <span className="text-base font-semibold text-brand-black">
          {t("shell.account")}
        </span>
        <button
          type="button"
          aria-label="close"
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-primary"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Profile — collapsible switcher */}
        <div className="border-b border-gray-100 px-3 py-3">
          <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {t("nav.profile")}
          </p>

          <button
            type="button"
            onClick={() => setSwitcherOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={switcherOpen}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-gray-50"
          >
            <PatientAvatar
              imageUrl={active?.imageUrl}
              alt={active?.fullName ?? ""}
              className="size-9"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-brand-black">
                {active?.fullName ?? "—"}
              </span>
              <span className="block truncate text-xs text-gray-400">
                {active?.kind === "self"
                  ? t("shell.you")
                  : t("shell.dependent")}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-gray-400 transition-transform duration-150",
                switcherOpen && "rotate-180",
              )}
            />
          </button>

          {switcherOpen && (
            <div className="mt-1 space-y-0.5 duration-150 animate-in fade-in-0 slide-in-from-top-1 motion-reduce:animate-none">
              {profiles?.map((p) => {
                const isActive = p.id === activeId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    onClick={() => {
                      setActive(p.id);
                      setSwitcherOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-gray-50",
                      isActive && "bg-brand-primary/5",
                    )}
                  >
                    <PatientAvatar
                      imageUrl={p.imageUrl}
                      alt={p.fullName}
                      className="size-8"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-brand-black">
                        {p.fullName}
                      </span>
                      <span className="block truncate text-xs text-gray-400">
                        {p.kind === "self"
                          ? t("shell.you")
                          : t("shell.dependent")}
                      </span>
                    </span>
                    {isActive && (
                      <Check className="size-4 shrink-0 text-brand-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Secondary nav */}
        <nav className="px-3 py-3">
          {overflowItems.map((item) => {
            const href = patientHref(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={href as Parameters<typeof Link>[0]["href"]}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                <Icon className="size-5 shrink-0 text-gray-400" />
                <span className="flex-1 truncate">
                  {tRoot(item.key as Parameters<typeof tRoot>[0])}
                </span>
                <ChevronRight className="size-4 shrink-0 text-gray-300 rtl:scale-x-[-1]" />
              </Link>
            );
          })}
        </nav>

        {/* Legal / Help / Language */}
        <div className="border-t border-gray-100 px-3 py-3">
          <Link
            href="/terms-of-service"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <FileText className="size-5 shrink-0 text-gray-400" />
            <span className="flex-1 truncate">{tFooter("termsOfService")}</span>
            <ChevronRight className="size-4 shrink-0 text-gray-300 rtl:scale-x-[-1]" />
          </Link>
          <Link
            href="/privacy-policy"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <ShieldCheck className="size-5 shrink-0 text-gray-400" />
            <span className="flex-1 truncate">{tFooter("privacyPolicy")}</span>
            <ChevronRight className="size-4 shrink-0 text-gray-300 rtl:scale-x-[-1]" />
          </Link>
          <Link
            href="/help-center"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <LifeBuoy className="size-5 shrink-0 text-gray-400" />
            <span className="flex-1 truncate">{tFooter("helpCenter")}</span>
            <ChevronRight className="size-4 shrink-0 text-gray-300 rtl:scale-x-[-1]" />
          </Link>
          <div className="flex items-center gap-3 px-3 py-3">
            <Globe className="size-5 shrink-0 text-gray-400" />
            <span className="flex-1 truncate text-sm font-medium text-gray-600">
              {t("shell.language")}
            </span>
            <LanguageSelect currentLocale={locale as Locale} />
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-gray-100 px-3 py-3">
          <button
            type="button"
            disabled={logout.isPending}
            onClick={() => {
              onClose();
              logout.mutate();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <LogOut className="size-5 shrink-0" />
            {t("shell.logout")}
          </button>
        </div>

        {/* Copyright */}
        <p className="border-t border-gray-100 px-5 py-4 text-center text-xs text-gray-400">
          © {tFooter("copyright")}
        </p>
      </div>
    </div>
  );
}
