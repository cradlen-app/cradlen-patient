/** Shape of the JSON the backend PatientPushService sends in a push message. */
export type PushPayload = {
  title?: string;
  body?: string;
  navigate_to?: string | null;
  tag?: string;
};

/**
 * Pure mapping from a push payload to `showNotification` arguments. Extracted so
 * the branch logic (default title, null navigate_to) is unit-testable outside
 * the service-worker runtime.
 */
export function buildNotificationOptions(payload: PushPayload): {
  title: string;
  options: NotificationOptions;
} {
  return {
    title: payload.title || "Cradlen",
    options: {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag,
      data: { navigate_to: payload.navigate_to ?? null },
    },
  };
}
