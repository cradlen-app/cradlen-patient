"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/common/utils/utils";
import { PATIENT_NAV, patientHref } from "./patient-nav";
import { SidebarNav, type SidebarNavItem } from "./SidebarNav";

const NAV_ITEMS: SidebarNavItem[] = PATIENT_NAV.map(({ path, key, icon }) => ({
  path,
  key,
  icon,
}));

/**
 * Desktop patient sidebar (hidden on mobile, where the bottom tab bar takes
 * over). Holds the collapse toggle and the shared `SidebarNav`. Account
 * switching and logout live in the navbar control (`PatientProfileSwitcher`),
 * not here.
 */
export function PatientSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative hidden lg:flex flex-col h-full bg-white border-e border-gray-100 rounded-2xl transition-[width] duration-200 ease-in-out shrink-0",
        collapsed ? "w-15" : "w-55",
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className={cn(
          "text-gray-400 hover:text-brand-primary transition-colors shrink-0 rounded-md p-0.5 mr-2 mt-2",
          collapsed ? "mx-auto" : "ms-auto",
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <PanelLeftClose className="size-4" />
        )}
      </button>

      {/* Main nav */}
      <SidebarNav
        items={NAV_ITEMS}
        collapsed={collapsed}
        dashboardPath={patientHref}
      />
    </aside>
  );
}
