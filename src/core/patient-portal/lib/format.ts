/** Small locale-aware formatting helpers for the patient portal. */

export function formatDate(iso: string | undefined, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Split a date for the timeline date rail: "14 Jun" over "2026". Falls back to
 * the raw string (in `dayMonth`) when the input can't be parsed.
 */
export function formatDateParts(
  iso: string | undefined,
  locale: string,
): { dayMonth: string; year: string } {
  if (!iso) return { dayMonth: "—", year: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { dayMonth: iso, year: "" };
  const dayMonth = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(d);
  const year = new Intl.DateTimeFormat(locale, { year: "numeric" }).format(d);
  return { dayMonth, year };
}

export function formatDayMonth(
  iso: string | undefined,
  locale: string,
): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

/** Locale-aware relative time, e.g. "2 hours ago" / "just now". */
export function formatRelative(
  iso: string | undefined,
  locale: string,
): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (abs < 60) return rtf.format(Math.round(diffSec), "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), "day");
  return formatDate(iso, locale);
}

export function ageFromDob(
  iso: string | undefined,
): number | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}
