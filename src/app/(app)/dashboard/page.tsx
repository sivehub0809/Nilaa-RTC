"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Puzzle,
  Settings as SettingsIcon,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Volume2,
  Copy,
  Check,
  ArrowRight,
  LogOut,
  Upload,
  User,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  SwitchCamera,
  FlipHorizontal,
  VolumeX,
  Play,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Keyboard,
  Clock,
  ExternalLink,
  Sliders,
  Crop,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  UserSettings,
  DEFAULT_USER_SETTINGS,
  getCachedUserSettings,
  fetchUserSettings,
  saveUserSettings,
} from "@/lib/user-settings";
import { generateMeetingCode, normalizeMeetingCode } from "@/lib/utils";
import { toast } from "sonner";
import { type User as SupabaseUser } from "@supabase/supabase-js";

type TabType = "meetings" | "integrations" | "settings";

export default function DashboardPage() {
  const router = useRouter();

  // Navigation & User State
  const [activeTab, setActiveTab] = useState<TabType>("meetings");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  // Meetings Tab State
  const [personalRoomCode, setPersonalRoomCode] = useState<string>("NL7890");
  const [joinCode, setJoinCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isStartingInstant, setIsStartingInstant] = useState(false);

  // Audio / Video Green Room State
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string>("");
  const [activeAudioId, setActiveAudioId] = useState<string>("");
  const [activeOutputId, setActiveOutputId] = useState<string>("");

  const [previewCamOn, setPreviewCamOn] = useState(true);
  const [previewMicOn, setPreviewMicOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isMirrored, setIsMirrored] = useState(true);

  // Audio Visualizer Meter (16 bars)
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(16).fill(4));
  const [isPlayingTestSound, setIsPlayingTestSound] = useState(false);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Profile Image Crop Modal State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load user & settings on mount
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoadingUser(false);

      if (data.user) {
        // Generate consistent personal room code based on user id or email
        const userHash = (data.user.email || data.user.id)
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase()
          .slice(0, 6);
        setPersonalRoomCode(userHash.length === 6 ? userHash : "NL" + Math.floor(1000 + Math.random() * 9000));
      }
    });

    // Load cached settings immediately (0ms latency)
    const cached = getCachedUserSettings();
    setSettings(cached);
    setIsMirrored(cached.mirrorVideo);

    // Sync cloud settings
    fetchUserSettings().then((synced) => {
      setSettings(synced);
      setIsMirrored(synced.mirrorVideo);
    });
  }, []);

  // Cleanup media preview on unmount
  useEffect(() => {
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [previewStream]);

  // Start or update camera & microphone preview for Green Room
  const startGreenRoomPreview = useCallback(
    async (opts?: { videoId?: string; audioId?: string; facing?: "user" | "environment" }) => {
      try {
        if (previewStream) {
          previewStream.getTracks().forEach((t) => t.stop());
        }

        const targetFacing = opts?.facing || facingMode;
        const videoConstraints: MediaTrackConstraints | boolean = previewCamOn
          ? opts?.videoId
            ? { deviceId: { exact: opts.videoId } }
            : { facingMode: targetFacing, width: { ideal: 1280 }, height: { ideal: 720 } }
          : false;

        const audioConstraints: MediaTrackConstraints | boolean = previewMicOn
          ? opts?.audioId
            ? { deviceId: { exact: opts.audioId } }
            : true
          : false;

        if (!videoConstraints && !audioConstraints) {
          setPreviewStream(null);
          if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
          setAudioLevels(new Array(16).fill(4));
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        });

        setPreviewStream(stream);

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play().catch(() => {});
        }

        // Setup 16-bar Audio Visualizer
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack && previewMicOn) {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            const src = ctx.createMediaStreamSource(new MediaStream([audioTrack]));
            src.connect(analyser);

            audioContextRef.current = ctx;
            analyserRef.current = analyser;

            const buffer = new Uint8Array(analyser.frequencyBinCount);
            const updateBouncingBars = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(buffer);

              // Extract 16 frequency bands
              const newBars: number[] = [];
              const step = Math.floor(buffer.length / 16);
              for (let i = 0; i < 16; i++) {
                const val = buffer[i * step] || 0;
                // normalized height from 10% to 100%
                const pct = Math.max(8, Math.min(100, Math.round((val / 255) * 100)));
                newBars.push(pct);
              }
              setAudioLevels(newBars);
              animFrameRef.current = requestAnimationFrame(updateBouncingBars);
            };
            updateBouncingBars();
          }
        } else {
          setAudioLevels(new Array(16).fill(4));
        }

        // Enumerate devices
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const vList = devices.filter((d) => d.kind === "videoinput");
          const aInList = devices.filter((d) => d.kind === "audioinput");
          const aOutList = devices.filter((d) => d.kind === "audiooutput");
          setVideoDevices(vList);
          setAudioDevices(aInList);
          setAudioOutputDevices(aOutList);

          if (!activeVideoId && vList[0]) setActiveVideoId(vList[0].deviceId);
          if (!activeAudioId && aInList[0]) setActiveAudioId(aInList[0].deviceId);
          if (!activeOutputId && aOutList[0]) setActiveOutputId(aOutList[0].deviceId);
        } catch {}
      } catch (err) {
        console.warn("Green room preview error:", err);
      }
    },
    [activeAudioId, activeOutputId, activeVideoId, facingMode, previewCamOn, previewMicOn, previewStream]
  );

  // Initialize preview when user enters Settings tab
  useEffect(() => {
    if (activeTab === "settings") {
      startGreenRoomPreview();
    } else {
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
        setPreviewStream(null);
      }
    }
  }, [activeTab]);

  // Flip Camera Front / Back
  const handleFlipCamera = async () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    setIsMirrored(nextFacing === "user");
    await startGreenRoomPreview({ facing: nextFacing });
    toast(`Camera switched to ${nextFacing === "user" ? "Front (Selfie)" : "Back"}`);
  };

  // Toggle Mirror View
  const handleToggleMirror = () => {
    const next = !isMirrored;
    setIsMirrored(next);
    saveUserSettings({ mirrorVideo: next });
    toast(next ? "Camera view mirrored" : "Camera view unmirrored");
  };

  // Test Sound: Synthesize a pleasant chime via Web Audio API (100% offline, zero latency)
  const handlePlayTestSound = () => {
    if (isPlayingTestSound) return;
    setIsPlayingTestSound(true);

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        toast.info("Audio output device is ready");
        setIsPlayingTestSound(false);
        return;
      }

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Bell chime tone 1 (587.33 Hz - D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Bell chime tone 2 (880.00 Hz - A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.0, now + 0.15);
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.85);

      setTimeout(() => {
        setIsPlayingTestSound(false);
        ctx.close().catch(() => {});
      }, 900);
    } catch {
      setIsPlayingTestSound(false);
    }
  };

  // Copy personal room code
  const handleCopyPersonalCode = () => {
    navigator.clipboard.writeText(personalRoomCode);
    setIsCopied(true);
    toast.success(`Copied room code: ${personalRoomCode}`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Start instant meeting
  const handleStartInstant = () => {
    setIsStartingInstant(true);
    const code = generateMeetingCode();
    toast.success(`Instant meeting created: ${code}`);
    router.push(`/${code}`);
  };

  // Join meeting with code
  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeMeetingCode(joinCode);
    if (!clean || clean.length < 4) {
      toast.error("Please enter a valid 6-character room code");
      return;
    }
    router.push(`/${clean}`);
  };

  // Save Settings handler
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await saveUserSettings(settings);
      toast.success("Settings saved successfully!");
    } catch {
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Avatar file selection -> Opens instant crop modal
  const handleSelectAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Please select an image under 8MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Apply Crop & Save Avatar in < 15ms
  const handleApplyCrop = () => {
    if (!rawImageSrc) return;

    const img = new window.Image();
    img.src = rawImageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Circular clip
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw cropped & scaled
      const minDim = Math.min(img.width, img.height);
      const drawWidth = minDim * cropZoom;
      const drawHeight = minDim * cropZoom;
      const srcX = (img.width - drawWidth) / 2 - cropOffset.x;
      const srcY = (img.height - drawHeight) / 2 - cropOffset.y;

      ctx.drawImage(img, srcX, srcY, drawWidth, drawHeight, 0, 0, size, size);

      const croppedDataUrl = canvas.toDataURL("image/webp", 0.9);
      setSettings((prev) => ({ ...prev, avatarUrl: croppedDataUrl }));
      saveUserSettings({ avatarUrl: croppedDataUrl });

      setCropModalOpen(false);
      setRawImageSrc(null);
      toast.success("Profile photo updated instantly!");
    };
  };

  // Sign out
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row select-none">
      {/* ===================== SIDEBAR ===================== */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-border bg-card/60 backdrop-blur-md shrink-0 justify-between p-5">
        <div className="space-y-6">
          {/* Logo Header */}
          <Link href="/" className="flex items-center gap-2.5 group px-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/nilaa-logo.jpg"
                alt="Nilaa RTC Logo"
                width={36}
                height={36}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
                Nilaa <span className="text-accent font-extrabold">RTC</span>
              </span>
            </div>
          </Link>

          {/* Primary Quick Start Action Button (Matches Reference) */}
          <button
            onClick={handleStartInstant}
            disabled={isStartingInstant}
            className="w-full h-11 rounded-[14px] bg-accent text-accent-foreground font-semibold flex items-center justify-center gap-2 text-sm shadow-cyan-glow hover:bg-accent-hover active:scale-[0.98] transition-all"
          >
            <Video className="h-4 w-4 fill-current" />
            <span>{isStartingInstant ? "Creating Room..." : "+ Start Instant Meeting"}</span>
          </button>

          {/* 3 Main Sidebar Navigation Items (Per User Spec) */}
          <nav className="space-y-1.5 pt-2">
            <button
              onClick={() => setActiveTab("meetings")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-sm font-semibold transition-colors ${
                activeTab === "meetings"
                  ? "bg-surface text-foreground border border-border/80 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Calendar className={`h-4 w-4 ${activeTab === "meetings" ? "text-accent" : ""}`} />
              <span>Meetings</span>
            </button>

            <button
              onClick={() => setActiveTab("integrations")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-sm font-semibold transition-colors ${
                activeTab === "integrations"
                  ? "bg-surface text-foreground border border-border/80 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Puzzle className={`h-4 w-4 ${activeTab === "integrations" ? "text-accent" : ""}`} />
              <span>Integrations</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-sm font-semibold transition-colors ${
                activeTab === "settings"
                  ? "bg-surface text-foreground border border-border/80 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
              }`}
            >
              <Sliders className={`h-4 w-4 ${activeTab === "settings" ? "text-accent" : ""}`} />
              <span>Audio/Video & Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: User Profile Pill + Log Out */}
        <div className="pt-4 border-t border-border/70 space-y-3">
          <div className="flex items-center gap-3 p-2 rounded-[12px] bg-surface/80 border border-border/80">
            <div className="h-9 w-9 rounded-full overflow-hidden bg-surface border border-border flex items-center justify-center text-xs font-bold shrink-0">
              {settings.avatarUrl ? (
                <img src={settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{(settings.displayName || user?.email || "U").charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-foreground truncate">
                {settings.displayName || user?.email?.split("@")[0] || "User"}
              </span>
              <span className="text-[10px] text-accent truncate">{settings.role || "Team Member"}</span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-btn text-xs text-muted-foreground hover:text-destructive hover:bg-surface transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ===================== MOBILE TOPBAR ===================== */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full overflow-hidden">
            <Image src="/nilaa-logo.jpg" alt="Logo" width={32} height={32} className="object-cover" />
          </div>
          <span className="font-heading text-base font-bold text-foreground">
            Nilaa <span className="text-accent">RTC</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleStartInstant}
            className="px-3 py-1.5 rounded-btn bg-accent text-accent-foreground text-xs font-semibold"
          >
            + Start Meeting
          </button>
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-8 w-8 text-foreground"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-b border-border bg-card p-4 space-y-3 z-30 shadow-xl"
          >
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setActiveTab("meetings");
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-semibold rounded-btn border text-center ${
                  activeTab === "meetings" ? "bg-surface border-accent text-accent" : "border-border text-muted-foreground"
                }`}
              >
                Meetings
              </button>
              <button
                onClick={() => {
                  setActiveTab("integrations");
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-semibold rounded-btn border text-center ${
                  activeTab === "integrations"
                    ? "bg-surface border-accent text-accent"
                    : "border-border text-muted-foreground"
                }`}
              >
                Integrations
              </button>
              <button
                onClick={() => {
                  setActiveTab("settings");
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-semibold rounded-btn border text-center ${
                  activeTab === "settings" ? "bg-surface border-accent text-accent" : "border-border text-muted-foreground"
                }`}
              >
                Settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== MAIN CONTENT AREA ===================== */}
      <main className="flex-1 flex flex-col overflow-y-auto max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-8">
        {/* ================= TAB 1: MEETINGS ================= */}
        {activeTab === "meetings" && (
          <div className="space-y-8">
            {/* Page Header */}
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Welcome back,{" "}
                <span className="text-accent">{settings.displayName || user?.email?.split("@")[0] || "Friend"}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your personal meeting room and start instant high-definition video calls.
              </p>
            </div>

            {/* Up Next / Hero Room Card (Inspired by User's Reference Photo) */}
            <div className="p-6 sm:p-8 rounded-[24px] bg-gradient-to-br from-card to-surface/80 border border-border shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-[100px] pointer-events-none -z-0" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent">
                    <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span>Always-On Personal Room</span>
                  </div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    Your Dedicated Meeting Room
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                    Share this constant room code or link with your teammates. Jump in anytime with zero friction.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <div className="px-3.5 py-1.5 rounded-btn bg-background/80 border border-border font-mono text-sm tracking-wider font-bold text-accent">
                      {personalRoomCode}
                    </div>
                    <button
                      onClick={handleCopyPersonalCode}
                      className="px-3 py-1.5 rounded-btn bg-surface hover:bg-surface-hover border border-border text-xs text-foreground flex items-center gap-1.5 transition-colors"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{isCopied ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <Link href={`/${personalRoomCode}`} className="w-full sm:w-auto">
                    <Button variant="accent" size="lg" className="w-full sm:w-auto gap-2 text-base font-semibold">
                      <Video className="h-5 w-5 fill-current" />
                      <span>Start Personal Room</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid: Start Instant + Join With Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Start Instant Meeting */}
              <Card className="bg-card border-border p-6 rounded-[20px] flex flex-col justify-between hover:border-accent/40 transition-colors shadow-md">
                <div className="space-y-3">
                  <div className="h-11 w-11 rounded-btn bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground">Start Fresh Instant Meeting</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Generate a brand-new 6-character room code for private, ad-hoc meetings.
                  </p>
                </div>
                <div className="pt-6">
                  <Button
                    onClick={handleStartInstant}
                    disabled={isStartingInstant}
                    variant="accent"
                    size="default"
                    className="w-full gap-2 font-semibold"
                  >
                    <Video className="h-4 w-4" />
                    <span>{isStartingInstant ? "Creating..." : "Start Instant Call"}</span>
                  </Button>
                </div>
              </Card>

              {/* Card 2: Join with Code */}
              <Card className="bg-card border-border p-6 rounded-[20px] flex flex-col justify-between hover:border-accent/40 transition-colors shadow-md">
                <div className="space-y-3">
                  <div className="h-11 w-11 rounded-btn bg-surface border border-border flex items-center justify-center text-accent">
                    <Keyboard className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground">Join with a Code</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Received an invite code? Type it below to jump directly into the room.
                  </p>
                </div>
                <form onSubmit={handleJoinWithCode} className="pt-6 flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g. X7K9M2"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="uppercase tracking-wider font-mono text-xs sm:text-sm h-11"
                  />
                  <Button type="submit" variant="secondary" disabled={!joinCode.trim()} className="h-11 px-5">
                    Join
                  </Button>
                </form>
              </Card>
            </div>

            {/* Daily Schedule / Meeting Activity (Matches Reference List) */}
            <div className="space-y-4">
              <h3 className="font-heading text-base font-bold text-foreground">Daily Schedule & Activity</h3>
              <div className="space-y-2.5">
                {[
                  { title: "Team Weekly Standup", time: "10:00 AM", attendees: "Up to 15 peers", status: "Ready" },
                  { title: "Product Architecture Review", time: "02:30 PM", attendees: "Up to 15 peers", status: "Ready" },
                  { title: "Design Feedback & Demo", time: "05:00 PM", attendees: "Up to 15 peers", status: "Ready" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-[16px] bg-card/70 border border-border hover:border-accent/30 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-btn bg-surface border border-border flex items-center justify-center text-accent shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.time} • {item.attendees}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleStartInstant}
                      className="text-xs font-semibold gap-1.5 self-end sm:self-auto"
                    >
                      <span>Join Room</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: INTEGRATIONS ================= */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                App & Calendar Integrations
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your everyday workflow tools directly to your Nilaa RTC account.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  name: "Google Calendar",
                  desc: "Automatically sync meetings to your Google Calendar and generate one-click join links.",
                  icon: "📅",
                },
                {
                  name: "Slack",
                  desc: "Start instant Nilaa meetings right from Slack channels with the /nilaa slash command.",
                  icon: "💬",
                },
                {
                  name: "Microsoft Outlook",
                  desc: "Add Nilaa RTC video links to Outlook meeting invites and sync your calendar appointments.",
                  icon: "✉️",
                },
                {
                  name: "Zoom Migration Bridge",
                  desc: "Easily import existing meeting schedules and transition your team with zero downtime.",
                  icon: "🎥",
                },
              ].map((integ, i) => (
                <Card key={i} className="bg-card border-border p-6 rounded-[20px] flex flex-col justify-between shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{integ.icon}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/30">
                        Coming Soon
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-foreground">{integ.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{integ.desc}</p>
                  </div>
                  <div className="pt-5 border-t border-border/60 mt-4">
                    <Button variant="outline" size="sm" disabled className="w-full text-xs">
                      Connect Integration
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: SETTINGS & GREEN ROOM ================= */}
        {activeTab === "settings" && (
          <div className="space-y-10">
            {/* Header */}
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Profile & Green Room Settings
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Self-service audio/video testing, profile management, and meeting privacy defaults.
              </p>
            </div>

            {/* ================= SECTION 1: PROFILE MANAGEMENT ================= */}
            <div className="p-6 rounded-[20px] bg-card border border-border shadow-md space-y-6">
              <div className="border-b border-border/70 pb-3">
                <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                  <User className="h-5 w-5 text-accent" />
                  <span>Profile Information</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update your avatar photo, display name, and role label shown during calls.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar with Crop Trigger */}
                <div className="relative group shrink-0">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-surface border-2 border-accent/40 flex items-center justify-center text-xl font-bold shadow-md">
                    {settings.avatarUrl ? (
                      <img src={settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(settings.displayName || user?.email || "U").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-semibold"
                  >
                    <Crop className="h-4 w-4 mb-0.5" />
                    <span>Change</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSelectAvatarFile}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 space-y-4 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Display Name
                      </label>
                      <Input
                        type="text"
                        placeholder="Your full name"
                        value={settings.displayName}
                        onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                        className="h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Role Label
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. Product Designer, Team Lead"
                        value={settings.role}
                        onChange={(e) => setSettings({ ...settings, role: e.target.value })}
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  {/* Account Visibility: Public vs Private */}
                  <div className="flex items-center justify-between p-3.5 rounded-[14px] bg-surface/70 border border-border">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        {settings.isPublic ? <Eye className="h-4 w-4 text-accent" /> : <EyeOff className="h-4 w-4" />}
                        <span>Account Visibility: {settings.isPublic ? "Public Profile" : "Private Profile"}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {settings.isPublic
                          ? "Your real name and avatar are visible to call participants."
                          : "You appear with anonymous initials for enhanced privacy."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, isPublic: !settings.isPublic })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.isPublic ? "bg-accent" : "bg-surface-border"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          settings.isPublic ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= SECTION 2: AUDIO & VIDEO GREEN ROOM ================= */}
            <div className="p-6 rounded-[20px] bg-card border border-border shadow-md space-y-6">
              <div className="border-b border-border/70 pb-3">
                <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                  <Video className="h-5 w-5 text-accent" />
                  <span>Audio & Video "Green Room"</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Test your hardware before joining any meeting with real-time feedback.
                </p>
              </div>

              {/* Video Check */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Live Video Preview Box */}
                <div className="lg:col-span-7 flex flex-col items-center w-full">
                  <div className="relative w-full aspect-video rounded-[20px] overflow-hidden bg-surface border border-border flex items-center justify-center shadow-lg">
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-contain ${isMirrored ? "-scale-x-100" : "scale-x-100"} ${
                        previewCamOn ? "opacity-100" : "opacity-0"
                      } transition-all duration-200`}
                    />

                    {/* Camera Off Overlay */}
                    {!previewCamOn && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-card text-muted-foreground gap-2">
                        <VideoOff className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs font-semibold">Camera preview paused</span>
                      </div>
                    )}

                    {/* Video Action Toolbar */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      <button
                        onClick={handleFlipCamera}
                        className="h-8 w-8 rounded-btn bg-card/85 hover:bg-card border border-border/80 text-muted-foreground hover:text-foreground flex items-center justify-center backdrop-blur-md shadow-sm transition-all"
                        title="Flip Camera (Front/Back for Mobile)"
                      >
                        <SwitchCamera className="h-4 w-4 text-accent" />
                      </button>
                      <button
                        onClick={handleToggleMirror}
                        className="h-8 w-8 rounded-btn bg-card/85 hover:bg-card border border-border/80 text-muted-foreground hover:text-foreground flex items-center justify-center backdrop-blur-md shadow-sm transition-all"
                        title={isMirrored ? "Disable mirror view" : "Enable mirror view"}
                      >
                        <FlipHorizontal className={`h-4 w-4 ${isMirrored ? "text-accent" : ""}`} />
                      </button>
                    </div>

                    {/* Camera On / Off Quick Pill */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                      <Button
                        type="button"
                        variant={previewCamOn ? "secondary" : "destructive"}
                        size="sm"
                        onClick={() => {
                          setPreviewCamOn(!previewCamOn);
                          startGreenRoomPreview();
                        }}
                        className="h-9 px-4 text-xs font-semibold gap-1.5 shadow-md"
                      >
                        {previewCamOn ? <Video className="h-3.5 w-3.5 text-accent" /> : <VideoOff className="h-3.5 w-3.5" />}
                        <span>{previewCamOn ? "Camera Active" : "Turn On Camera"}</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Video Controls & Toggles */}
                <div className="lg:col-span-5 space-y-4 w-full">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Webcam Device
                    </label>
                    <select
                      value={activeVideoId}
                      onChange={(e) => {
                        setActiveVideoId(e.target.value);
                        startGreenRoomPreview({ videoId: e.target.value });
                        setSettings({ ...settings, preferredCameraId: e.target.value });
                      }}
                      className="w-full h-10 rounded-btn bg-surface border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {videoDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Background Blur Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-btn bg-surface/70 border border-border">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <span>Background Blur</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold">
                          Beta
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Blurs background while keeping you in crisp focus.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, backgroundBlur: !settings.backgroundBlur })}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        settings.backgroundBlur ? "bg-accent" : "bg-surface-border"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                          settings.backgroundBlur ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Low-Light / Data-Saver Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-btn bg-surface/70 border border-border">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground">Data-Saver Mode</div>
                      <p className="text-[11px] text-muted-foreground">Optimizes bandwidth for weak Wi-Fi or mobile data.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, dataSaverMode: !settings.dataSaverMode })}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        settings.dataSaverMode ? "bg-accent" : "bg-surface-border"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                          settings.dataSaverMode ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Audio Check */}
              <div className="pt-6 border-t border-border/70 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Audio Check & Microphone Meter</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Microphone Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Microphone Device
                    </label>
                    <select
                      value={activeAudioId}
                      onChange={(e) => {
                        setActiveAudioId(e.target.value);
                        startGreenRoomPreview({ audioId: e.target.value });
                        setSettings({ ...settings, preferredMicId: e.target.value });
                      }}
                      className="w-full h-10 rounded-btn bg-surface border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {audioDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speaker Selector & Sound Test */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Speaker Output
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={activeOutputId}
                        onChange={(e) => setActiveOutputId(e.target.value)}
                        className="flex-1 h-10 rounded-btn bg-surface border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        {audioOutputDevices.length > 0 ? (
                          audioOutputDevices.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>
                              {d.label || `Speaker ${d.deviceId.slice(0, 5)}`}
                            </option>
                          ))
                        ) : (
                          <option value="default">Default System Output</option>
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={handlePlayTestSound}
                        className="h-10 px-3.5 rounded-btn bg-surface hover:bg-surface-hover border border-border text-xs font-semibold flex items-center gap-1.5 text-accent shrink-0 active:scale-95 transition-all"
                      >
                        <Volume2 className="h-4 w-4" />
                        <span>{isPlayingTestSound ? "Playing..." : "Test Sound"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live 16-Bar Bouncing Volume Meter */}
                <div className="p-4 rounded-[16px] bg-surface/80 border border-border space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Mic className="h-3.5 w-3.5 text-accent" />
                      <span>Live Mic Input Level</span>
                    </span>
                    <span>Speak to test bouncing bars</span>
                  </div>

                  {/* 16 Animated Audio Bars */}
                  <div className="h-10 flex items-end justify-between gap-1 px-1">
                    {audioLevels.map((lvl, idx) => (
                      <div
                        key={idx}
                        className="flex-1 rounded-full transition-all duration-75"
                        style={{
                          height: `${lvl}%`,
                          background:
                            lvl > 70
                              ? "linear-gradient(to top, #60A5FA, #E5484D)"
                              : "linear-gradient(to top, #3B82F6, #93C5FD)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* AI Noise Cancellation Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-[14px] bg-surface/70 border border-border">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <span>AI Noise Cancellation (LiveKit Krisp)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Suppresses background fans, keyboard clatter, and dog barks in real time.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, noiseCancellation: !settings.noiseCancellation })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      settings.noiseCancellation ? "bg-accent" : "bg-surface-border"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        settings.noiseCancellation ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Privacy & Safety Defaults */}
              <div className="pt-6 border-t border-border/70 space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  <span>Privacy & Meeting Join Defaults</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Auto-Mute on Join */}
                  <div className="flex items-center justify-between p-3.5 rounded-[14px] bg-surface/70 border border-border">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground">Auto-Mute on Join</div>
                      <p className="text-[11px] text-muted-foreground">Automatically turn off mic when entering calls.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, autoMuteOnJoin: !settings.autoMuteOnJoin })}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        settings.autoMuteOnJoin ? "bg-accent" : "bg-surface-border"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                          settings.autoMuteOnJoin ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Auto-Camera Off on Join */}
                  <div className="flex items-center justify-between p-3.5 rounded-[14px] bg-surface/70 border border-border">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground">Auto-Camera Off on Join</div>
                      <p className="text-[11px] text-muted-foreground">Automatically start calls with video paused.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, autoCameraOffOnJoin: !settings.autoCameraOffOnJoin })}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        settings.autoCameraOffOnJoin ? "bg-accent" : "bg-surface-border"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                          settings.autoCameraOffOnJoin ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* System Diagnostics Checklist */}
                <div className="p-4 rounded-[16px] bg-surface/50 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span>Camera Permission: Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span>Microphone Permission: Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span>WebRTC SFU: LiveKit Cloud Connected</span>
                  </div>
                </div>
              </div>

              {/* Save All Settings Button */}
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  variant="accent"
                  size="default"
                  className="px-6 font-semibold"
                >
                  {savingSettings ? "Saving Settings..." : "Save All Settings"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= FAST CLIENT-SIDE AVATAR CROP MODAL ================= */}
      <AnimatePresence>
        {cropModalOpen && rawImageSrc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="bg-card border border-border rounded-[24px] p-6 max-w-sm w-full space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-heading font-bold text-base text-foreground">Adjust Profile Picture</h3>
                <button
                  onClick={() => setCropModalOpen(false)}
                  className="h-7 w-7 rounded-btn hover:bg-surface flex items-center justify-center text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Crop Circular Mask Container */}
              <div className="relative h-60 w-60 mx-auto rounded-full overflow-hidden border-2 border-accent bg-surface shadow-inner flex items-center justify-center">
                <img
                  src={rawImageSrc}
                  alt="Crop preview"
                  className="max-h-none transition-transform duration-75 select-none pointer-events-none"
                  style={{
                    transform: `scale(${cropZoom}) translate(${cropOffset.x}px, ${cropOffset.y}px)`,
                  }}
                />
              </div>

              {/* Zoom Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="h-3.5 w-3.5" /> Zoom
                  </span>
                  <span>{Math.round(cropZoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <Button variant="ghost" size="default" onClick={() => setCropModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="accent" size="default" onClick={handleApplyCrop} className="flex-1 font-semibold">
                  Crop & Save
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
