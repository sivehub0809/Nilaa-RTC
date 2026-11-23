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
function WindowsIcon({ className = "h-4 w-4" }: { className?: string }) {
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
          icon: <WindowsIcon className="h-4 w-4 fill-white shrink-0" />,
          label: "Get for Windows",
        };
      case "mac":
        return {
          icon: <Apple className="h-4 w-4 shrink-0" />,
          label: "Get for Mac",
        };
      case "ios":
        return {
          icon: <Smartphone className="h-4 w-4 shrink-0" />,
          label: "Add to Home Screen",
        };
      case "android":
        return {
          icon: <Smartphone className="h-4 w-4 shrink-0" />,
          label: "Install Mobile App",
        };
      default:
        return {
          icon: <Download className="h-4 w-4 shrink-0" />,
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
          className={`h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer ${className}`}
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
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium transition-colors cursor-pointer ${className}`}
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

  // Primary Button: Exact visual replica of user's uploaded screenshot
  // Vivid blue gradient, rounded pill corners, white windows icon, soft shadow
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`group relative inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 hover:from-blue-700 hover:via-blue-600 hover:to-sky-600 active:scale-[0.98] text-white font-medium text-sm sm:text-base shadow-lg shadow-blue-500/25 border border-white/20 transition-all duration-200 cursor-pointer select-none ${className}`}
        aria-label={label}
      >
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
