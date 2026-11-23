"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "nilaa_cookie_consent";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      // Don't show if already accepted
      const consent = localStorage.getItem(CONSENT_KEY);
      if (consent) return;

      // Don't show if user is already signed in (they already use essential session cookies)
      const sessionBackup = localStorage.getItem("nilaa_session_backup");
      if (sessionBackup) {
        localStorage.setItem(CONSENT_KEY, "accepted");
        return;
      }

      // If document cookie already has consent
      if (document.cookie.includes("nilaa_cookie_consent=")) {
        localStorage.setItem(CONSENT_KEY, "accepted");
        return;
      }

      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    } catch {
      // Ignore private browsing restrictions
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      document.cookie = `nilaa_cookie_consent=accepted; Path=/; Max-Age=31536000; SameSite=Lax${isHttps ? "; Secure" : ""}`;
    } catch {}
    setShow(false);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
    } catch {}
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 select-none"
        >
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xl shadow-slate-900/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Cookie className="h-3.5 w-3.5" />
              </div>
              <p className="text-xs text-slate-700 font-normal truncate sm:whitespace-normal">
                We use cookies to keep you signed in.
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="accent"
                size="sm"
                onClick={handleAccept}
                className="h-8 px-3 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                <span>Accept</span>
              </Button>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Dismiss notice"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
