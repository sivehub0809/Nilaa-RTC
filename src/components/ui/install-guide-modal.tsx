"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Check, Laptop, Smartphone, Share, PlusSquare, ArrowRight, Download } from "lucide-react";
import { PlatformType } from "@/lib/pwa-install";

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: PlatformType;
}

export function InstallGuideModal({ isOpen, onClose, platform }: InstallGuideModalProps) {
  if (!isOpen) return null;

  const isApple = platform === "ios" || platform === "mac";
  const isMobile = platform === "ios" || platform === "android";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                <Image
                  src="/dashboard-icon.png"
                  alt="Nilaa RTC"
                  width={38}
                  height={38}
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                  {platform === "windows"
                    ? "Install Nilaa RTC on Windows"
                    : isMobile
                    ? "Add Nilaa RTC to Home Screen"
                    : "Install Nilaa RTC"}
                </h3>
                <p className="text-xs text-slate-500 font-light">
                  Always opens to your meetings with saved account
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Platform Specific Step-by-Step Instructions */}
          <div className="py-5 space-y-3.5">
            {platform === "windows" && (
              <>
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100/80">
                  <span className="flex h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-semibold items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="text-xs text-slate-700 leading-relaxed font-normal">
                    Look at the <strong>right side of your address bar</strong> in Chrome, Brave, or Edge. You will see an <strong>Install icon (⊕)</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="flex h-6 w-6 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="text-xs text-slate-700 leading-relaxed font-normal">
                    Click <strong>Install</strong>. Nilaa RTC will be pinned to your <strong>Taskbar</strong> and <strong>Start Menu</strong> for instant one-click launch.
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 px-1 font-light">
                  Alternative: Click browser menu <strong>(⋮)</strong> &gt; <strong>Save and share</strong> &gt; <strong>Install Nilaa RTC</strong>.
                </div>
              </>
            )}

            {platform === "ios" && (
              <>
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100/80">
                  <span className="flex h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-semibold items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="text-xs text-slate-700 leading-relaxed font-normal flex items-center gap-1.5">
                    <span>Tap the <strong>Share</strong> button</span>
                    <Share className="h-3.5 w-3.5 text-blue-600 inline" />
                    <span>at the bottom of Safari.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="flex h-6 w-6 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="text-xs text-slate-700 leading-relaxed font-normal flex items-center gap-1.5">
                    <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
                    <PlusSquare className="h-3.5 w-3.5 text-slate-600 inline" />
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="flex h-6 w-6 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="text-xs text-slate-700 leading-relaxed font-normal">
                    Tap <strong>Add</strong> in the top right. Nilaa RTC will appear directly on your home screen like a native app.
                  </div>
                </div>
              </>
            )}

            {platform === "android" && (
              <>
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100/80">
                  <span className="flex h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-semibold items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="text-xs text-slate-700 leading-relaxed font-normal">
                    Tap the <strong>Menu (⋮)</strong> in Chrome or Brave top right.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="flex h-6 w-6 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="text-xs text-slate-700 leading-relaxed font-normal">
                    Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </div>
                </div>
              </>
            )}

            {(platform === "mac" || platform === "linux" || platform === "other") && (
              <>
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100/80">
                  <span className="flex h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-semibold items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="text-xs text-slate-700 leading-relaxed font-normal">
                    Click the <strong>Install icon (⊕)</strong> in your browser address bar.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="flex h-6 w-6 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="text-xs text-slate-700 leading-relaxed font-normal">
                    Click <strong>Install</strong> to add Nilaa RTC directly to your Dock or Applications folder.
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Benefits Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-light">
              ✓ Sub-second launch • Permanent login
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
