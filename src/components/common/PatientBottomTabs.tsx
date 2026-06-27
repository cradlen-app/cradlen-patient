"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Link, usePathname } from "@/i18n/navigation";
import { PATIENT_NAV, patientHref } from "./patient-nav";
import { PatientMoreSheet } from "./PatientMoreSheet";

/**
 * Mobile-only bottom tab bar for the patient portal (hidden on lg+, where the
 * sidebar takes over). Shows the primary destinations plus a "More" button that
 * opens a full-screen overlay carrying the account switcher, secondary nav, and
 * logout.
 */
export function PatientBottomTabs() {
  const t = useTranslations();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const items = PATIENT_NAV.filter((i) => i.primary);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-gray-100 bg-white px-1 py-1.5 lg:hidden">
        {items.map((item) => {
          const href = patientHref(item.path);
          const active =
            item.path === ""
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={href as Parameters<typeof Link>[0]["href"]}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-medium transition-colors",
                active ? "text-brand-primary" : "text-gray-400",
              )}
            >
              <Icon className="size-5" />
              <span className="truncate">
                {t(item.key as Parameters<typeof t>[0])}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-medium transition-colors",
            moreOpen ? "text-brand-primary" : "text-gray-400",
          )}
        >
          <MoreHorizontal className="size-5" />
          <span className="truncate">{t("patientPortal.nav.more")}</span>
        </button>
      </nav>

      <PatientMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
