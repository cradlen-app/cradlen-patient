// The VAPID public key is inlined at build time. It is non-sensitive and must
// match the backend's VAPID_PUBLIC_KEY. When unset, push is treated as
// unsupported and the UI degrades gracefully (no "enable" affordance).
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * Web Push wants the application server key as raw bytes, not base64url. Backed
 * by an explicit ArrayBuffer so the result is `Uint8Array<ArrayBuffer>` (what
 * `applicationServerKey: BufferSource` expects), not the `ArrayBufferLike`
 * variant that includes SharedArrayBuffer.
 */
export function urlBase64ToUint8Array(
  base64String: string,
): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * True only when this browser can register a push subscription AND a VAPID key
 * is configured. iOS Safari exposes PushManager only in an installed
 * (standalone) app, so a non-installed iOS browser reports `false` here.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    VAPID_PUBLIC_KEY.length > 0
  );
}
