"use client";

import { ChevronDown, FileText } from "lucide-react";
import { useTranslations } from "next-intl";

import { usePatientHistory } from "../hooks/usePortalData";
import type {
  ApiPortalHistoryEntry,
  ApiPortalHistoryGroup,
  ApiPortalHistorySection,
} from "../data/patient-history.api.types";
import { EmptyState } from "./portal-ui";

/**
 * Read-only patient history for the Record screen's History tab. The backend
 * delivers display-ready groups → sections → entries → rows, so this renderer
 * is fully generic: one collapsible `<details>` panel per section (collapsed by
 * default), extensible to future history types (cardiac, pediatric, …) with no
 * change — they simply arrive as additional groups.
 */
export function PatientHistory() {
  const t = useTranslations("patientPortal");
  const { data: groups, isLoading } = usePatientHistory();

  if (isLoading) {
    return (
      <section className="h-full overflow-y-auto rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="space-y-2">
          <SkeletonPanel />
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      </section>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <section className="flex h-full items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <EmptyState message={t("record.noHistory")} />
      </section>
    );
  }

  return (
    <section className="h-full space-y-3 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      {groups.map((group) => (
        <HistoryGroup
          key={group.code}
          group={group}
          expandLabel={t("record.expandAria")}
        />
      ))}
    </section>
  );
}

function HistoryGroup({
  group,
  expandLabel,
}: {
  group: ApiPortalHistoryGroup;
  expandLabel: string;
}) {
  return (
    <details className="group/history rounded-2xl border border-gray-100 [&_summary::-webkit-details-marker]:hidden">
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-4 py-3 hover:bg-gray-50"
        aria-label={`${expandLabel}: ${group.label}`}
      >
        <span className="flex items-center gap-2">
          <FileText className="size-4 text-brand-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-brand-black">
            {group.label}
          </span>
        </span>
        <ChevronDown
          className="size-4 flex-none text-gray-400 transition-transform group-open/history:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="space-y-2 px-3 pb-3 pt-1">
        {group.sections.map((section) => (
          <HistorySectionPanel
            key={section.code}
            section={section}
            expandLabel={expandLabel}
          />
        ))}
      </div>
    </details>
  );
}

function HistorySectionPanel({
  section,
  expandLabel,
}: {
  section: ApiPortalHistorySection;
  expandLabel: string;
}) {
  return (
    <details className="group/section rounded-xl border border-gray-100 [&_summary::-webkit-details-marker]:hidden">
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 hover:bg-gray-50"
        aria-label={`${expandLabel}: ${section.label}`}
      >
        <span className="text-xs font-semibold text-brand-black">
          {section.label}
        </span>
        <ChevronDown
          className="size-4 flex-none text-gray-400 transition-transform group-open/section:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="space-y-3 px-4 pb-4 pt-1">
        {section.entries.map((entry, index) => (
          <HistoryEntry key={index} entry={entry} />
        ))}
      </div>
    </details>
  );
}

function HistoryEntry({ entry }: { entry: ApiPortalHistoryEntry }) {
  return (
    <div className={entry.title ? "rounded-lg bg-gray-50 p-3" : undefined}>
      {entry.title && (
        <p className="mb-2 text-xs font-semibold text-brand-primary">
          {entry.title}
        </p>
      )}
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {entry.rows.map((row) => (
          <div key={row.label} className="flex flex-col">
            <dt className="text-[11px] font-medium text-gray-400">
              {row.label}
            </dt>
            <dd className="text-xs text-gray-700">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
      <span className="h-3.5 w-40 animate-pulse rounded bg-gray-200" />
      <span className="size-4 animate-pulse rounded bg-gray-200" />
    </div>
  );
}
