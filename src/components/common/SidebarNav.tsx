"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/common/utils/utils";
import type { LucideIcon } from "lucide-react";

export type SidebarNavItem = {
  path: string;
  /** Full i18n key (e.g. "nav.dashboard" or "staff.nav.label"). */
  key: string;
  icon: LucideIcon;
  /** Optional collapsible group this item belongs to (e.g. "Financial"). */
  group?: {
    id: string;
    labelKey: string;
    icon: LucideIcon;
  };
};

type SidebarNavProps = {
  items: SidebarNavItem[];
  collapsed: boolean;
  dashboardPath: (path: string) => string;
};

/** A run of consecutive grouped items, or a single ungrouped item. */
type NavEntry =
  | { kind: "item"; item: SidebarNavItem }
  | {
      kind: "group";
      id: string;
      labelKey: string;
      icon: LucideIcon;
      items: SidebarNavItem[];
    };

function clusterEntries(items: SidebarNavItem[]): NavEntry[] {
  const entries: NavEntry[] = [];
  for (const item of items) {
    if (!item.group) {
      entries.push({ kind: "item", item });
      continue;
    }
    const last = entries[entries.length - 1];
    if (last && last.kind === "group" && last.id === item.group.id) {
      last.items.push(item);
    } else {
      entries.push({
        kind: "group",
        id: item.group.id,
        labelKey: item.group.labelKey,
        icon: item.group.icon,
        items: [item],
      });
    }
  }
  return entries;
}

export function SidebarNav({ items, collapsed, dashboardPath }: SidebarNavProps) {
  const t = useTranslations();
  const pathname = usePathname();

  const isActive = (path: string) => {
    const href = dashboardPath(path);
    return path === ""
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");
  };

  const renderLink = (item: SidebarNavItem, indented = false) => {
    const href = dashboardPath(item.path);
    const active = isActive(item.path);
    const Icon = item.icon;
    const label = t(item.key as Parameters<typeof t>[0]);
    return (
      <Link
        key={item.path}
        href={href as Parameters<typeof Link>[0]["href"]}
        title={collapsed ? label : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
          collapsed && "justify-center px-0",
          !collapsed && indented && "ps-9",
          active
            ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
            : "text-gray-400 hover:bg-gray-50 hover:text-brand-black",
        )}
      >
        <Icon className="size-5 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  const entries = clusterEntries(items);

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
      {entries.map((entry) => {
        if (entry.kind === "item") {
          return renderLink(entry.item);
        }
        // When collapsed, render group children flat as icon links.
        if (collapsed) {
          return entry.items.map((child) => renderLink(child));
        }
        return (
          <SidebarNavGroup
            key={entry.id}
            entry={entry}
            isChildActive={entry.items.some((c) => isActive(c.path))}
            renderLink={renderLink}
            label={t(entry.labelKey as Parameters<typeof t>[0])}
          />
        );
      })}
    </nav>
  );
}

type SidebarNavGroupProps = {
  entry: Extract<NavEntry, { kind: "group" }>;
  isChildActive: boolean;
  label: string;
  renderLink: (item: SidebarNavItem, indented?: boolean) => React.ReactNode;
};

function SidebarNavGroup({
  entry,
  isChildActive,
  label,
  renderLink,
}: SidebarNavGroupProps) {
  const [open, setOpen] = useState(isChildActive);
  const Icon = entry.icon;
  const expanded = open || isChildActive;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
          isChildActive
            ? "text-brand-black"
            : "text-gray-400 hover:bg-gray-50 hover:text-brand-black",
        )}
      >
        <Icon className="size-5 shrink-0" />
        <span className="flex-1 truncate text-start">{label}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform duration-150",
            expanded && "rotate-180",
          )}
        />
      </button>
      {expanded && (
        <div className="mt-0.5 space-y-0.5">
          {entry.items.map((child) => renderLink(child, true))}
        </div>
      )}
    </div>
  );
}
