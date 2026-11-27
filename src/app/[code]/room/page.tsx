"use client";

import { useEffect, useState, use, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useDataChannel,
  useRoomContext,
  useSpeakingParticipants,
  useConnectionState,
} from "@livekit/components-react";
import {
  Track,
  ConnectionState,
  Room,
  RoomOptions,
  RoomConnectOptions,
  AudioPresets,
  VideoPresets,
  VideoQuality,
  ConnectionQuality,
  RoomEvent,
  RemoteTrackPublication,
} from "livekit-client";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Share2,
  Smile,
  Hand,
  MessageSquare,
  Users,
  PhoneOff,
  Menu,
  Crown,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Home,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  SwitchCamera,
  LogOut,
  PowerOff,
  AlertCircle,
  X,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyCode } from "@/components/motion/copy-code";
import { MeetingTimer } from "@/components/meeting/meeting-timer";
import { ReactionsOverlay, FloatingReaction } from "@/components/meeting/reactions-overlay";
import { ChatPanel, ChatMessage } from "@/components/meeting/chat-panel";
import { ParticipantsPanel, ParticipantItem } from "@/components/meeting/participants-panel";
import { MobileDrawer } from "@/components/meeting/mobile-drawer";
import { PresenceToast, PresenceNotification } from "@/components/meeting/presence-toast";
import { REACTION_EMOJIS } from "@/lib/constants";
import { normalizeMeetingCode } from "@/lib/utils";
import { CalmSpinner } from "@/components/ui/calm-spinner";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getCachedUserSettings, saveUserSettings } from "@/lib/user-settings";
import {
  NetworkHealthControl,
  NetworkSignalBars,
  NetworkMode,
} from "@/components/meeting/network-health";

