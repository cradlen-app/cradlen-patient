import type { Metadata, Viewport } from "next";

export const pwaMetadata: Metadata = {
  manifest: "/manifest.webmanifest",
  applicationName: "Cradlen",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cradlen",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const pwaViewport: Viewport = {
  themeColor: "#11604C",
  viewportFit: "cover",
};
