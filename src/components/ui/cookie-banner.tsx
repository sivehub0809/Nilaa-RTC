"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Check, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "nilaa_cookie_consent";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent) {
        // Small delay so page renders smoothly before the notice slides in
        const timer = setTimeout(() => setShow(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback for private mode without localStorage access
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
    } catch {}
    setShow(false);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "essential");
    } catch {}
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 select-none"
        >
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-slate-900/10 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Cookie className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900 tracking-tight">
                    Session & Cookie Preferences
                  </h4>
                  <p className="text-[11px] text-slate-500 font-light">
                    Keep your session saved and avoid repeated sign-ins
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 -mt-1"
                aria-label="Dismiss cookie notice"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 font-light leading-relaxed">
              We use essential cookies to keep your account securely logged in, remember your camera/microphone defaults, and keep your meeting rooms ready without asking you to sign in every time.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="accent"
                size="sm"
                onClick={handleAccept}
                className="flex-1 h-9 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Accept & Remember Me</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-9 px-3 rounded-xl text-xs font-light text-slate-500 hover:text-slate-800"
              >
                Essential Only
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
