"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

/** How long the "back online" confirmation stays up after reconnecting. */
const BACK_ONLINE_MS = 2000;

/**
 * A thin fixed status bar pinned to the top of the viewport. Shows a persistent
 * offline notice while the device is offline, and a brief "back online" flash on
 * reconnect. It never renders on first load when already online. This is a
 * *status indicator only* — it does not imply any data is cached offline.
 */
export function OfflineBar() {
  const isOnline = useOnlineStatus();
  const t = useTranslations("pwa");

  // Track the previous connectivity so we only flash "back online" on an actual
  // offline→online transition. Adjusting state during render on a changed value
  // is the endorsed React pattern (cheaper and safer than a syncing effect).
  const [prevOnline, setPrevOnline] = useState(isOnline);
  const [showBackOnline, setShowBackOnline] = useState(false);

  if (isOnline !== prevOnline) {
    setPrevOnline(isOnline);
    setShowBackOnline(isOnline);
  }

  useEffect(() => {
    if (!showBackOnline) return;
    const id = window.setTimeout(() => setShowBackOnline(false), BACK_ONLINE_MS);
    return () => window.clearTimeout(id);
  }, [showBackOnline]);

  if (isOnline && !showBackOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 top-0 z-[60] py-1.5 text-center text-xs font-medium text-white",
        isOnline ? "bg-brand-secondary" : "bg-brand-black",
      )}
    >
      {isOnline ? t("online.message") : t("offline.message")}
    </div>
  );
}
