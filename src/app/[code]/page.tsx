"use client";

import { useEffect, useRef, useState, use, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  ArrowRight,
  User,
  Volume2,
  ChevronLeft,
  Maximize2,
  Minimize2,
  RefreshCw,
  FlipHorizontal,
  SwitchCamera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CopyCode } from "@/components/motion/copy-code";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserSettings } from "@/lib/user-settings";
import { toast } from "sonner";

interface PreJoinPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function PreJoinPage({ params }: PreJoinPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code.toUpperCase();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Load defaults from cached user settings (Privacy & Safety Defaults)
  const userSettings = getCachedUserSettings();

  const [displayName, setDisplayName] = useState(userSettings.displayName || "");
  const [isVideoEnabled, setIsVideoEnabled] = useState(!userSettings.autoCameraOffOnJoin);
  const [isAudioEnabled, setIsAudioEnabled] = useState(!userSettings.autoMuteOnJoin);
  const [audioLevel, setAudioLevel] = useState(0);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>(userSettings.preferredCameraId || "");
  const [selectedAudioId, setSelectedAudioId] = useState<string>(userSettings.preferredMicId || "");

  // Camera direction & orientation controls
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isMirrored, setIsMirrored] = useState(userSettings.mirrorVideo !== false);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [fitMode, setFitMode] = useState<"contain" | "cover">("contain");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize display name from auth or guest params
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.display_name) {
        setDisplayName(data.user.user_metadata.display_name);
      } else if (data.user?.email) {
        setDisplayName(data.user.email.split("@")[0]);
      } else {
        const guestName =
          searchParams.get("name") ||
          (typeof window !== "undefined"
            ? sessionStorage.getItem("nilaa_guest_name")
            : "");
        if (guestName) setDisplayName(guestName);
      }
    });
  }, [searchParams]);

  // Audio level meter setup
  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;

      const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (e) {
      console.warn("Audio analyser error:", e);
    }
  }, []);

  // Request or update local media devices
  const startPreview = useCallback(async (opts?: {
    video?: boolean;
    audio?: boolean;
    deviceId?: string;
    facing?: "user" | "environment";
  }) => {
    const wantVideo = opts?.video !== undefined ? opts.video : isVideoEnabled;
    const wantAudio = opts?.audio !== undefined ? opts.audio : isAudioEnabled;
    const targetFacing = opts?.facing || facingMode;

    try {
      // Build constraints
      const videoConstraints: MediaTrackConstraints | boolean = wantVideo
        ? opts?.deviceId
          ? { deviceId: { exact: opts.deviceId } }
          : { facingMode: targetFacing, width: { ideal: 1280 }, height: { ideal: 720 } }
        : false;

      const audioConstraints: MediaTrackConstraints | boolean = wantAudio
        ? selectedAudioId
          ? { deviceId: { exact: selectedAudioId } }
          : true
        : false;

      // Stop existing tracks before requesting new stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      // If neither video nor audio is requested, clear preview stream
      if (!wantVideo && !wantAudio) {
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setAudioLevel(0);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Setup audio analyzer if audio track present
      if (stream.getAudioTracks().length > 0) {
        setupAudioAnalyser(stream);
      } else {
        setAudioLevel(0);
      }

      // Enumerate available devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vDevices = devices.filter((d) => d.kind === "videoinput");
        const aDevices = devices.filter((d) => d.kind === "audioinput");
        setVideoDevices(vDevices);
        setAudioDevices(aDevices);

        if (!selectedVideoId && vDevices[0]) setSelectedVideoId(vDevices[0].deviceId);
        if (!selectedAudioId && aDevices[0]) setSelectedAudioId(aDevices[0].deviceId);
      } catch {
        // Enumerate may fail on restricted platforms
      }
    } catch (err) {
      console.warn("Media device request error:", err);
      // If combined request failed, try audio only if wanted
      if (wantAudio && wantVideo) {
        try {
          const aStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          streamRef.current = aStream;
          setupAudioAnalyser(aStream);
          setHasPermission(true);
        } catch {
          setHasPermission(false);
        }
      } else {
        setHasPermission(false);
      }
    }
  }, [facingMode, isAudioEnabled, isVideoEnabled, selectedAudioId, selectedVideoId, setupAudioAnalyser]);

  // Initial preview on mount
  useEffect(() => {
    let active = true;

    if (active) {
      startPreview({ video: isVideoEnabled, audio: isAudioEnabled });
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []); // Run on initial mount

  // Toggle Video - 100% reliable click response
  const toggleVideo = async () => {
    const nextState = !isVideoEnabled;
    setIsVideoEnabled(nextState);

    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = nextState;
        if (nextState && videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
        return;
      }
    }

    // If no existing track, re-acquire with target state
    if (nextState) {
      await startPreview({ video: true });
    }
  };

  // Toggle Audio - 100% reliable click response
  const toggleAudio = async () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);

    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = nextState;
        if (!nextState) setAudioLevel(0);
        return;
      }
    }

    // If no existing audio track, re-acquire
    if (nextState) {
      await startPreview({ audio: true });
    }
  };

  // Flip Camera (Front <-> Back on mobile / device switcher)
  const flipCamera = async () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    // When back camera is selected, default to unmirrored. When front is selected, mirror it.
    setIsMirrored(nextFacing === "user");

    toast(`Switched to ${nextFacing === "user" ? "Front (Selfie)" : "Back"} camera`);
    await startPreview({ facing: nextFacing, video: true });
  };

  // Manual mirror toggle (fixes inverted direction / contrast on mobile)
  const toggleMirror = () => {
    setIsMirrored((prev) => {
      const next = !prev;
      toast(next ? "Camera view mirrored" : "Camera view unmirrored");
      return next;
    });
  };

  const handleJoinMeeting = () => {
    if (!displayName.trim()) {
      toast.error("Please enter your name to join");
      return;
    }

    setIsJoining(true);

    // Stop preview stream cleanly so meeting room LiveKit can take over
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    // Save preferences in sessionStorage
    sessionStorage.setItem("nilaa_user_name", displayName.trim());
    sessionStorage.setItem("nilaa_video_enabled", String(isVideoEnabled));
    sessionStorage.setItem("nilaa_audio_enabled", String(isAudioEnabled));
    sessionStorage.setItem("nilaa_mirror_enabled", String(isMirrored));

    // Route to meeting room with exact query params
    router.push(
      `/${code}/room?video=${isVideoEnabled}&audio=${isAudioEnabled}&name=${encodeURIComponent(
        displayName.trim()
      )}`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full mb-6">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full overflow-hidden flex items-center justify-center">
              <Image src="/nilaa-logo.jpg" alt="Nilaa" width={24} height={24} className="object-cover" />
            </div>
            <span>Home</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">Room Code:</span>
          <CopyCode code={code} />
        </div>
      </div>

      {/* Main Pre-Join Container */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center flex-1">
        {/* Left: Camera Preview (rounded-[24px]) */}
        <div className="lg:col-span-7 flex flex-col items-center w-full">
          <div className="relative w-full aspect-video rounded-[24px] overflow-hidden bg-slate-200 border border-slate-200 shadow-xl flex items-center justify-center">
            {/* Live Video Preview with dynamic orientation/mirroring */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full ${
                fitMode === "contain" ? "object-contain" : "object-cover"
              } transition-all duration-200 ${
                isMirrored ? "-scale-x-100" : "scale-x-100"
              } ${
                isVideoEnabled && hasPermission ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            />

            {/* Video Action Toolbar (Top Right: Fit Toggle, Flip Camera, Mirror View) */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
              {/* Flip Camera button (Front / Back switch for mobile & tablet) */}
              <button
                type="button"
                onClick={flipCamera}
                className="h-9 w-9 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-700 flex items-center justify-center backdrop-blur-md transition-all shadow-sm active:scale-95"
                title={`Switch camera (Currently: ${facingMode === "user" ? "Front" : "Back"})`}
                aria-label="Flip camera front or back"
              >
                <SwitchCamera className="h-4 w-4 text-blue-600" />
              </button>

              {/* Mirror View toggle (Fixes inverted / opposite direction on mobile) */}
              <button
                type="button"
                onClick={toggleMirror}
                className="h-9 w-9 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-700 flex items-center justify-center backdrop-blur-md transition-all shadow-sm active:scale-95"
                title={isMirrored ? "Disable mirror view" : "Enable mirror view"}
                aria-label="Toggle camera mirror view"
              >
                <FlipHorizontal className={`h-4 w-4 ${isMirrored ? "text-blue-600" : "text-slate-400"}`} />
              </button>

              {/* Fit / Fill Toggle */}
              <button
                type="button"
                onClick={() =>
                  setFitMode((prev) => (prev === "contain" ? "cover" : "contain"))
                }
                className="h-9 w-9 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-700 flex items-center justify-center backdrop-blur-md transition-all shadow-sm active:scale-95"
                title={
                  fitMode === "contain"
                    ? "Crop to fill box"
                    : "Fit whole video in box"
                }
                aria-label="Toggle camera fit mode"
              >
                {fitMode === "contain" ? (
                  <Maximize2 className="h-4 w-4 text-blue-600" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Camera Off / Permission Overlay */}
            {(!isVideoEnabled || !hasPermission) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-500 gap-3 select-none">
                <div className="h-20 w-20 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-heading text-2xl font-bold shadow-sm">
                  {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
                </div>
                <p className="text-xs sm:text-sm font-medium">
                  {!hasPermission
                    ? "Camera permission needed or disabled"
                    : "Camera is turned off"}
                </p>
                {!hasPermission && (
                  <button
                    onClick={() => startPreview({ video: true, audio: true })}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retry Camera Access
                  </button>
                )}
              </div>
            )}

            {/* In-Preview Quick Toggle Controls (Bottom Center - Generous Touch Targets) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-xl z-20">
              <button
                type="button"
                onClick={toggleAudio}
                title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm ${
                  isAudioEnabled ? "bg-slate-100 text-slate-800 hover:bg-slate-200" : "bg-red-500 text-white"
                }`}
              >
                {isAudioEnabled ? <Mic className="h-5 w-5 text-blue-600" /> : <MicOff className="h-5 w-5" />}
              </button>

              <button
                type="button"
                onClick={toggleVideo}
                title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm ${
                  isVideoEnabled ? "bg-slate-100 text-slate-800 hover:bg-slate-200" : "bg-red-500 text-white"
                }`}
              >
                {isVideoEnabled ? <Video className="h-5 w-5 text-blue-600" /> : <VideoOff className="h-5 w-5" />}
              </button>
            </div>

            {/* Mic Audio Level Indicator Pill (Top Left) */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-xs z-10 shadow-xs">
              <Volume2 className="h-3.5 w-3.5 text-blue-600" />
              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-75"
                  style={{
                    width: isAudioEnabled ? `${Math.min(100, audioLevel * 1.5)}%` : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Meeting Join Settings Card */}
        <div className="lg:col-span-5 w-full">
          <Card className="p-6 sm:p-8 bg-white border-slate-200 rounded-2xl shadow-soft-card space-y-6">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Ready to join?
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Check your audio, video, and display name before entering.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Your Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Device Selectors */}
              {videoDevices.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Camera Device
                  </label>
                  <select
                    value={selectedVideoId}
                    onChange={(e) => {
                      setSelectedVideoId(e.target.value);
                      startPreview({ deviceId: e.target.value, video: isVideoEnabled });
                    }}
                    className="w-full h-10 rounded-xl bg-slate-50 border border-slate-200 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {videoDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {audioDevices.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Microphone Device
                  </label>
                  <select
                    value={selectedAudioId}
                    onChange={(e) => setSelectedAudioId(e.target.value)}
                    className="w-full h-10 rounded-xl bg-slate-50 border border-slate-200 px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {audioDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleJoinMeeting}
                  disabled={isJoining || !displayName.trim()}
                  className="w-full h-13 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  <span>{isJoining ? "Entering Call..." : "Join Now"}</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="text-center text-xs text-slate-400 py-4">
        <span>Nilaa RTC • Real-time video conferencing • Room {code}</span>
      </div>
    </div>
  );
}
