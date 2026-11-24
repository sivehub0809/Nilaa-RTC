"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Video,
  VideoOff,
  Mic,
  Volume2,
  SwitchCamera,
  FlipHorizontal,
  Shield,
  Crop,
  ZoomIn,
  Sliders,
  Check,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  UserSettings,
  DEFAULT_USER_SETTINGS,
  getCachedUserSettings,
  fetchUserSettings,
  saveUserSettings,
} from "@/lib/user-settings";
import { compressRawImageFile, cropAvatarToBlob } from "@/lib/image-compression";
import { toast } from "sonner";

interface GreenRoomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export function GreenRoomDrawer({ isOpen, onClose, onProfileUpdated }: GreenRoomDrawerProps) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Video / Audio Hardware State
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeVideoId, setActiveVideoId] = useState("");
  const [activeAudioId, setActiveAudioId] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isMirrored, setIsMirrored] = useState(true);

  // Live Audio Bouncing Bars (16 bands)
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(16).fill(6));
  const [isPlayingChime, setIsPlayingChime] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Avatar Crop Modal State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load settings when drawer opens
  useEffect(() => {
    if (isOpen) {
      const cached = getCachedUserSettings();
      setSettings(cached);
      setIsMirrored(cached.mirrorVideo);
      startPreview();

      // Fetch fresh profile & settings from Supabase profiles table
      fetchUserSettings().then((fresh) => {
        setSettings(fresh);
        setIsMirrored(fresh.mirrorVideo);
      });

      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
      });
    } else {
      // Stop preview when drawer closes
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
        setPreviewStream(null);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      // Reset crop subview state so it can never be orphaned
      setCropModalOpen(false);
      setRawImageSrc(null);
      setCropZoom(1);
      setUploadingAvatar(false);
    }
  }, [isOpen]);

  // Start Hardware Preview
  const startPreview = useCallback(async (opts?: { videoId?: string; audioId?: string; facing?: "user" | "environment" }) => {
    try {
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
      }

      const targetFacing = opts?.facing || facingMode;
      const videoConstraints: MediaTrackConstraints = opts?.videoId
        ? { deviceId: { exact: opts.videoId } }
        : { facingMode: targetFacing, width: { ideal: 640 }, height: { ideal: 480 } };

      const audioConstraints: MediaTrackConstraints | boolean = opts?.audioId
        ? { deviceId: { exact: opts.audioId } }
        : true;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });

      setPreviewStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Audio Bouncing Visualizer
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
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
          const updateBars = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(buffer);

            const newBars: number[] = [];
            const step = Math.floor(buffer.length / 16);
            for (let i = 0; i < 16; i++) {
              const val = buffer[i * step] || 0;
              const pct = Math.max(8, Math.min(100, Math.round((val / 255) * 100)));
              newBars.push(pct);
            }
            setAudioLevels(newBars);
            animFrameRef.current = requestAnimationFrame(updateBars);
          };
          updateBars();
        }
      }

      // Enumerate devices
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const vList = devs.filter((d) => d.kind === "videoinput");
        const aList = devs.filter((d) => d.kind === "audioinput");
        setVideoDevices(vList);
        setAudioDevices(aList);
        if (!activeVideoId && vList[0]) setActiveVideoId(vList[0].deviceId);
        if (!activeAudioId && aList[0]) setActiveAudioId(aList[0].deviceId);
      } catch {}
    } catch (err) {
      console.warn("Hardware preview error:", err);
    }
  }, [activeAudioId, activeVideoId, facingMode, previewStream]);

  // Flip Camera Front / Back
  const handleFlipCamera = async () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    setIsMirrored(nextFacing === "user");
    await startPreview({ facing: nextFacing });
    toast(`Camera: ${nextFacing === "user" ? "Front (Selfie)" : "Back"}`);
  };

  // Toggle Mirror View
  const handleToggleMirror = () => {
    const next = !isMirrored;
    setIsMirrored(next);
    saveUserSettings({ mirrorVideo: next });
    toast(next ? "Camera view mirrored" : "Camera view unmirrored");
  };

  // Synthesize Test Sound Chime (Web Audio API)
  const handlePlayChime = () => {
    if (isPlayingChime) return;
    setIsPlayingChime(true);

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        setIsPlayingChime(false);
        return;
      }

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2: B5 (987.77 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.75);

      setTimeout(() => {
        setIsPlayingChime(false);
        ctx.close().catch(() => {});
      }, 800);
    } catch {
      setIsPlayingChime(false);
    }
  };

  // Select Avatar File -> Automatically downscale and compress any photo size -> Crop Modal
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPEG, PNG, or WebP)");
      return;
    }

    try {
      const toastId = toast.loading("Optimizing photo...");
      // Auto-compress large phone/DSLR images down to a fast ~1000px canvas preview
      const compressedDataUrl = await compressRawImageFile(file, 1200, 0.85);
      toast.dismiss(toastId);
      setRawImageSrc(compressedDataUrl);
      setCropZoom(1);
      setCropModalOpen(true);
    } catch (err) {
      console.warn("Image pre-compression failed, falling back to FileReader:", err);
      const reader = new FileReader();
      reader.onload = () => {
        setRawImageSrc(reader.result as string);
        setCropZoom(1);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    } finally {
      e.target.value = "";
    }
  };

  // Cancel crop subview
  const handleCancelCrop = () => {
    setCropModalOpen(false);
    setRawImageSrc(null);
    setCropZoom(1);
    setUploadingAvatar(false);
  };

  // Ultra-optimized circular crop (WebP 192x192, ~8KB to 15KB) + Cloud Storage Upload
  const handleSaveCrop = async () => {
    if (!rawImageSrc) return;

    setUploadingAvatar(true);
    try {
      // 1. Generate ultra-lightweight circular WebP avatar blob (< 15KB)
      const blob = await cropAvatarToBlob(rawImageSrc, cropZoom, 192, 0.85);

      // 2. Upload to Supabase Storage via our secure API route with auth token
      const formData = new FormData();
      formData.append("file", blob, "avatar.webp");
      if (settings.displayName) formData.append("displayName", settings.displayName);
      if (settings.role) formData.append("role", settings.role);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/avatar/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      let cloudAvatarUrl: string | null = null;
      if (res.ok) {
        const data = await res.json();
        cloudAvatarUrl = data.avatarUrl;
      }

      if (!cloudAvatarUrl) {
        // Fallback: convert compact blob to data URL so photo is always saved even if storage bucket is offline
        const fallbackDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        cloudAvatarUrl = fallbackDataUrl;
      }

      // 3. Immediately save and broadcast update with current settings intact
      const updatedSettings: UserSettings = {
        ...settings,
        avatarUrl: cloudAvatarUrl,
      };

      setSettings(updatedSettings);
      await saveUserSettings(updatedSettings);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("nilaa_profile_updated", { detail: updatedSettings })
        );
      }
      onProfileUpdated?.();

      setUploadingAvatar(false);
      setCropModalOpen(false);
      setRawImageSrc(null);
      setCropZoom(1);
      toast.success("Profile photo updated!");
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      // Fallback to local storage persistence
      try {
        const blob = await cropAvatarToBlob(rawImageSrc, cropZoom, 192, 0.85);
        const reader = new FileReader();
        reader.onloadend = async () => {
          const fallbackDataUrl = reader.result as string;
          const updatedSettings: UserSettings = {
            ...settings,
            avatarUrl: fallbackDataUrl,
          };
          setSettings(updatedSettings);
          await saveUserSettings(updatedSettings);
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("nilaa_profile_updated", { detail: updatedSettings })
            );
          }
          onProfileUpdated?.();
          setUploadingAvatar(false);
          setCropModalOpen(false);
          setRawImageSrc(null);
          setCropZoom(1);
          toast.success("Profile photo updated!");
        };
        reader.readAsDataURL(blob);
      } catch (fallbackErr) {
        toast.error("Failed to save profile photo. Please try again.");
        setUploadingAvatar(false);
      }
    }
  };

  // Save Settings
  const handleSave = async () => {
    setSaving(true);
    try {
      const latestCached = getCachedUserSettings();
      const merged: UserSettings = {
        ...settings,
        avatarUrl: settings.avatarUrl || latestCached.avatarUrl,
      };
      await saveUserSettings(merged);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("nilaa_profile_updated", { detail: merged })
        );
      }
      onProfileUpdated?.();
      toast.success("Settings saved!");
      onClose();
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[440px] bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* Main Content View */}
            <div className="flex-1 flex flex-col justify-between overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-sky-600" />
                  <h2 className="font-heading text-lg font-bold text-slate-900">
                    Settings & Green Room
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="h-9 w-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-5 space-y-6 flex-1">
                {/* Profile Card */}
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Your Profile
                  </span>

                  <div className="flex items-center gap-4">
                    <div className="relative group shrink-0">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-white border-2 border-sky-400 flex items-center justify-center text-lg font-bold shadow-sm">
                        {settings.avatarUrl ? (
                          <img src={settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sky-600">
                            {(settings.displayName || "U").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-semibold cursor-pointer"
                      >
                        <Crop className="h-4 w-4 mb-0.5" />
                        <span>Change</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer"
                        title="Change profile photo"
                      >
                        <Crop className="h-3 w-3" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700">Display Name</label>
                        <Input
                          type="text"
                          placeholder="Your name"
                          value={settings.displayName}
                          onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                          className="h-9 text-xs bg-white border-slate-200"
                        />
                        {userEmail && (
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-normal">
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{userEmail}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700">Role Label</label>
                        <Input
                          type="text"
                          placeholder="e.g. Product Designer"
                          value={settings.role}
                          onChange={(e) => setSettings({ ...settings, role: e.target.value })}
                          className="h-9 text-xs bg-white border-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Green Room Check */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Video Check
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleFlipCamera}
                      className="h-7 w-7 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shadow-xs"
                      title="Flip camera front/back"
                    >
                      <SwitchCamera className="h-3.5 w-3.5 text-blue-600" />
                    </button>
                    <button
                      onClick={handleToggleMirror}
                      className="h-7 w-7 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shadow-xs"
                      title={isMirrored ? "Disable mirror" : "Enable mirror"}
                    >
                      <FlipHorizontal className={`h-3.5 w-3.5 ${isMirrored ? "text-blue-600" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Camera Box */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-contain ${isMirrored ? "-scale-x-100" : "scale-x-100"}`}
                  />
                  {!previewStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <VideoOff className="h-6 w-6 mb-1" />
                      <span>Camera inactive</span>
                    </div>
                  )}
                </div>

                {/* Camera selector */}
                {videoDevices.length > 0 && (
                  <select
                    value={activeVideoId}
                    onChange={(e) => {
                      setActiveVideoId(e.target.value);
                      startPreview({ videoId: e.target.value });
                    }}
                    className="w-full h-9 rounded-xl bg-white border border-slate-200 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {videoDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Audio Green Room Check */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Audio Check
                  </span>
                  <button
                    onClick={handlePlayChime}
                    disabled={isPlayingChime}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-blue-600 flex items-center gap-1 shadow-xs"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>{isPlayingChime ? "Playing..." : "Test Sound"}</span>
                  </button>
                </div>

                {/* Bouncing 16-bar mic meter */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Mic className="h-3 w-3 text-blue-600" />
                      <span>Microphone Level</span>
                    </span>
                    <span>Speak to test</span>
                  </div>
                  <div className="h-7 flex items-end justify-between gap-1">
                    {audioLevels.map((lvl, idx) => (
                      <div
                        key={idx}
                        className="flex-1 rounded-full transition-all duration-75"
                        style={{
                          height: `${lvl}%`,
                          backgroundColor: lvl > 75 ? "#EF4444" : "#3B82F6",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Mic selector */}
                {audioDevices.length > 0 && (
                  <select
                    value={activeAudioId}
                    onChange={(e) => {
                      setActiveAudioId(e.target.value);
                      startPreview({ audioId: e.target.value });
                    }}
                    className="w-full h-9 rounded-xl bg-white border border-slate-200 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {audioDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Privacy & Safety Defaults */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Meeting Defaults
                </span>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-800">Auto-Mute on Join</span>
                    <input
                      type="checkbox"
                      checked={settings.autoMuteOnJoin}
                      onChange={(e) => setSettings({ ...settings, autoMuteOnJoin: e.target.checked })}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-800">Auto-Camera Off on Join</span>
                    <input
                      type="checkbox"
                      checked={settings.autoCameraOffOnJoin}
                      onChange={(e) => setSettings({ ...settings, autoCameraOffOnJoin: e.target.checked })}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-5 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex gap-3">
              <Button variant="ghost" onClick={onClose} className="flex-1 text-xs cursor-pointer">
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
              >
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>

          {/* Seamless In-Drawer Crop Subview Overlay */}
          <AnimatePresence>
            {cropModalOpen && rawImageSrc && (
              <motion.div
                key="crop-subview"
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 28 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute inset-0 z-30 bg-white flex flex-col justify-between"
              >
                {/* Subview Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelCrop}
                      className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Back to settings"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <h2 className="font-heading text-lg font-bold text-slate-900">
                      Adjust Profile Photo
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelCrop}
                    className="h-9 w-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Subview Body: Centered Crop Circle & Zoom */}
                <div className="p-6 flex-1 flex flex-col items-center justify-center space-y-6 overflow-y-auto">
                  {/* Circular Frame */}
                  <div className="relative h-48 w-48 sm:h-52 sm:w-52 rounded-full overflow-hidden border-2 border-sky-500 bg-slate-900 shadow-xl flex items-center justify-center ring-4 ring-sky-100 shrink-0">
                    <img
                      src={rawImageSrc}
                      alt="Crop preview"
                      className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-75"
                      style={{
                        transform: `scale(${cropZoom})`,
                        transformOrigin: "center center",
                      }}
                    />
                  </div>

                  {/* Zoom Slider */}
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1.5">
                        <ZoomIn className="h-3.5 w-3.5 text-sky-600" />
                        <span>Zoom</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {Math.round(cropZoom * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={cropZoom}
                      onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                      className="w-full accent-sky-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 text-center max-w-xs leading-relaxed">
                    Adjust zoom to frame your photo nicely inside the circle.
                  </p>
                </div>

                {/* Subview Footer Actions */}
                <div className="p-5 border-t border-slate-100 bg-white flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={handleCancelCrop}
                    disabled={uploadingAvatar}
                    className="flex-1 text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="accent"
                    onClick={handleSaveCrop}
                    disabled={uploadingAvatar}
                    className="flex-1 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
                  >
                    {uploadingAvatar ? (
                      <div className="flex items-center gap-1.5">
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      "Set Profile Photo"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
}
