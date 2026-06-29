import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { SidebarNav, type SidebarNavItem } from "./SidebarNav";
import { PATIENT_NAV, patientHref } from "./patient-nav";

const mocks = vi.hoisted(() => ({ pathname: "/patient" }));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mocks.pathname,
  Link: ({
    children,
    href,
    className,
    title,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    title?: string;
  }) => (
    <a href={href} className={className} title={title}>
      {children}
    </a>
  ),
}));

const items: SidebarNavItem[] = PATIENT_NAV.map(({ path, key, icon }) => ({
  path,
  key,
  icon,
}));

function renderNav(pathname: string, locale: "en" | "ar" = "en") {
  mocks.pathname = pathname;
  return renderWithProviders(
    <SidebarNav items={items} collapsed={false} dashboardPath={patientHref} />,
    { locale },
  );
}

describe("SidebarNav", () => {
  it("renders a link per nav item with translated labels", () => {
    renderNav("/patient");
    for (const label of ["Home", "Record", "Visits", "Prescriptions", "Tests", "Profile"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("marks only the active route with the active style", () => {
    renderNav("/patient/visits");
    const active = screen.getByRole("link", { name: "Visits" });
    const inactive = screen.getByRole("link", { name: "Home" });
    expect(active.className).toContain("bg-brand-primary");
    expect(inactive.className).not.toContain("bg-brand-primary");
  });

  it("treats the empty-path Home item as active only on an exact match", () => {
    const first = renderNav("/patient/visits");
    expect(screen.getByRole("link", { name: "Home" }).className).not.toContain(
      "bg-brand-primary",
    );
    first.unmount();

    renderNav("/patient");
    expect(screen.getByRole("link", { name: "Home" }).className).toContain(
      "bg-brand-primary",
    );
  });

  it("swaps labels to Arabic under the ar locale", () => {
    renderNav("/patient", "ar");
    // The Home link should no longer carry the English label.
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBe(items.length);
  });
});
