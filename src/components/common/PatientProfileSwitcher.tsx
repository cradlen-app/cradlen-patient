"use client";

import { useState } from "react";
import { ChevronDown, Check, LogOut, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Link } from "@/i18n/navigation";
import { usePatientLogout } from "@/features/auth/hooks/usePatientAuth";
import {
  useActivePatientId,
  usePatientProfiles,
  usePatientProfileStore,
} from "@/core/patient-portal/api";
import { PatientAvatar } from "./PatientAvatar";

/**
 * Navbar account control for the patient portal. The trigger shows the active
 * profile (avatar + name + relation); the dropdown switches the active profile
 * (self + dependents) and carries the Profile link and Logout. This is the
 * single account/switcher/logout control on md+ — the sidebar no longer hosts
 * one, and on phones the `PatientMoreSheet` owns these affordances.
 */
export function PatientProfileSwitcher() {
  const t = useTranslations("patientPortal");
  const [open, setOpen] = useState(false);
  const { data: profiles } = usePatientProfiles();
  const activeId = useActivePatientId();
  const setActive = usePatientProfileStore((s) => s.setActiveProfile);
  const logout = usePatientLogout();

  const active = profiles?.find((p) => p.id === activeId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 h-10 ps-1 pe-2.5 rounded-full transition-colors hover:bg-gray-100"
      >
        <PatientAvatar
          imageUrl={active?.imageUrl}
          alt={active?.fullName ?? ""}
          className="size-8 ring-2 ring-white shadow-sm"
        />
        <span className="flex flex-col items-start leading-none gap-0.5">
          <span className="text-sm text-brand-black whitespace-nowrap">
            {active?.fullName ?? "—"}
          </span>
          <span className="text-[11px] leading-none whitespace-nowrap text-brand-primary/70">
            {active?.kind === "self" ? t("shell.you") : t("shell.dependent")}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-gray-400 transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="close"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute z-50 mt-2 w-60 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg ltr:right-0 rtl:left-0"
          >
            <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
              {t("shell.switchProfile")}
            </p>
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
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-start text-sm transition-colors hover:bg-gray-50",
                    isActive && "bg-brand-primary/5",
                  )}
                >
                  <PatientAvatar
                    imageUrl={p.imageUrl}
                    alt={p.fullName}
                    className="size-8"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-brand-black">
                      {p.fullName}
                    </span>
                    <span className="block truncate text-xs text-gray-400">
                      {p.kind === "self" ? t("shell.you") : t("shell.dependent")}
                    </span>
                  </span>
                  {isActive && (
                    <Check className="size-4 shrink-0 text-brand-primary" />
                  )}
                </button>
              );
            })}

            <div className="mt-1 border-t border-gray-100 pt-1">
              <Link
                href="/patient/profile"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                <User className="size-4 shrink-0" />
                {t("nav.profile")}
              </Link>
            </div>

            <div className="mt-1 border-t border-gray-100 pt-1">
              <button
                type="button"
                role="menuitem"
                disabled={logout.isPending}
                onClick={() => {
                  setOpen(false);
                  logout.mutate();
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-start text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut className="size-4 shrink-0" />
                {t("shell.logout")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
