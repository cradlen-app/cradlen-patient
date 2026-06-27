"use client";

import type { ReactNode } from "react";
import { ChevronDown, MapPin } from "lucide-react";

import { cn } from "@/common/utils/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  AppointmentStatus,
  Clinic,
  DocumentStatus,
  LabOrderStatus,
} from "../types/patient-portal.types";

/** Card with an uppercase section title and optional trailing action. */
export function SectionCard({
  title,
  action,
  className,
  children,
}: {
  title?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && (
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * A {@link SectionCard} whose body collapses behind an uppercase title trigger
 * with a chevron that rotates when open. Used to stack the Visits page's
 * Upcoming / Last-visits timelines.
 */
export function CollapsibleCard({
  title,
  defaultOpen = false,
  action,
  className,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <CollapsibleTrigger className="group flex flex-1 items-center justify-between gap-2 text-start">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400">
            {title}
          </h2>
          <ChevronDown
            className="size-4 text-gray-400 transition-transform group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        {action}
      </div>
      <CollapsibleContent className="mt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Provenance pill showing which clinic an aggregated item came from. When `org`
 * is provided it reads "Organization · Branch"; otherwise just the branch name.
 */
export function ClinicTag({ clinic, org }: { clinic: Clinic; org?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-brand-secondary bg-brand-secondary/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-primary">
      <MapPin className="size-2.5" />
      {org ? `${org} · ${clinic.name}` : clinic.name}
    </span>
  );
}

type Tone = "green" | "amber" | "gray" | "brand";

const TONE: Record<Tone, string> = {
  green: "border-green-200 bg-green-50 text-green-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  gray: "border-gray-200 bg-gray-50 text-gray-600",
  brand: "border-brand-secondary bg-brand-secondary/10 text-brand-primary",
};

export function StatusBadge({
  label,
  tone = "gray",
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        TONE[tone],
      )}
    >
      {label}
    </span>
  );
}

export function labOrderTone(status: LabOrderStatus): Tone {
  switch (status) {
    case "result_ready":
    case "completed":
      return "green";
    case "pending_review":
      return "amber";
    default:
      return "gray";
  }
}

export function documentTone(status: DocumentStatus): Tone {
  return status === "reviewed" ? "green" : "amber";
}

export function appointmentTone(status: AppointmentStatus): Tone {
  switch (status) {
    case "upcoming":
      return "brand";
    case "cancelled":
      return "gray";
    default:
      return "green";
  }
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-6 text-center text-sm text-gray-400">{message}</p>
  );
}

/** Consistent page title for portal screens. */
export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-4">
      <h1 className="text-lg font-bold text-brand-black">{title}</h1>
      {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
    </header>
  );
}