interface RoomPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function MeetingRoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params);
  const code = normalizeMeetingCode(resolvedParams.code) || resolvedParams.code.toUpperCase();
  const searchParams = useSearchParams();
  const router = useRouter();

  const userName =
    searchParams.get("name") ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem("nilaa_user_name") || "Participant"
      : "Participant");

  const initialVideo = searchParams.get("video") !== "false";
  const initialAudio = searchParams.get("audio") !== "false";

  const [token, setToken] = useState<string>("");
  const [wsUrl, setWsUrl] = useState<string>("");
  const [loadingToken, setLoadingToken] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [disconnectReason, setDisconnectReason] = useState<string>("");

  const userInitiatedLeave = useRef(false);

  // Hardened LiveKit Room & Connection Options for Cambodian mobile & weak networks
  const { roomOptions, connectOptions } = useMemo(() => {
    const cached = getCachedUserSettings();
    const isDataSaver = !!cached.dataSaverMode;

    const options: RoomOptions = {
      adaptiveStream: true,
      dynacast: true,
      stopLocalTrackOnUnpublish: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        deviceId: cached.preferredMicId || undefined,
      },
      videoCaptureDefaults: {
        resolution: isDataSaver
          ? VideoPresets.h360.resolution
          : VideoPresets.h720.resolution,
        deviceId: cached.preferredCameraId || undefined,
      },
      publishDefaults: {
        dtx: true,
        red: true,
        audioPreset: AudioPresets.speech,
        simulcast: true,
        videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
        videoEncoding: isDataSaver
          ? VideoPresets.h360.encoding
          : VideoPresets.h720.encoding,
        degradationPreference: "maintain-framerate",
      },
      audioOutput: cached.preferredSpeakerId
        ? { deviceId: cached.preferredSpeakerId }
        : undefined,
    };

    const connectOpts: RoomConnectOptions = {
      autoSubscribe: true,
      subscriberAllowPause: true,
      peerConnectionTimeout: 20000,
    };

    return { roomOptions: options, connectOptions: connectOpts };
  }, []);

  const isHostParam =
    searchParams.get("host") === "1" ||
    (typeof window !== "undefined" &&
      sessionStorage.getItem(`nilaa_host_${code}`) === "1");

  // Fetch LiveKit room token from API
  useEffect(() => {
    let active = true;

    async function fetchToken() {
      setLoadingToken(true);
      setErrorMsg(null);
      setIsDisconnected(false);

      try {
        let headers: Record<string, string> = {};
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers["Authorization"] = `Bearer ${session.access_token}`;
          }
        } catch {}

        const res = await fetch(
          `/api/livekit/token?room=${encodeURIComponent(code)}&username=${encodeURIComponent(
            userName
          )}&isHost=${isHostParam ? "1" : "0"}`,
          { headers }
        );
        const data = await res.json();

        if (!active) return;

        if (!res.ok || data.error) {
          setErrorMsg(data.error || "Failed to connect to video server");
          setLoadingToken(false);
          return;
        }

        setToken(data.token);
        setWsUrl(data.wsUrl);
        setLoadingToken(false);
      } catch (err: unknown) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : "Network error";
        setErrorMsg(msg);
        setLoadingToken(false);
      }
    }

    fetchToken();

    return () => {
      active = false;
    };
  }, [code, userName, isHostParam]);

  if (loadingToken) {
    return (
      <div className="relative h-[100dvh] w-screen flex flex-col items-center justify-center p-6 text-white overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transform-gpu will-change-transform"
          style={{
            backgroundImage: "url('/meeting-bg.png')",
            backgroundColor: "#0B1528",
          }}
        />
        <div className="relative z-10 p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-sky-950/20 flex flex-col items-center justify-center gap-3.5 max-w-sm w-full text-center">
          <CalmSpinner size="lg" text="Entering meeting..." />
          <p className="text-xs text-sky-200/70 font-light mt-0.5">Connecting to room {code}</p>
        </div>
      </div>
    );
  }

  // If user disconnected or connection dropped
  if (isDisconnected && !userInitiatedLeave.current) {
    return (
      <div className="h-[100dvh] w-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-card border border-border rounded-card p-8 space-y-4 shadow-2xl">
          <div className="h-12 w-12 rounded-full bg-surface border border-border text-foreground flex items-center justify-center mx-auto">
            <RefreshCw className="h-6 w-6 text-accent" />
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Call Disconnected
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {disconnectReason || "The connection to the meeting room ended."}
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Button
              variant="accent"
              onClick={() => window.location.reload()}
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Rejoin Call
            </Button>
            <Link href="/" className="w-full">
              <Button variant="ghost" className="w-full text-xs gap-1.5">
                <Home className="h-3.5 w-3.5" />
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !token) {
    return (
      <div className="h-[100dvh] w-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-card border border-border rounded-card p-8 space-y-4 shadow-2xl">
          <div className="h-12 w-12 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Connection Notice
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {errorMsg || "Could not retrieve access token."}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="accent"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Retry Connection
            </Button>
            <Link href="/" className="w-full">
              <Button variant="ghost" className="w-full text-xs">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect={true}
      video={initialVideo}
      audio={initialAudio}
      options={roomOptions}
      connectOptions={connectOptions}
      data-lk-theme="default"
      className="h-[100dvh] w-screen bg-background overflow-hidden flex flex-col"
      onError={(err) => {
        console.warn("LiveKit connection/media event:", err);
        // Do not display false "Connection issue" for missing webcam/microphone hardware
        const isDeviceError =
          err.name === "NotFoundError" ||
          err.name === "OverconstrainedError" ||
          err.message?.toLowerCase().includes("device not found") ||
          err.message?.toLowerCase().includes("requested device") ||
          err.message?.toLowerCase().includes("devices not found");

        if (isDeviceError) {
          console.info("Hardware note: Camera or microphone device not detected.");
          return;
        }

        toast.error(`Connection notice: ${err.message}`);
      }}
      onDisconnected={(reason) => {
        if (!userInitiatedLeave.current) {
          setIsDisconnected(true);
          setDisconnectReason(reason ? `Disconnected (${reason})` : "Connection ended");
        }
      }}
    >
      <ConferenceRoom
        code={code}
        userName={userName}
        isHostProp={isHostParam}
        onLeave={() => {
          userInitiatedLeave.current = true;
        }}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

interface ConferenceRoomProps {
  code: string;
  userName: string;
  isHostProp?: boolean;
  onLeave: () => void;
}

function ConferenceRoom({ code, userName, isHostProp = false, onLeave }: ConferenceRoomProps) {
  const router = useRouter();
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const participants = useParticipants();
  const speakingParticipants = useSpeakingParticipants();

  // Check if current participant is host (creator or granted host)
  const isCurrentUserHost = useMemo(() => {
    if (isHostProp) return true;
    if (typeof window !== "undefined" && sessionStorage.getItem(`nilaa_host_${code}`) === "1") return true;
    try {
      const meta = localParticipant.metadata ? JSON.parse(localParticipant.metadata) : {};
      return !!meta.isHost;
    } catch {
      return false;
    }
  }, [isHostProp, localParticipant.metadata, code]);

  // Media & UI States
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [raisedHandParticipants, setRaisedHandParticipants] = useState<Record<string, boolean>>({});
  const [activePanel, setActivePanel] = useState<"chat" | "participants" | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isReactionMenuOpen, setIsReactionMenuOpen] = useState(false);

  // Network Health & Data Saver Engine State
  const [networkMode, setNetworkMode] = useState<NetworkMode>(() =>
    getCachedUserSettings().dataSaverMode ? "saver" : "auto"
  );
  const [localConnectionQuality, setLocalConnectionQuality] = useState<ConnectionQuality>(
    localParticipant.connectionQuality ?? ConnectionQuality.Unknown
  );

  // Apply Data Saver / Audio-Only policy to all remote camera subscriptions (keeps audio & screen share clear)
  const applyNetworkModeToRoom = useCallback(
    (mode: NetworkMode) => {
      if (!room) return;
      room.remoteParticipants.forEach((participant) => {
        participant.videoTrackPublications.forEach((pub) => {
          if (pub instanceof RemoteTrackPublication && pub.source === Track.Source.Camera) {
            if (mode === "audio-only") {
              pub.setEnabled(false);
            } else if (mode === "saver") {
              pub.setEnabled(true);
              pub.setVideoQuality(VideoQuality.LOW);
            } else {
              pub.setEnabled(true);
              pub.setVideoQuality(VideoQuality.HIGH);
            }
          }
        });
      });
    },
    [room]
  );

  useEffect(() => {
    applyNetworkModeToRoom(networkMode);
  }, [networkMode, applyNetworkModeToRoom]);

  useEffect(() => {
    if (!room) return;

    const handleQualityChanged = (quality: ConnectionQuality, participant: { isLocal: boolean }) => {
      if (participant.isLocal) {
        setLocalConnectionQuality(quality);
      }
    };

    const handleTrackSubscribed = () => {
      applyNetworkModeToRoom(networkMode);
    };

    room.on(RoomEvent.ConnectionQualityChanged, handleQualityChanged);
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);

    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, handleQualityChanged);
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    };
  }, [room, networkMode, applyNetworkModeToRoom]);

  const handleNetworkModeChange = (nextMode: NetworkMode) => {
    setNetworkMode(nextMode);
    saveUserSettings({ dataSaverMode: nextMode !== "auto" });

    if (nextMode === "audio-only") {
      toast("Audio-Only mode active — incoming cameras paused");
    } else if (nextMode === "saver") {
      toast("Data Saver active — low-bandwidth video");
    } else {
      toast("Auto (HD) video restored");
    }
  };

  // Leave Meeting & Eviction States
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isMeetingEndedByHost, setIsMeetingEndedByHost] = useState(false);
  const [isEndingMeeting, setIsEndingMeeting] = useState(false);

  // Speaker Spotlight State (Double-click or double-tap to focus)
  const [spotlightTileId, setSpotlightTileId] = useState<string | null>(null);
  const lastTapRef = useRef<{ [key: string]: number }>({});

  const handleTileDoubleAction = (tileId: string) => {
    setSpotlightTileId((prev) => (prev === tileId ? null : tileId));
  };

  const handleTileTouchEnd = (tileId: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[tileId] || 0;
    if (now - lastTap < 350) {
      handleTileDoubleAction(tileId);
      lastTapRef.current[tileId] = 0;
    } else {
      lastTapRef.current[tileId] = now;
    }
  };

  // Prevent browser pinch-to-zoom, Safari gesture zoom, wheel zoom, and keyboard zoom in workspace
  useEffect(() => {
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    const preventTouchZoom = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const preventKeyZoom = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("gestureend", preventGesture, { passive: false });
    document.addEventListener("touchmove", preventTouchZoom, { passive: false });
    window.addEventListener("wheel", preventWheelZoom, { passive: false });
    window.addEventListener("keydown", preventKeyZoom);

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchmove", preventTouchZoom);
      window.removeEventListener("wheel", preventWheelZoom);
      window.removeEventListener("keydown", preventKeyZoom);
    };
  }, []);

  // Mobile-compatible screen sharing handler
  const handleToggleScreenShare = async () => {
    try {
      if (!isScreenShareEnabled) {
        if (
          typeof navigator === "undefined" ||
          !navigator.mediaDevices ||
          typeof navigator.mediaDevices.getDisplayMedia !== "function"
        ) {
          toast.error("Screen sharing is not supported by your mobile browser. Please use Chrome or Safari.");
          return;
        }
        await localParticipant.setScreenShareEnabled(true);
        toast.success("Sharing screen");
      } else {
        await localParticipant.setScreenShareEnabled(false);
        toast("Screen sharing stopped");
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === "NotAllowedError" || error.name === "AbortError") {
        // User dismissed OS screen broadcast prompt
        return;
      }
      console.warn("Screen share error:", err);
      toast.error("Could not share screen on this device");
    }
  };

  // Video Fit Mode per tile
  const [fitModes, setFitModes] = useState<Record<string, "contain" | "cover">>({});

  // Local camera view mirroring (fixes inverted direction / contrast on mobile)
  const [isLocalMirrored, setIsLocalMirrored] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("nilaa_mirror_enabled");
      if (stored !== null) return stored === "true";
    }
    return true;
  });

  const toggleLocalMirror = () => {
    setIsLocalMirrored((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("nilaa_mirror_enabled", String(next));
      }
      toast(next ? "Self camera view mirrored" : "Self camera view unmirrored");
      return next;
    });
  };

  const handleFlipCamera = async () => {
    try {
      const devices = await Room.getLocalDevices("videoinput");
      if (devices && devices.length > 1) {
        const currentDeviceId = room.getActiveDevice("videoinput");
        const nextDevice = devices.find((d: MediaDeviceInfo) => d.deviceId !== currentDeviceId) || devices[0];
        await room.switchActiveDevice("videoinput", nextDevice.deviceId);
        toast(`Switched camera to: ${nextDevice.label || "Next Camera"}`);
      } else {
        toast("No additional camera detected on this device");
      }
    } catch (e) {
      console.warn("Switch camera error:", e);
      toast.error("Could not switch camera device");
    }
  };

  // Presence Notifications (join/leave popups)
  const [presenceNotifications, setPresenceNotifications] = useState<PresenceNotification[]>([]);
  const prevParticipantIds = useRef<Set<string>>(new Set());
  const isRoomStabilized = useRef(false);

  useEffect(() => {
    // Only track presence once the client is actively connected to the room
    if (connectionState !== ConnectionState.Connected) {
      isRoomStabilized.current = false;
      prevParticipantIds.current = new Set(participants.map((p) => p.identity));
      return;
    }

    const currentIds = new Set(participants.map((p) => p.identity));

    // Wait 2.5s after room connect before firing join/leave popups so existing roster stabilizes
    if (!isRoomStabilized.current) {
      prevParticipantIds.current = currentIds;
      const timer = setTimeout(() => {
        isRoomStabilized.current = true;
      }, 2500);
      return () => clearTimeout(timer);
    }

    const newNotifications: PresenceNotification[] = [];

    // Check who joined
    for (const p of participants) {
      if (!prevParticipantIds.current.has(p.identity) && !p.isLocal) {
        const joinName = p.name || p.identity;
        if (joinName && joinName.trim() && !joinName.startsWith("gst_") && !joinName.startsWith("usr_")) {
          newNotifications.push({
            id: `${p.identity}-joined-${Date.now()}`,
            name: joinName,
            type: "joined",
          });
        }
      }
    }

    // Check who left
    for (const prevId of prevParticipantIds.current) {
      if (!currentIds.has(prevId)) {
        const leftName = prevId.startsWith("usr_") || prevId.startsWith("gst_") ? "" : prevId.split("_")[0];
        if (leftName && leftName.trim()) {
          newNotifications.push({
            id: `${prevId}-left-${Date.now()}`,
            name: leftName,
            type: "left",
          });
        }
      }
    }

    prevParticipantIds.current = currentIds;

    if (newNotifications.length > 0) {
      setPresenceNotifications((prev) => [...prev, ...newNotifications]);

      // Auto-dismiss each notification after 2.5s
      newNotifications.forEach((n) => {
        setTimeout(() => {
          setPresenceNotifications((prev) => prev.filter((x) => x.id !== n.id));
        }, 2500);
      });
    }
  }, [participants, connectionState]);

  const toggleFitMode = (tileId: string) => {
    setFitModes((prev) => {
      const current = prev[tileId] || "contain";
      const next = current === "contain" ? "cover" : "contain";
      toast(next === "contain" ? "Fit to frame (no cropping)" : "Filled box (cropped edges)");
      return { ...prev, [tileId]: next };
    });
  };

  // Floating Reactions
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  // In-call Chat Messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sys-init",
      senderName: "System",
      message: `Connected to room ${code}. Real-time video & audio active.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // LiveKit Data Channel
  const { send } = useDataChannel((msg) => {
    try {
      const decoded = new TextDecoder().decode(msg.payload);
      const data = JSON.parse(decoded);

      if (data.type === "chat") {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id || Math.random().toString(),
            senderName: data.senderName,
            isGuest: !!data.isGuest,
            message: data.text,
            timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isSelf: false,
          },
        ]);
        if (activePanel !== "chat") {
          toast(`${data.senderName}: ${data.text.slice(0, 30)}`);
        }
      } else if (data.type === "reaction") {
        const newReaction: FloatingReaction = {
          id: Math.random().toString(),
          emoji: data.emoji,
          xOffset: Math.floor(15 + Math.random() * 70),
          senderName: data.senderName,
        };
        setReactions((prev) => [...prev, newReaction]);
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
        }, 3200);
      } else if (data.type === "hand_raise") {
        setRaisedHandParticipants((prev) => ({
          ...prev,
          [data.senderIdentity]: data.isRaised,
        }));
        if (data.isRaised) {
          toast(`${data.senderName} raised their hand ✋`);
        }
      } else if (data.type === "mute_request") {
        if (data.targetIdentity === localParticipant.identity) {
          localParticipant.setMicrophoneEnabled(false);
          toast("You were muted by the host");
        }
      } else if (data.type === "remove_request") {
        // Host CANNOT be kicked out by anyone!
        if (isCurrentUserHost) {
          console.warn("Rejected kick attempt: Local participant is the host.");
          return;
        }
        // Verify sender is host
        const sender = participants.find((p) => p.identity === data.senderIdentity);
        let isSenderHost = false;
        try {
          const meta = sender?.metadata ? JSON.parse(sender?.metadata || "{}") : {};
          isSenderHost = !!meta.isHost;
        } catch {}
        if (!isSenderHost) {
          console.warn("Rejected kick: Sender is not the meeting host.", data.senderIdentity);
          return;
        }
        if (data.targetIdentity === localParticipant.identity) {
          toast("You were removed from the call by the host");
          onLeave();
          room.disconnect();
          router.push("/");
        }
      } else if (data.type === "mute_all_request") {
        if (!isCurrentUserHost) {
          localParticipant.setMicrophoneEnabled(false);
          toast("You were muted by the host");
        }
      } else if (data.type === "meeting_ended_by_host" || data.type === "room_ended") {
        setIsMeetingEndedByHost(true);
        onLeave();
        room.disconnect();
      }
    } catch (e) {
      console.warn("Failed to parse data message:", e);
    }
  });

  // Track references for video tiles
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Broadcast emoji reaction
  const triggerReaction = useCallback(
    (emoji: string) => {
      const newReaction: FloatingReaction = {
        id: Math.random().toString(),
        emoji,
        xOffset: Math.floor(20 + Math.random() * 60),
        senderName: userName,
      };

      setReactions((prev) => [...prev, newReaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 3200);

      try {
        const payload = JSON.stringify({
          type: "reaction",
          emoji,
          senderName: userName,
        });
        send(new TextEncoder().encode(payload), { reliable: false });
      } catch (err) {
        console.warn("Could not broadcast reaction:", err);
      }

      setIsReactionMenuOpen(false);
    },
    [send, userName]
  );

  // Hand raise toggle
  const toggleHand = useCallback(() => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    setRaisedHandParticipants((prev) => ({
      ...prev,
      [localParticipant.identity]: next,
    }));

    try {
      const payload = JSON.stringify({
        type: "hand_raise",
        senderIdentity: localParticipant.identity,
        senderName: userName,
        isRaised: next,
      });
      send(new TextEncoder().encode(payload), { reliable: true });
    } catch (err) {
      console.warn("Could not broadcast hand raise:", err);
    }

    if (next) {
      triggerReaction("✋");
      toast("Hand raised");
    } else {
      toast("Hand lowered");
    }
  }, [isHandRaised, localParticipant.identity, send, triggerReaction, userName]);

  // Send Chat message
  const handleSendMessage = useCallback(
    async (text: string) => {
      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const newMsg: ChatMessage = {
        id: Math.random().toString(),
        senderName: userName,
        message: text,
        timestamp,
        isSelf: true,
      };

      setMessages((prev) => [...prev, newMsg]);

      try {
        const payload = JSON.stringify({
          type: "chat",
          id: newMsg.id,
          senderName: userName,
          text,
          timestamp,
        });
        send(new TextEncoder().encode(payload), { reliable: true });
      } catch (err) {
        console.warn("Could not broadcast chat message:", err);
      }

      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingCode: code,
          senderName: userName,
          message: text,
        }),
      }).catch(() => {});
    },
    [code, send, userName]
  );

  // Host Controls
  const handleMuteParticipant = useCallback(
    (targetIdentity: string) => {
      try {
        const payload = JSON.stringify({ type: "mute_request", targetIdentity });
        send(new TextEncoder().encode(payload), { reliable: true });
        toast("Mute request sent");
      } catch (err) {
        console.warn("Failed to send mute command:", err);
      }
    },
    [send]
  );

  const handleRemoveParticipant = useCallback(
    (targetIdentity: string) => {
      if (!isCurrentUserHost) {
        toast.error("Only the host can remove participants");
        return;
      }
      const targetP = participants.find((p) => p.identity === targetIdentity);
      if (targetP) {
        let isTargetHost = false;
        try {
          const meta = targetP.metadata ? JSON.parse(targetP.metadata) : {};
          isTargetHost = !!meta.isHost;
        } catch {}
        if (isTargetHost) {
          toast.error("The host cannot be kicked out of the meeting");
          return;
        }
      }
      try {
        const payload = JSON.stringify({
          type: "remove_request",
          targetIdentity,
          senderIdentity: localParticipant.identity,
        });
        send(new TextEncoder().encode(payload), { reliable: true });
        toast("Participant removed");
      } catch (err) {
        console.warn("Failed to send remove command:", err);
      }
    },
    [send, isCurrentUserHost, participants, localParticipant.identity]
  );

  // Host Mutes All Participants (Zoom feature)
  const handleMuteAll = useCallback(() => {
    if (!isCurrentUserHost) return;
    try {
      const payload = JSON.stringify({
        type: "mute_all_request",
        senderIdentity: localParticipant.identity,
      });
      send(new TextEncoder().encode(payload), { reliable: true });
      toast.success("Muted all participants");
    } catch (err) {
      console.warn("Mute all error:", err);
    }
  }, [isCurrentUserHost, localParticipant.identity, send]);

  // Leave room execution
  const executeLeaveRoom = () => {
    setIsLeaveModalOpen(false);
    onLeave();
    room.disconnect();
    toast("You left the meeting");
    router.push("/home");
  };

  // Leave room entrypoint (opens simplified confirmation modal for all users)
  const handleLeaveRoom = () => {
    setIsLeaveModalOpen(true);
  };

  // Host leaves alone (End for you)
  const handleHostLeaveAlone = () => {
    executeLeaveRoom();
  };

  // Host ends for all (End for all)
  const handleHostEndForAll = async () => {
    setIsEndingMeeting(true);
    try {
      // 1. Broadcast to all participants via data channel
      const payload = JSON.stringify({
        type: "meeting_ended_by_host",
        senderIdentity: localParticipant.identity,
        code,
      });
      send(new TextEncoder().encode(payload), { reliable: true });

      // 2. Mark meeting as ended in database
      await fetch("/api/meetings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`nilaa_host_${code}`);
      }
      toast.success("Meeting ended for all participants");
    } catch (err) {
      console.warn("Error ending meeting for all:", err);
    } finally {
      setIsEndingMeeting(false);
      setIsLeaveModalOpen(false);
      onLeave();
      room.disconnect();
      router.push("/home");
    }
  };

  // Convert LiveKit participants into list items with accurate host assignment
  const participantListItems: ParticipantItem[] = useMemo(() => {
    return participants.map((p) => {
      let isHost = false;
      let avatarUrl: string | undefined = undefined;
      try {
        const meta = p.metadata ? JSON.parse(p.metadata) : {};
        isHost = !!meta.isHost;
        avatarUrl = meta.avatarUrl || undefined;
      } catch {}
      if (p.isLocal) {
        if (isCurrentUserHost) isHost = true;
        const localCachedAvatar = getCachedUserSettings().avatarUrl;
        if (localCachedAvatar) avatarUrl = localCachedAvatar;
      }
      return {
        id: p.identity,
        name: p.name || p.identity,
        avatarUrl,
        isHost,
        isGuest: !p.name,
        isSelf: p.isLocal,
        isMuted: !p.isMicrophoneEnabled,
        isVideoOff: !p.isCameraEnabled,
        isHandRaised: !!raisedHandParticipants[p.identity],
      };
    });
  }, [participants, raisedHandParticipants, isCurrentUserHost]);

  // Speaking set for fast lookup
  const speakingIdentities = useMemo(() => {
    return new Set(speakingParticipants.map((p) => p.identity));
  }, [speakingParticipants]);

  // Grid sizing logic
  const getGridClasses = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2";
    if (count <= 4) return "grid-cols-2 sm:grid-cols-2";
    if (count <= 6) return "grid-cols-2 sm:grid-cols-3";
    if (count <= 9) return "grid-cols-2 sm:grid-cols-3";
    if (count <= 12) return "grid-cols-2 sm:grid-cols-4";
    return "grid-cols-2 sm:grid-cols-5";
  };

  // Check active spotlight
  const isSpotlightActive =
    !!spotlightTileId &&
    tracks.some((t) => `${t.participant.identity}_${t.source}` === spotlightTileId);
  const spotlightTrack = isSpotlightActive
    ? tracks.find((t) => `${t.participant.identity}_${t.source}` === spotlightTileId)
    : null;
  const otherTracks = isSpotlightActive
    ? tracks.filter((t) => `${t.participant.identity}_${t.source}` !== spotlightTileId)
    : [];

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden flex flex-col select-none touch-manipulation overscroll-none unzoomable-workspace bg-[#0B0C0E]">
      {/* Zoom-style neutral deep black workspace background for maximum contrast and zero distraction */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#0B0C0E]" />

      {/* Floating Reactions Overlay */}
      <ReactionsOverlay reactions={reactions} />

      {/* Join/Leave Presence Notifications */}
      <PresenceToast notifications={presenceNotifications} />

      {/* Top Header Bar - Sleek Zoom Dark Glass */}
      <header className="h-14 border-b border-white/10 bg-[#0B0C0E]/90 backdrop-blur-xl px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 select-none cursor-default">
            <div className="flex h-7 w-7 items-center justify-center rounded-full overflow-hidden border border-white/20">
              <Image
                src="/nilaa-logo.jpg"
                alt="Nilaa RTC"
                width={28}
                height={28}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="font-heading text-sm font-bold tracking-tight text-white hidden sm:inline drop-shadow-xs">
              Nilaa <span className="text-sky-400 font-extrabold">RTC</span>
            </span>
          </div>

          <div className="h-4 w-[1px] bg-border hidden sm:block" />

          {/* Meeting Code + Copy Button */}
          <CopyCode code={code} />
        </div>

        <div className="flex items-center gap-2">
          {/* Network Health & Data Saver Pill */}
          <NetworkHealthControl
            quality={localConnectionQuality}
            connectionState={connectionState}
            mode={networkMode}
            onModeChange={handleNetworkModeChange}
          />
          {/* Meeting Duration Timer in Geist Vercel font */}
          <MeetingTimer />
        </div>
      </header>

      {/* Main Area: Video Grid + Side Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Video Area: Spotlight Mode OR Balanced Attached Grid Mode (Zoom Gallery Style) */}
        <main className="flex-1 p-1 sm:p-2 md:p-2.5 flex flex-col items-center justify-center overflow-hidden relative">
          {tracks.length === 0 ? (
            <div className="relative w-full h-full min-h-[200px] max-h-[75vh] aspect-video rounded-xl overflow-hidden bg-[#16181D] border border-white/10 shadow-2xl flex flex-col items-center justify-center text-slate-300 p-6">
              <CalmSpinner size="md" text="Connecting audio & video..." />
            </div>
          ) : isSpotlightActive && spotlightTrack ? (
            /* Spotlight Mode: Compact Filmstrip along top + Expanded Speaker Stage */
            <div className="w-full h-full flex flex-col gap-1.5 sm:gap-2 overflow-hidden">
              {/* Top Filmstrip of Other Participants */}
              {otherTracks.length > 0 && (
                <div className="w-full flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 px-0.5 shrink-0 scrollbar-thin scrollbar-thumb-white/20">
                  {otherTracks.map((trackRef) => {
                    const tileId = `${trackRef.participant.identity}_${trackRef.source}`;
                    const isSpeaking = speakingIdentities.has(trackRef.participant.identity);
                    const isLocal = trackRef.participant.isLocal;
                    const handRaised = !!raisedHandParticipants[trackRef.participant.identity];
                    const pName = trackRef.participant.name || trackRef.participant.identity;
                    const hasVideo = trackRef.publication && !trackRef.publication.isMuted;
                    const isScreenShare = trackRef.source === Track.Source.ScreenShare;

                    return (
                      <div
                        key={tileId}
                        onClick={() => handleTileDoubleAction(tileId)}
                        className={`relative h-18 sm:h-22 md:h-26 aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-[#16181D] border cursor-pointer shrink-0 transition-all duration-150 hover:scale-[1.02] active:scale-95 shadow-md ${
                          isSpeaking
                            ? "border-sky-400 ring-2 ring-sky-400/40"
                            : "border-white/10 hover:border-white/25"
                        }`}
                        title={`Click to focus on ${pName}`}
                      >
                        {hasVideo ? (
                          <VideoTrack
                            trackRef={trackRef}
                            className={`w-full h-full object-cover ${
                              isLocal && !isScreenShare && isLocalMirrored ? "-scale-x-100" : "scale-x-100"
                            }`}
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#16181D] text-white gap-1">
                            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-heading text-xs font-bold">
                              {pName.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between pointer-events-none z-10">
                          <span className="text-[10px] text-white/95 bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded-sm truncate max-w-[85px]">
                            {pName} {isLocal && "(You)"}
                          </span>
                          {trackRef.participant.isMicrophoneEnabled ? (
                            <Mic className="h-2.5 w-2.5 text-sky-400" />
                          ) : (
                            <MicOff className="h-2.5 w-2.5 text-red-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Main Expanded Spotlight Stage */}
              {(() => {
                const trackRef = spotlightTrack;
                const tileId = `${trackRef.participant.identity}_${trackRef.source}`;
                const isSpeaking = speakingIdentities.has(trackRef.participant.identity);
                const isLocal = trackRef.participant.isLocal;
                const handRaised = !!raisedHandParticipants[trackRef.participant.identity];
                const pName = trackRef.participant.name || trackRef.participant.identity;
                let pAvatar: string | null = null;
                try {
                  const pMeta = trackRef.participant.metadata ? JSON.parse(trackRef.participant.metadata) : {};
                  pAvatar = pMeta.avatarUrl || null;
                } catch {}
                if (isLocal) {
                  const localAvatar = getCachedUserSettings().avatarUrl;
                  if (localAvatar) pAvatar = localAvatar;
                }
                const hasVideo = trackRef.publication && !trackRef.publication.isMuted;
                const isScreenShare = trackRef.source === Track.Source.ScreenShare;
                const currentFit = isScreenShare ? "contain" : (fitModes[tileId] || "contain");

                return (
                  <div
                    key={tileId}
                    onDoubleClick={() => handleTileDoubleAction(tileId)}
                    onTouchEnd={() => handleTileTouchEnd(tileId)}
                    className={`relative flex-1 w-full h-full min-h-0 rounded-xl overflow-hidden bg-[#16181D] border border-white/10 shadow-2xl flex items-center justify-center transition-all duration-200 group cursor-pointer ${
                      isSpeaking ? "speaker-active-ring" : ""
                    }`}
                    title="Double click or tap to exit spotlight"
                  >
                    {/* Continuous connected line border around rounded corners */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-xl z-20">
                      <rect
                        x="1.5"
                        y="1.5"
                        style={{ width: "calc(100% - 3px)", height: "calc(100% - 3px)" }}
                        rx="11"
                        ry="11"
                        fill="none"
                        stroke={isSpeaking ? "#0284C7" : "rgba(255, 255, 255, 0.08)"}
                        strokeWidth="1.5"
                      />
                      {isSpeaking && (
                        <rect
                          x="1.5"
                          y="1.5"
                          style={{ width: "calc(100% - 3px)", height: "calc(100% - 3px)" }}
                          rx="11"
                          ry="11"
                          fill="none"
                          stroke="#38BDF8"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          className="running-beam"
                        />
                      )}
                    </svg>

                    {/* Exit Focus / Grid View Floating Pill */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSpotlightTileId(null);
                      }}
                      className="absolute top-3 left-3 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-medium transition-all active:scale-95 shadow-md cursor-pointer"
                      title="Return to balanced grid"
                    >
                      <LayoutGrid className="h-3.5 w-3.5 text-sky-400" />
                      <span>Grid View</span>
                    </button>

                    {/* Video Track */}
                    {hasVideo && !(networkMode === "audio-only" && !isLocal && !isScreenShare) ? (
                      <VideoTrack
                        trackRef={trackRef}
                        className={`w-full h-full ${
                          currentFit === "contain" ? "object-contain" : "object-cover"
                        } ${
                          isLocal && !isScreenShare && isLocalMirrored ? "-scale-x-100" : "scale-x-100"
                        } transition-all duration-200`}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#16181D] backdrop-blur-md gap-3">
                        {pAvatar ? (
                          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border border-white/20 shadow-lg">
                            <img src={pAvatar} alt={pName} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-heading text-2xl sm:text-3xl font-bold shadow-lg">
                            {pName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm text-white/50 font-light">
                          {networkMode === "audio-only" && !isLocal && !isScreenShare
                            ? "Audio Only"
                            : "Camera Off"}
                        </span>
                      </div>
                    )}

                    {/* Participant Name & Status Pill */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-xs z-10 text-white">
                      <NetworkSignalBars quality={trackRef.participant.connectionQuality} size="xs" />
                      <span className="font-medium text-white truncate max-w-[140px]">
                        {pName} {isLocal && "(You)"}
                      </span>
                      {handRaised && (
                        <Hand className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      )}
                      {trackRef.participant.isMicrophoneEnabled ? (
                        <Mic className="h-3 w-3 text-sky-400" />
                      ) : (
                        <MicOff className="h-3 w-3 text-red-400" />
                      )}
                    </div>

                    {/* Top Right Controls */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      {isSpeaking && (
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{
                            background: "linear-gradient(135deg, rgba(96,165,250,0.25) 0%, rgba(147,197,253,0.18) 100%)",
                            borderColor: "rgba(96,165,250,0.4)",
                            color: "#93C5FD",
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping" />
                          <span>Speaking</span>
                        </div>
                      )}

                      {/* Mirror / Flip for local */}
                      {isLocal && !isScreenShare && hasVideo && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFlipCamera();
                            }}
                            className="h-7 w-7 rounded-btn bg-black/50 hover:bg-black/70 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md transition-all shadow-sm active:scale-95"
                            title="Flip camera front/back"
                          >
                            <SwitchCamera className="h-3.5 w-3.5 text-accent" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLocalMirror();
                            }}
                            className="h-7 w-7 rounded-btn bg-black/50 hover:bg-black/70 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md transition-all shadow-sm active:scale-95"
                            title={isLocalMirrored ? "Disable mirror view" : "Enable mirror view"}
                          >
                            <FlipHorizontal className={`h-3.5 w-3.5 ${isLocalMirrored ? "text-accent" : ""}`} />
                          </button>
                        </>
                      )}

                      {!isScreenShare && hasVideo && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFitMode(tileId);
                          }}
                          className="h-7 w-7 rounded-btn bg-black/50 hover:bg-black/70 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md transition-all shadow-sm active:scale-95"
                          title={currentFit === "contain" ? "Crop to fill box" : "Fit whole video in box"}
                        >
                          {currentFit === "contain" ? (
                            <Maximize2 className="h-3.5 w-3.5 text-accent" />
                          ) : (
                            <Minimize2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Regular Grid View - Snug Attached Video Gallery (Zoom Style) */
            <div
              className={`grid ${getGridClasses(
                tracks.length || 1
              )} gap-1 sm:gap-1.5 md:gap-2 w-full h-full max-h-[calc(100vh-140px)] items-center justify-center overflow-y-auto`}
            >
              {tracks.map((trackRef) => {
                const isSpeaking = speakingIdentities.has(trackRef.participant.identity);
                const isLocal = trackRef.participant.isLocal;
                const handRaised = !!raisedHandParticipants[trackRef.participant.identity];
                const pName = trackRef.participant.name || trackRef.participant.identity;
                let pAvatar: string | null = null;
                try {
                  const pMeta = trackRef.participant.metadata ? JSON.parse(trackRef.participant.metadata) : {};
                  pAvatar = pMeta.avatarUrl || null;
                } catch {}
                if (isLocal) {
                  const localAvatar = getCachedUserSettings().avatarUrl;
                  if (localAvatar) pAvatar = localAvatar;
                }
                const hasVideo = trackRef.publication && !trackRef.publication.isMuted;
                const tileId = `${trackRef.participant.identity}_${trackRef.source}`;
                const isScreenShare = trackRef.source === Track.Source.ScreenShare;
                const currentFit = isScreenShare ? "contain" : (fitModes[tileId] || "contain");

                return (
                  <div
                    key={tileId}
                    onDoubleClick={() => handleTileDoubleAction(tileId)}
                    onTouchEnd={() => handleTileTouchEnd(tileId)}
                    className={`relative w-full h-full min-h-[140px] sm:min-h-[180px] md:min-h-[220px] max-h-[85vh] aspect-video rounded-xl overflow-hidden bg-[#16181D] border border-white/10 shadow-lg flex items-center justify-center transition-all duration-150 group cursor-pointer ${
                      isSpeaking ? "speaker-active-ring" : ""
                    }`}
                    title="Double click or tap to spotlight speaker"
                  >
                    {/* Continuous connected line border around rounded corners */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-xl z-20">
                      <rect
                        x="1.5"
                        y="1.5"
                        style={{ width: "calc(100% - 3px)", height: "calc(100% - 3px)" }}
                        rx="11"
                        ry="11"
                        fill="none"
                        stroke={isSpeaking ? "#0284C7" : "rgba(255, 255, 255, 0.08)"}
                        strokeWidth="1.5"
                      />
                      {isSpeaking && (
                        <rect
                          x="1.5"
                          y="1.5"
                          style={{ width: "calc(100% - 3px)", height: "calc(100% - 3px)" }}
                          rx="11"
                          ry="11"
                          fill="none"
                          stroke="#38BDF8"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          className="running-beam"
                        />
                      )}
                    </svg>

                    {/* Live Video Track */}
                    {hasVideo && !(networkMode === "audio-only" && !isLocal && !isScreenShare) ? (
                      <VideoTrack
                        trackRef={trackRef}
                        className={`w-full h-full ${
                          currentFit === "contain" ? "object-contain" : "object-cover"
                        } ${
                          isLocal && !isScreenShare && isLocalMirrored ? "-scale-x-100" : "scale-x-100"
                        } transition-all duration-200`}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#16181D] backdrop-blur-md gap-2">
                        {pAvatar ? (
                          <div className="h-14 w-14 sm:h-18 sm:w-18 rounded-full overflow-hidden border border-white/20 shadow-lg">
                            <img src={pAvatar} alt={pName} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-14 w-14 sm:h-18 sm:w-18 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-heading text-lg sm:text-2xl font-bold shadow-lg">
                            {pName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs text-white/50 font-light">
                          {networkMode === "audio-only" && !isLocal && !isScreenShare
                            ? "Audio Only"
                            : "Camera Off"}
                        </span>
                      </div>
                    )}

                    {/* Participant Name & Status Pill */}
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-xs z-10 text-white">
                      <NetworkSignalBars quality={trackRef.participant.connectionQuality} size="xs" />
                      <span className="font-medium text-white truncate max-w-[120px]">
                        {pName} {isLocal && "(You)"}
                      </span>
                      {handRaised && (
                        <Hand className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      )}
                      {trackRef.participant.isMicrophoneEnabled ? (
                        <Mic className="h-3 w-3 text-sky-400" />
                      ) : (
                        <MicOff className="h-3 w-3 text-red-400" />
                      )}
                    </div>

                    {/* Top Right: Speaking Badge & Fit Toggle */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                      {isSpeaking && (
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{
                            background: "linear-gradient(135deg, rgba(96,165,250,0.25) 0%, rgba(147,197,253,0.18) 100%)",
                            borderColor: "rgba(96,165,250,0.4)",
                            color: "#93C5FD",
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping" />
                          <span>Speaking</span>
                        </div>
                      )}

                      {/* Mirror and Flip controls for local video */}
                      {isLocal && !isScreenShare && hasVideo && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFlipCamera();
                            }}
                            className="h-7 w-7 rounded-btn bg-black/50 hover:bg-black/70 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md transition-all shadow-sm active:scale-95"
                            title="Flip camera front/back"
                            aria-label="Flip camera front or back"
                          >
                            <SwitchCamera className="h-3.5 w-3.5 text-accent" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLocalMirror();
                            }}
                            className="h-7 w-7 rounded-btn bg-black/50 hover:bg-black/70 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md transition-all shadow-sm active:scale-95"
                            title={isLocalMirrored ? "Disable mirror view" : "Enable mirror view"}
                            aria-label="Toggle camera mirror view"
                          >
                            <FlipHorizontal className={`h-3.5 w-3.5 ${isLocalMirrored ? "text-accent" : ""}`} />
                          </button>
                        </>
                      )}

                      {!isScreenShare && hasVideo && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFitMode(tileId);
                          }}
                          className="h-7 w-7 rounded-btn bg-black/50 hover:bg-black/70 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md transition-all shadow-sm active:scale-95"
                          title={
                            currentFit === "contain"
                              ? "Crop to fill box"
                              : "Fit whole video in box"
                          }
                          aria-label="Toggle video fit mode"
                        >
                          {currentFit === "contain" ? (
                            <Maximize2 className="h-3.5 w-3.5 text-accent" />
                          ) : (
                            <Minimize2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Side Panel: Chat (Desktop: Sidebar, Mobile: Full-height Slide Overlay) */}
        {activePanel === "chat" && (
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden"
              onClick={() => setActivePanel(null)}
            />
            <aside className="fixed lg:relative right-0 top-0 bottom-0 z-40 w-full sm:w-96 lg:w-80 h-full bg-white/95 backdrop-blur-md border-l border-white/40 shadow-2xl lg:shadow-none flex flex-col">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                onClose={() => setActivePanel(null)}
              />
            </aside>
          </>
        )}

        {/* Side Panel: Participants (Desktop: Sidebar, Mobile: Full-height Slide Overlay) */}
        {activePanel === "participants" && (
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden"
              onClick={() => setActivePanel(null)}
            />
            <aside className="fixed lg:relative right-0 top-0 bottom-0 z-40 w-full sm:w-96 lg:w-80 h-full bg-white/95 backdrop-blur-md border-l border-white/40 shadow-2xl lg:shadow-none flex flex-col">
              <ParticipantsPanel
                participants={participantListItems}
                isCurrentUserHost={isCurrentUserHost}
                meetingCode={code}
                onMuteParticipant={handleMuteParticipant}
                onRemoveParticipant={handleRemoveParticipant}
                onMuteAll={handleMuteAll}
                onClose={() => setActivePanel(null)}
              />
            </aside>
          </>
        )}
      </div>

      {/* Bottom Controls Bar - Compact Ergonomic Layout (Sleek & Unobtrusive) */}
      <footer className="h-16 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/10 bg-[#0B0C0E]/90 backdrop-blur-xl px-2 sm:px-4 md:px-5 flex items-center justify-between shrink-0 z-20">
        {/* Left Section: Mic & Camera Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mic Button */}
          <button
            type="button"
            onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90 active:brightness-95 ${
              isMicrophoneEnabled
                ? "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm shadow-slate-900/5"
                : "bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-md shadow-red-500/25 hover:brightness-105"
            }`}
            title={isMicrophoneEnabled ? "Mute Mic" : "Unmute Mic"}
            aria-label={isMicrophoneEnabled ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicrophoneEnabled ? (
              <Mic className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-sky-600" />
            ) : (
              <MicOff className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
            )}
          </button>

          {/* Camera Button */}
          <button
            type="button"
            onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90 active:brightness-95 ${
              isCameraEnabled
                ? "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm shadow-slate-900/5"
                : "bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-md shadow-red-500/25 hover:brightness-105"
            }`}
            title={isCameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
            aria-label={isCameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
          >
            {isCameraEnabled ? (
              <VideoIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-sky-600" />
            ) : (
              <VideoOff className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
            )}
          </button>
        </div>

        {/* Center Section: Screen Share, Raise Hand, and Emoji Reactions */}
        <div className="flex items-center gap-1.5 sm:gap-2 mx-auto">
          {/* Screen Share Button */}
          <button
            type="button"
            onClick={handleToggleScreenShare}
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90 active:brightness-95 ${
              isScreenShareEnabled
                ? "bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/30"
                : "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm shadow-slate-900/5"
            }`}
            title={isScreenShareEnabled ? "Stop Sharing Screen" : "Share Screen"}
            aria-label="Toggle Screen Share"
          >
            <Share2 className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${isScreenShareEnabled ? "text-white" : "text-slate-700"}`} />
          </button>

          {/* Raise Hand Button */}
          <button
            type="button"
            onClick={toggleHand}
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90 active:brightness-95 ${
              isHandRaised
                ? "bg-gradient-to-b from-amber-400 to-yellow-500 text-white shadow-md shadow-yellow-500/30"
                : "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm shadow-slate-900/5"
            }`}
            title={isHandRaised ? "Lower Hand" : "Raise Hand"}
            aria-label="Raise or Lower Hand"
          >
            <Hand className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${isHandRaised ? "text-white fill-white" : "text-slate-700"}`} />
          </button>

          {/* Emoji Reactions Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsReactionMenuOpen(!isReactionMenuOpen)}
              className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90 active:brightness-95 ${
                isReactionMenuOpen
                  ? "bg-gradient-to-b from-sky-100 to-blue-100 text-blue-700 border border-sky-300/80 shadow-sm"
                  : "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm shadow-slate-900/5"
              }`}
              title="Send Reaction"
              aria-label="Send Reaction"
            >
              <Smile className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${isReactionMenuOpen ? "text-blue-600" : "text-slate-700"}`} />
            </button>

            <AnimatePresence>
              {isReactionMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute bottom-12 sm:bottom-13 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 bg-white/95 backdrop-blur-xl border border-sky-100 rounded-2xl shadow-2xl z-30"
                >
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => triggerReaction(emoji)}
                      className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-lg sm:text-xl hover:bg-sky-50 rounded-xl active:scale-85 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Section: Chat, Participants, and Leave Call */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Chat Button */}
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === "chat" ? null : "chat")}
            title="In-call chat"
            aria-label="Toggle in-call chat"
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center relative transition-all duration-150 cursor-pointer active:scale-90 active:brightness-95 ${
              activePanel === "chat"
                ? "bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/30"
                : "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm shadow-slate-900/5"
            }`}
          >
            <MessageSquare className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            {messages.length > 1 && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-white" />
            )}
          </button>

          {/* Participants Button */}
          <button
            type="button"
            onClick={() =>
              setActivePanel(activePanel === "participants" ? null : "participants")
            }
            title="People in room"
            aria-label="Toggle people list"
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center relative transition-all duration-150 cursor-pointer active:scale-90 active:brightness-95 ${
              activePanel === "participants"
                ? "bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/30"
                : "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm shadow-slate-900/5"
            }`}
          >
            <Users className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            {participants.length > 1 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[15px] h-3.5 rounded-full bg-slate-800 text-[9px] text-white font-bold flex items-center justify-center border border-white/50">
                {participants.length}
              </span>
            )}
          </button>

          {/* Leave Call Button (Compact, Elegant Dark Red Gradient + Top Sheen) */}
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="group relative h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 bg-gradient-to-b from-red-600 via-rose-700 to-red-800 hover:from-red-500 hover:to-red-700 border-t border-white/30 border-x border-b border-red-900/60 text-white shadow-md shadow-red-950/40 transition-all duration-150 cursor-pointer active:scale-92 active:brightness-95 overflow-hidden"
            title="Leave Meeting"
            aria-label="Leave Meeting"
          >
            {/* Liquid specular highlight sheen */}
            <span className="pointer-events-none absolute inset-x-2 sm:inset-x-3 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <PhoneOff className="h-3.5 w-3.5 text-white shrink-0" />
            <span className="hidden xs:inline sm:inline">Leave</span>
          </button>
        </div>
      </footer>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        isAudioEnabled={isMicrophoneEnabled}
        isVideoEnabled={isCameraEnabled}
        isScreenSharing={isScreenShareEnabled}
        isHandRaised={isHandRaised}
        onToggleAudio={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
        onToggleVideo={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleHand={toggleHand}
        onOpenChat={() => setActivePanel("chat")}
        onOpenParticipants={() => setActivePanel("participants")}
        onSendReaction={triggerReaction}
        onLeave={handleLeaveRoom}
      />

      {/* Leave Meeting Confirmation Modal (Exact Match to User Mockup Card 2) */}
      <AnimatePresence>
        {isLeaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xs sm:max-w-sm p-6 sm:p-7 rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl text-center space-y-4"
            >
              <div>
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Leave meeting?
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                  You can leave the call without ending it for other participants.
                </p>
              </div>

              {isCurrentUserHost ? (
                /* Host Leave Actions */
                <div className="space-y-2.5 pt-2">
                  {/* End for All Button (1.5x Darker Red + White Gradient Mix) */}
                  <button
                    type="button"
                    onClick={handleHostEndForAll}
                    disabled={isEndingMeeting}
                    className="group relative w-full h-12 rounded-2xl bg-gradient-to-b from-red-600 via-rose-700 to-red-800 hover:from-red-500 hover:to-red-700 border-t border-white/30 border-x border-b border-red-900/60 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer overflow-hidden"
                  >
                    <span className="pointer-events-none absolute inset-x-4 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    <PowerOff className="h-4 w-4" />
                    <span>{isEndingMeeting ? "Ending..." : "End for All"}</span>
                  </button>

                  {/* Leave Call Button (Frosted Dark Glass) */}
                  <button
                    type="button"
                    onClick={handleHostLeaveAlone}
                    disabled={isEndingMeeting}
                    className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-sky-400" />
                    <span>Leave Call</span>
                  </button>

                  {/* Cancel Link */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setIsLeaveModalOpen(false)}
                      disabled={isEndingMeeting}
                      className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Guest Normal Leave Actions (Matching User Mockup Card 2) */
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={executeLeaveRoom}
                    className="group relative w-full h-12 rounded-2xl bg-gradient-to-b from-red-600 via-rose-700 to-red-800 hover:from-red-500 hover:to-red-700 border-t border-white/30 border-x border-b border-red-900/60 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 active:scale-[0.98] transition-all cursor-pointer overflow-hidden"
                  >
                    <span className="pointer-events-none absolute inset-x-4 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    <LogOut className="h-4 w-4" />
                    <span>Leave Call</span>
                  </button>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setIsLeaveModalOpen(false)}
                      className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Participant Evicted When Host Ends Meeting */}
      <AnimatePresence>
        {isMeetingEndedByHost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-xs sm:max-w-sm p-6 sm:p-7 rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl text-center space-y-4"
            >
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="h-6 w-6" />
              </div>

              <div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-white tracking-tight">
                  Meeting Ended
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  The host has ended this call.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/home")}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Home className="h-4 w-4" />
                  <span>Return to Home</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
