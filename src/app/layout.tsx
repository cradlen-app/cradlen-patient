import type { Metadata, Viewport } from "next";
import { Poppins, Cairo } from "next/font/google";
import { getLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/styles/globals.css";
import { pwaMetadata, pwaViewport } from "./pwa-metadata";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cradlen",
  description: "Cradlen",
  ...pwaMetadata,
};

export const viewport: Viewport = {
  ...pwaViewport,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${poppins.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden flex flex-col" suppressHydrationWarning>
        <div id="app-shell" className="contents">
          {children}
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
