import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
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
      </body>
    </html>
  );
}
