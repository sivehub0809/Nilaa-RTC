"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, Apple, Laptop, Check } from "lucide-react";
import { usePwaInstall } from "@/lib/pwa-install";
import { InstallGuideModal } from "@/components/ui/install-guide-modal";
import { toast } from "sonner";

interface InstallPwaButtonProps {
  className?: string;
  variant?: "primary" | "compact" | "nav";
}

/**
 * Windows Grid 4-square icon (Matching Microsoft Windows Logo design from user screenshot)
 */
function WindowsIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
    </svg>
  );
}

export function InstallPwaButton({ className = "", variant = "primary" }: InstallPwaButtonProps) {
  const { canPrompt, isInstalled, platform, promptInstall } = usePwaInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  // If already running inside installed standalone PWA, hide install button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await promptInstall();
    if (result === "accepted") {
      toast.success("Nilaa RTC installed! Launch it anytime from your desktop or home screen.");
    } else if (result === "manual") {
      setGuideOpen(true);
    }
  };

  // Dynamic button label & icon based on user's device
  const getButtonContent = () => {
    switch (platform) {
      case "windows":
        return {
          icon: <WindowsIcon className="h-3.5 w-3.5 fill-white shrink-0" />,
          label: "Get for Windows",
        };
      case "mac":
        return {
          icon: <Apple className="h-3.5 w-3.5 shrink-0" />,
          label: "Get for Mac",
        };
      case "ios":
        return {
          icon: <Smartphone className="h-3.5 w-3.5 shrink-0" />,
          label: "Add to Home Screen",
        };
      case "android":
        return {
          icon: <Smartphone className="h-3.5 w-3.5 shrink-0" />,
          label: "Install Mobile App",
        };
      default:
        return {
          icon: <Download className="h-3.5 w-3.5 shrink-0" />,
          label: "Install Nilaa RTC",
        };
    }
  };

  const { icon, label } = getButtonContent();

  if (variant === "nav") {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`relative h-9 px-3.5 rounded-xl backdrop-blur-md bg-gradient-to-r from-blue-600/90 via-blue-500/85 to-sky-500/85 hover:from-blue-600 hover:to-sky-600 text-white font-medium text-xs shadow-sm shadow-blue-600/20 border border-white/30 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${className}`}
          title="Install Nilaa RTC as Desktop App"
        >
          {icon}
          <span>{label}</span>
        </button>
        <InstallGuideModal
          isOpen={guideOpen}
          onClose={() => setGuideOpen(false)}
          platform={platform}
        />
      </>
    );
  }

  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-sm bg-blue-50/80 hover:bg-blue-100/90 text-blue-700 border border-blue-200/80 text-xs font-medium transition-colors cursor-pointer ${className}`}
        >
          {icon}
          <span>{label}</span>
        </button>
        <InstallGuideModal
          isOpen={guideOpen}
          onClose={() => setGuideOpen(false)}
          platform={platform}
        />
      </>
    );
  }

  // Primary Button: Compact glassy pill with subtle shimmer and soft shadow
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`group relative inline-flex items-center justify-center gap-2 px-4.5 py-2.5 sm:px-5 sm:py-2.5 rounded-[16px] backdrop-blur-md bg-gradient-to-r from-blue-600/85 via-blue-500/80 to-sky-500/80 hover:from-blue-600/95 hover:via-blue-500/90 hover:to-sky-500/90 active:scale-[0.98] text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-500/25 border border-white/35 transition-all duration-200 cursor-pointer select-none overflow-hidden ${className}`}
        aria-label={label}
      >
        {/* Subtle top edge specular glass line */}
        <span className="pointer-events-none absolute inset-x-3 top-0 h-[1px] bg-white/40" />

        <span className="flex items-center justify-center transition-transform group-hover:scale-105">
          {icon}
        </span>
        <span className="font-semibold tracking-tight">{label}</span>
      </button>

      <InstallGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        platform={platform}
      />
    </>
  );
}
