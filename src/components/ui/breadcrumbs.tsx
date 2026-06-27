"use client";

import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/common/utils/utils";

export type Crumb = {
  label: string;
  /** Omit on the current (last) crumb — it renders as plain text. */
  href?: string;
};

type Props = {
  items: Crumb[];
  ariaLabel?: string;
  className?: string;
};

/**
 * Chevron-separated breadcrumb trail. The last item is always the current page
 * (rendered as plain emphasized text); earlier items link when given an `href`.
 * RTL-aware separators.
 */
export function Breadcrumbs({ items, ariaLabel, className }: Props) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "flex flex-wrap items-center gap-1 text-xs text-gray-500",
        className,
      )}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1">
            {item.href && !isLast ? (
              <Link
                href={item.href as Parameters<typeof Link>[0]["href"]}
                className="truncate hover:text-brand-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "truncate",
                  isLast ? "font-medium text-brand-primary" : "text-gray-500",
                )}
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight
                className="size-3 shrink-0 text-gray-300 rtl:rotate-180"
                aria-hidden="true"
              />
            )}
          </span>
        );
      })}
    </nav>
  );
}
