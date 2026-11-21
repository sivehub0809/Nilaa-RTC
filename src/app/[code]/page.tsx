"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  ArrowRight,
  User,
  Volume2,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CopyCode } from "@/components/motion/copy-code";
import { createClient } from "@/lib/supabase/client";
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

  const [displayName, setDisplayName] = useState("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [selectedAudioId, setSelectedAudioId] = useState<string>("");

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isJoining, setIsJoining] = useState(false);

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

  // Request media devices & start camera preview
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vDevices = devices.filter((d) => d.kind === "videoinput");
        const aDevices = devices.filter((d) => d.kind === "audioinput");

        setVideoDevices(vDevices);
        setAudioDevices(aDevices);

        if (vDevices[0]) setSelectedVideoId(vDevices[0].deviceId);
        if (aDevices[0]) setSelectedAudioId(aDevices[0].deviceId);

        // Audio Level Analyser
        setupAudioAnalyser(stream);
      } catch (err) {
        console.warn("Camera or microphone permission error:", err);
        setHasPermission(false);
      }
    }

    initMedia();

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
  }, []);

  const setupAudioAnalyser = (stream: MediaStream) => {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const handleJoinMeeting = () => {
    if (!displayName.trim()) {
      toast.error("Please enter your name to join");
      return;
    }

    setIsJoining(true);

    // Stop local preview tracks so meeting room can take over cleanly
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    // Save preferences in sessionStorage
    sessionStorage.setItem("nilaa_user_name", displayName.trim());
    sessionStorage.setItem("nilaa_video_enabled", String(isVideoEnabled));
    sessionStorage.setItem("nilaa_audio_enabled", String(isAudioEnabled));

    // Route to actual call room
    router.push(
      `/${code}/room?video=${isVideoEnabled}&audio=${isAudioEnabled}&name=${encodeURIComponent(
        displayName.trim()
      )}`
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full mb-6">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">Room Code:</span>
          <CopyCode code={code} />
        </div>
      </div>

      {/* Main Pre-Join Container */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
        {/* Left: Camera Preview (rounded-[24px]) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full aspect-video rounded-[24px] overflow-hidden bg-card border border-border shadow-2xl flex items-center justify-center">
            {/* Live Video Preview */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isVideoEnabled && hasPermission ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* Video Off Overlay */}
            {(!isVideoEnabled || !hasPermission) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card text-muted-foreground gap-3">
                <div className="h-20 w-20 rounded-full bg-surface border border-border flex items-center justify-center text-foreground font-heading text-2xl font-bold">
                  {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
                </div>
                <p className="text-xs sm:text-sm font-medium">
                  {!hasPermission
                    ? "Camera permission needed or disabled"
                    : "Camera is off"}
                </p>
              </div>
            )}

            {/* In-Preview Quick Toggle Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-card/85 backdrop-blur-md px-4 py-2 rounded-btn border border-border/80 shadow-lg">
              <Button
                type="button"
                variant={isAudioEnabled ? "secondary" : "destructive"}
                size="iconSm"
                onClick={toggleAudio}
                title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>

              <Button
                type="button"
                variant={isVideoEnabled ? "secondary" : "destructive"}
                size="iconSm"
                onClick={toggleVideo}
                title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
              >
                {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
            </div>

            {/* Mic Audio Level Indicator Pill (Top Left) */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-card/80 backdrop-blur-md px-3 py-1.5 rounded-btn border border-border text-xs">
              <Volume2 className="h-3.5 w-3.5 text-accent" />
              <div className="w-16 h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-75"
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
          <Card className="p-6 sm:p-8 bg-card border-border rounded-card shadow-xl space-y-6">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Ready to join?
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Check your audio and video before entering the call.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Your Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10 h-11 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Device Selectors */}
              {videoDevices.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">
                    Camera Source
                  </label>
                  <select
                    value={selectedVideoId}
                    onChange={(e) => setSelectedVideoId(e.target.value)}
                    className="w-full h-10 rounded-btn bg-surface border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
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
                  <label className="text-xs text-muted-foreground font-medium">
                    Microphone Source
                  </label>
                  <select
                    value={selectedAudioId}
                    onChange={(e) => setSelectedAudioId(e.target.value)}
                    className="w-full h-10 rounded-btn bg-surface border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {audioDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Button
                onClick={handleJoinMeeting}
                disabled={isJoining || !displayName.trim()}
                variant="accent"
                size="lg"
                className="w-full text-base font-semibold gap-2.5 h-12 mt-4"
              >
                <span>{isJoining ? "Entering Call..." : "Join Now"}</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="text-center text-xs text-muted-foreground py-4">
        <span>Nilaa RTC • Real-time communication • Room {code}</span>
      </div>
    </div>
  );
}
