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
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col font-sans">
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#141821",
              border: "1px solid #232938",
              color: "#F2F4F8",
              fontFamily: "var(--font-geist-sans)",
            },
          }}
        />
      </body>
    </html>
  );
}
