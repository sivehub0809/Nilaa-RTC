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
  icons: {
    icon: "/nilaa-logo.jpg",
    apple: "/nilaa-logo.jpg",
    shortcut: "/nilaa-logo.jpg",
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
              try {
                if (typeof document !== 'undefined' && document.cookie) {
                  var cookies = document.cookie.split(';');
                  for (var i = 0; i < cookies.length; i++) {
                    var c = cookies[i].trim();
                    // Only clean up legacy bloated base64 data URLs, never valid Supabase auth session cookies
                    if (c.indexOf('data%3Aimage') !== -1 || c.indexOf('data:image') !== -1) {
                      var name = c.split('=')[0];
                      document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;';
                    }
                  }
                }
              } catch(e) {}
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
