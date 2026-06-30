export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-semibold">You're offline</h1>
      <p className="text-sm text-gray-600">
        Cradlen needs a connection to load your health information. Reconnect and try again.
      </p>
      <hr className="my-2 w-24 border-gray-200" />
      <h2 className="text-xl font-semibold" dir="rtl" lang="ar">
        أنت غير متصل بالإنترنت
      </h2>
      <p className="text-sm text-gray-600" dir="rtl" lang="ar">
        يحتاج Cradlen إلى اتصال لعرض معلوماتك الصحية. أعد الاتصال وحاول مرة أخرى.
      </p>
    </main>
  );
}
