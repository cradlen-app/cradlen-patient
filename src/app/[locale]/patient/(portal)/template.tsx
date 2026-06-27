import type { ReactNode } from "react";

/**
 * A `template` (not `layout`) re-mounts on every navigation within the portal,
 * so the page content replays this enter animation each time the route changes.
 * Pure CSS via tw-animate-css; disabled under reduced-motion.
 */
export default function PatientPortalTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-full w-full duration-300 animate-in fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none">
      {children}
    </div>
  );
}
