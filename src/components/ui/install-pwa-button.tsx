"use client";

import { useState } from "react";
import { Download, Smartphone, Apple } from "lucide-react";
import { usePwaInstall } from "@/lib/pwa-install";
import { InstallGuideModal } from "@/components/ui/install-guide-modal";
import { toast } from "sonner";

interface InstallPwaButtonProps {
  className?: string;
  variant?: "primary" | "compact" | "nav";
}

/**
 * Windows Grid 4-square icon (Crisp white squares)
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
  const { isInstalled, platform, promptInstall, markAsInstalled } = usePwaInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  // If already running inside installed standalone PWA, completely hide install UI
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await promptInstall();
    if (result === "accepted") {
      markAsInstalled();
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
          icon: <WindowsIcon className="h-3.5 w-3.5 fill-white shrink-0 drop-shadow-xs" />,
          label: "Get for Windows",
        };
      case "mac":
        return {
          icon: <Apple className="h-3.5 w-3.5 text-white shrink-0 drop-shadow-xs" />,
          label: "Get for Mac",
        };
      case "ios":
        return {
          icon: <Smartphone className="h-3.5 w-3.5 text-white shrink-0 drop-shadow-xs" />,
          label: "Add to Home Screen",
        };
      case "android":
        return {
          icon: <Smartphone className="h-3.5 w-3.5 text-white shrink-0 drop-shadow-xs" />,
          label: "Install Mobile App",
        };
      default:
        return {
          icon: <Download className="h-3.5 w-3.5 text-white shrink-0 drop-shadow-xs" />,
          label: "Install Nilaa RTC",
        };
    }
  };

  const { icon, label } = getButtonContent();

  if (variant === "nav") {
    return (
      <>
        {/* Liquid Glass Navbar Pill Button (Matches User Sketch & Image 2 / Image 3) */}
        <button
          type="button"
          onClick={handleInstallClick}
          className={`relative h-9 px-4 rounded-full backdrop-blur-xl bg-white/20 hover:bg-white/35 text-blue-600 hover:text-blue-700 font-sans font-medium text-xs sm:text-[13px] tracking-tight shadow-sm shadow-sky-950/5 border border-white/60 hover:border-white/90 flex items-center gap-2 active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden ${className}`}
          title="Install Nilaa RTC as Desktop App"
        >
          {/* Liquid Glass Specular Top Highlight */}
          <span className="pointer-events-none absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
          
          <span className="flex items-center justify-center p-0.5 rounded-xs bg-white/40 backdrop-blur-xs">
            {icon}
          </span>
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
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-xl bg-white/30 hover:bg-white/50 text-blue-600 border border-white/60 hover:border-white/90 font-sans text-xs font-medium shadow-xs transition-all cursor-pointer ${className}`}
        >
          <span className="flex items-center justify-center p-0.5 rounded-xs bg-white/40">
            {icon}
          </span>
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

  // Primary Button: Liquid Glass Pill Design matching user's Image 3
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`group relative inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full backdrop-blur-2xl bg-white/25 hover:bg-white/40 text-blue-600 hover:text-blue-700 font-sans font-medium text-xs sm:text-sm tracking-tight shadow-md shadow-sky-950/5 border border-white/60 hover:border-white/90 active:scale-[0.98] transition-all duration-200 cursor-pointer select-none overflow-hidden ${className}`}
        aria-label={label}
      >
        {/* Liquid Glass Top Edge Specular Highlight */}
        <span className="pointer-events-none absolute inset-x-3 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />

        <span className="flex items-center justify-center p-1 rounded-sm bg-blue-500/20 backdrop-blur-xs transition-transform group-hover:scale-105">
          {icon}
        </span>
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
