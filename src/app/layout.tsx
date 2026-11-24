import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { CookieBanner } from "@/components/ui/cookie-banner";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Nilaa RTC - Fast & Clear Video Meetings",
  description:
    "Instant, high-definition video meetings with real-time reactions and crisp audio.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nilaa RTC",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.addEventListener('beforeinstallprompt', function(e) {
                  e.preventDefault();
                  window.__nilaa_deferred_prompt = e;
                });
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900">
        {children}
        <Toaster
          position="top-right"
          theme="light"
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              color: "#0F172A",
              fontFamily: "var(--font-geist-sans)",
              borderRadius: "14px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
            },
          }}
        />
        <CookieBanner />
      </body>
    </html>
  );
}
