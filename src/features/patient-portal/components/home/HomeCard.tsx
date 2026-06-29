"use client";

import type { ReactNode } from "react";

import { cn } from "@/common/utils/utils";
import { Link } from "@/i18n/navigation";

/**
 * White rounded card shell shared by the home dashboard widgets. Mirrors the
 * portal `SectionCard` surface (radius/border/shadow) but pairs with
 * {@link HomeCardHeader}, whose title is a bold dark heading rather than the
 * uppercase-gray label `SectionCard` uses elsewhere.
 */
export function HomeCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Bold heading + optional trailing action / "view all" link. */
export function HomeCardHeader({
  title,
  action,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  action?: ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-bold text-brand-black">{title}</h2>
      {viewAllHref && viewAllLabel ? (
        <Link
          href={viewAllHref as Parameters<typeof Link>[0]["href"]}
          className="text-xs font-semibold text-brand-primary hover:text-brand-primary/80"
        >
          {viewAllLabel}
        </Link>
      ) : (
        action
      )}
    </div>
  );
}
