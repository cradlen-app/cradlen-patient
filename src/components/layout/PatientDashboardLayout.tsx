import type { ReactNode } from "react";

import { PatientNavbar } from "../common/PatientNavbar";
import { PatientSidebar } from "../common/PatientSidebar";
import { PatientBottomTabs } from "../common/PatientBottomTabs";
import Footer from "../common/Footer";

/**
 * App-shell layout for the patient portal. Mirrors `DashboardLayout` so the
 * patient experience matches the staff chrome: a top `PatientNavbar` + a
 * collapsible left `PatientSidebar` (desktop) with `Footer`, and a bottom tab
 * bar on mobile (where the sidebar is hidden).
 */
export function PatientDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <PatientNavbar />
      <div className="flex flex-1 overflow-hidden lg:pb-3">
        <PatientSidebar />
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 lg:pb-6">
          <div className="h-full w-full">{children}</div>
        </main>
      </div>
      <PatientBottomTabs />
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
