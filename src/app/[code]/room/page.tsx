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
import { Track, ConnectionState, Room } from "livekit-client";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyCode } from "@/components/motion/copy-code";
import { ConnectionChip } from "@/components/meeting/connection-chip";
import { ReactionsOverlay, FloatingReaction } from "@/components/meeting/reactions-overlay";
import { ChatPanel, ChatMessage } from "@/components/meeting/chat-panel";
import { ParticipantsPanel, ParticipantItem } from "@/components/meeting/participants-panel";
import { MobileDrawer } from "@/components/meeting/mobile-drawer";
import { PresenceToast, PresenceNotification } from "@/components/meeting/presence-toast";
import { REACTION_EMOJIS } from "@/lib/constants";
import { normalizeMeetingCode } from "@/lib/utils";
import { CalmSpinner } from "@/components/ui/calm-spinner";
import { toast } from "sonner";

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
      ? sessionStorage.getItem("nilaa_user_name") || "Guest"
      : "Guest");

  const initialVideo = searchParams.get("video") !== "false";
  const initialAudio = searchParams.get("audio") !== "false";

  const [token, setToken] = useState<string>("");
  const [wsUrl, setWsUrl] = useState<string>("");
  const [loadingToken, setLoadingToken] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [disconnectReason, setDisconnectReason] = useState<string>("");

  const userInitiatedLeave = useRef(false);

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
        const res = await fetch(
          `/api/livekit/token?room=${encodeURIComponent(code)}&username=${encodeURIComponent(
            userName
          )}&isHost=${isHostParam ? "1" : "0"}`
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
      <div className="relative h-[100dvh] w-screen flex flex-col items-center justify-center p-6 text-slate-800 overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-top bg-no-repeat transform-gpu will-change-transform"
          style={{
            backgroundImage: "url('/room-bg.jpg')",
            backgroundColor: "#F8FAFC",
          }}
        />
        <div className="relative z-10 p-8 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-2xl shadow-sky-950/10 flex flex-col items-center justify-center gap-3.5 max-w-sm w-full text-center">
          <CalmSpinner size="lg" text="Entering meeting..." />
          <p className="text-xs text-slate-500 font-light mt-0.5">Connecting to room {code}</p>
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
      data-lk-theme="default"
      className="h-[100dvh] w-screen bg-background overflow-hidden flex flex-col"
      onError={(err) => {
        console.error("LiveKit connection error:", err);
        toast.error(`Connection issue: ${err.message}`);
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
  const isFirstMount = useRef(true);

  useEffect(() => {
    const currentIds = new Set(participants.map((p) => p.identity));

    if (isFirstMount.current) {
      // On first mount, record existing participants without showing notifications
      prevParticipantIds.current = currentIds;
      isFirstMount.current = false;
      return;
    }

    const newNotifications: PresenceNotification[] = [];

    // Check who joined
    for (const p of participants) {
      if (!prevParticipantIds.current.has(p.identity) && !p.isLocal) {
        newNotifications.push({
          id: `${p.identity}-joined-${Date.now()}`,
          name: p.name || p.identity,
          type: "joined",
        });
      }
    }

    // Check who left
    for (const prevId of prevParticipantIds.current) {
      if (!currentIds.has(prevId)) {
        const leftName = prevId.split("_")[0]; // strip session suffix we append
        newNotifications.push({
          id: `${prevId}-left-${Date.now()}`,
          name: leftName,
          type: "left",
        });
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
  }, [participants]);

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

  // Leave room
  const handleLeaveRoom = () => {
    onLeave();
    room.disconnect();
    toast("You left the meeting");
    router.push("/");
  };

  // Convert LiveKit participants into list items with accurate host assignment
  const participantListItems: ParticipantItem[] = useMemo(() => {
    return participants.map((p) => {
      let isHost = false;
      try {
        const meta = p.metadata ? JSON.parse(p.metadata) : {};
        isHost = !!meta.isHost;
      } catch {}
      if (p.isLocal && isCurrentUserHost) {
        isHost = true;
      }
      return {
        id: p.identity,
        name: p.name || p.identity,
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

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden flex flex-col select-none touch-manipulation">
      {/* GPU-composited fixed background (Smooth 60fps with zero mobile repaints) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-top bg-no-repeat transform-gpu will-change-transform"
        style={{
          backgroundImage: "url('/room-bg.jpg')",
          backgroundColor: "#F8FAFC",
        }}
      />
      {/* Floating Reactions Overlay */}
      <ReactionsOverlay reactions={reactions} />

      {/* Join/Leave Presence Notifications */}
      <PresenceToast notifications={presenceNotifications} />

      {/* Top Header Bar - Floating Frosted Glass */}
      <header className="h-14 border-b border-white/20 bg-white/40 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-full overflow-hidden">
              <Image
                src="/nilaa-logo.jpg"
                alt="Nilaa RTC"
                width={28}
                height={28}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="font-heading text-sm font-bold tracking-tight text-foreground hidden sm:inline">
              Nilaa <span className="text-accent">RTC</span>
            </span>
          </Link>

          <div className="h-4 w-[1px] bg-border hidden sm:block" />

          {/* Meeting Code + Copy Button */}
          <CopyCode code={code} />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Connection Chip */}
          <ConnectionChip />

          {/* Quick Mobile Chat Button */}
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === "chat" ? null : "chat")}
            className={`lg:hidden h-9 w-9 rounded-xl flex items-center justify-center relative transition-all duration-150 cursor-pointer active:scale-90 ${
              activePanel === "chat"
                ? "bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-sm"
                : "bg-gradient-to-b from-white/90 to-slate-100/90 text-slate-700 hover:text-slate-900 border border-slate-200/80 shadow-xs"
            }`}
            title="Chat"
            aria-label="Open chat"
          >
            <MessageSquare className="h-4 w-4" />
            {messages.length > 1 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-500" />
            )}
          </button>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-b from-white/90 to-slate-100/90 text-slate-700 hover:text-slate-900 border border-slate-200/80 shadow-xs transition-all duration-150 cursor-pointer active:scale-90"
            aria-label="Open controls drawer"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Main Area: Video Grid + Side Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid */}
        <main className="flex-1 p-3 sm:p-5 flex items-center justify-center overflow-y-auto">
          <div
            className={`grid ${getGridClasses(
              tracks.length || 1
            )} gap-3 sm:gap-4 w-full h-full max-h-[85vh] items-center justify-center`}
          >
            {tracks.length === 0 ? (
              <div className="relative w-full h-full min-h-[220px] max-h-[75vh] aspect-video rounded-2xl overflow-hidden bg-white/70 border border-white/80 backdrop-blur-xl shadow-2xl shadow-sky-950/10 flex flex-col items-center justify-center text-slate-700 p-6">
                <CalmSpinner size="md" text="Connecting audio & video..." />
              </div>
            ) : (
              tracks.map((trackRef) => {
                const isSpeaking = speakingIdentities.has(trackRef.participant.identity);
                const isLocal = trackRef.participant.isLocal;
                const handRaised = !!raisedHandParticipants[trackRef.participant.identity];
                const pName = trackRef.participant.name || trackRef.participant.identity;
                const hasVideo = trackRef.publication && !trackRef.publication.isMuted;
                const tileId = `${trackRef.participant.identity}_${trackRef.source}`;
                const isScreenShare = trackRef.source === Track.Source.ScreenShare;
                const currentFit = isScreenShare ? "contain" : (fitModes[tileId] || "contain");

                return (
                  <div
                    key={tileId}
                    className={`relative w-full h-full min-h-[220px] max-h-[75vh] aspect-video rounded-2xl overflow-hidden bg-slate-900/90 shadow-2xl shadow-sky-950/20 flex items-center justify-center transition-all duration-200 group ${
                      isSpeaking ? "speaker-active-ring" : ""
                    }`}
                  >
                    {/* Continuous connected line border around rounded corners (not dots) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl z-20">
                      <rect
                        x="1.5"
                        y="1.5"
                        style={{ width: "calc(100% - 3px)", height: "calc(100% - 3px)" }}
                        rx="15"
                        ry="15"
                        fill="none"
                        stroke={isSpeaking ? "#0284C7" : "rgba(56, 189, 248, 0.55)"}
                        strokeWidth="1.5"
                      />
                      {/* Flowing continuous light beam when speaking (continuous line, not dots) */}
                      {isSpeaking && (
                        <rect
                          x="1.5"
                          y="1.5"
                          style={{ width: "calc(100% - 3px)", height: "calc(100% - 3px)" }}
                          rx="15"
                          ry="15"
                          fill="none"
                          stroke="#38BDF8"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          className="running-beam"
                        />
                      )}
                    </svg>
                    {/* Live Video Track */}
                    {hasVideo ? (
                      <VideoTrack
                        trackRef={trackRef}
                        className={`w-full h-full ${
                          currentFit === "contain" ? "object-contain" : "object-cover"
                        } ${
                          isLocal && !isScreenShare && isLocalMirrored ? "-scale-x-100" : "scale-x-100"
                        } transition-all duration-200`}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/85 backdrop-blur-md gap-2">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-heading text-xl sm:text-2xl font-bold shadow-lg">
                          {pName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-sky-100/70 font-light">Camera Off</span>
                      </div>
                    )}

                    {/* Participant Name & Status Pill */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-xs z-10 text-white">
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

                      {/* Mirror and Flip controls for local video */}
                      {isLocal && !isScreenShare && hasVideo && (
                        <>
                          <button
                            type="button"
                            onClick={handleFlipCamera}
                            className="h-7 w-7 rounded-btn bg-card/85 hover:bg-card border border-border/80 text-muted-foreground hover:text-foreground flex items-center justify-center backdrop-blur-md transition-all shadow-sm active:scale-95"
                            title="Flip camera front/back"
                            aria-label="Flip camera front or back"
                          >
                            <SwitchCamera className="h-3.5 w-3.5 text-accent" />
                          </button>
                          <button
                            type="button"
                            onClick={toggleLocalMirror}
                            className="h-7 w-7 rounded-btn bg-card/85 hover:bg-card border border-border/80 text-muted-foreground hover:text-foreground flex items-center justify-center backdrop-blur-md transition-all shadow-sm active:scale-95"
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
                          onClick={() => toggleFitMode(tileId)}
                          className="h-7 w-7 rounded-btn bg-card/85 hover:bg-card border border-border/80 text-muted-foreground hover:text-foreground flex items-center justify-center backdrop-blur-md transition-all shadow-sm active:scale-95"
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
              })
            )}
          </div>
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
                onMuteParticipant={handleMuteParticipant}
                onRemoveParticipant={handleRemoveParticipant}
                onClose={() => setActivePanel(null)}
              />
            </aside>
          </>
        )}
      </div>

      {/* Bottom Controls Bar - Floating Frosted Glass with Light Gradient Touchable Buttons */}
      <footer className="h-20 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/20 bg-white/55 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-700">
          <span className="font-medium text-slate-900">{userName}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600">{participants.length} connected (Max 15)</span>
        </div>

        {/* Primary Call Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 mx-auto">
          {/* Mic Button */}
          <button
            type="button"
            onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
            className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90 active:brightness-95 ${
              isMicrophoneEnabled
                ? "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm shadow-slate-900/5"
                : "bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-md shadow-red-500/25 hover:brightness-105"
            }`}
            title={isMicrophoneEnabled ? "Mute Mic" : "Unmute Mic"}
            aria-label={isMicrophoneEnabled ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicrophoneEnabled ? (
              <Mic className="h-5 w-5 text-sky-600" />
            ) : (
              <MicOff className="h-5 w-5 text-white" />
            )}
          </button>

          {/* Camera Button */}
          <button
            type="button"
            onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
            className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90 active:brightness-95 ${
              isCameraEnabled
                ? "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm shadow-slate-900/5"
                : "bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-md shadow-red-500/25 hover:brightness-105"
            }`}
            title={isCameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
            aria-label={isCameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
          >
            {isCameraEnabled ? (
              <VideoIcon className="h-5 w-5 text-sky-600" />
            ) : (
              <VideoOff className="h-5 w-5 text-white" />
            )}
          </button>

          {/* Screen Share Button */}
          <button
            type="button"
            onClick={() => localParticipant.setScreenShareEnabled(!isScreenShareEnabled)}
            className={`h-12 w-12 rounded-2xl hidden sm:flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90 active:brightness-95 ${
              isScreenShareEnabled
                ? "bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/30"
                : "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm shadow-slate-900/5"
            }`}
            title={isScreenShareEnabled ? "Stop Sharing Screen" : "Share Screen"}
            aria-label="Toggle Screen Share"
          >
            <Share2 className={`h-5 w-5 ${isScreenShareEnabled ? "text-white" : "text-slate-700"}`} />
          </button>

          {/* Raise Hand Button */}
          <button
            type="button"
            onClick={toggleHand}
            className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90 active:brightness-95 ${
              isHandRaised
                ? "bg-gradient-to-b from-amber-400 to-yellow-500 text-white shadow-md shadow-yellow-500/30"
                : "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm shadow-slate-900/5"
            }`}
            title={isHandRaised ? "Lower Hand" : "Raise Hand"}
            aria-label="Raise or Lower Hand"
          >
            <Hand className={`h-5 w-5 ${isHandRaised ? "text-white fill-white" : "text-slate-700"}`} />
          </button>

          {/* Emoji Reactions Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsReactionMenuOpen(!isReactionMenuOpen)}
              className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90 active:brightness-95 ${
                isReactionMenuOpen
                  ? "bg-gradient-to-b from-sky-100 to-blue-100 text-blue-700 border border-sky-300/80 shadow-sm"
                  : "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm shadow-slate-900/5"
              }`}
              title="Send Reaction"
              aria-label="Send Reaction"
            >
              <Smile className={`h-5 w-5 ${isReactionMenuOpen ? "text-blue-600" : "text-slate-700"}`} />
            </button>

            <AnimatePresence>
              {isReactionMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-2 bg-white/95 backdrop-blur-xl border border-sky-100 rounded-2xl shadow-2xl z-30"
                >
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => triggerReaction(emoji)}
                      className="h-10 w-10 flex items-center justify-center text-xl hover:bg-sky-50 rounded-xl active:scale-85 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Leave Call Button */}
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="h-12 px-6 rounded-2xl font-medium text-sm flex items-center gap-2 bg-gradient-to-b from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-md shadow-red-500/25 transition-all duration-150 cursor-pointer active:scale-92 active:brightness-95"
            title="Leave Meeting"
            aria-label="Leave Meeting"
          >
            <PhoneOff className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>

        {/* Right Panel Toggles */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === "chat" ? null : "chat")}
            title="In-call chat"
            aria-label="Toggle in-call chat"
            className={`h-11 w-11 rounded-2xl flex items-center justify-center relative transition-all duration-150 cursor-pointer active:scale-90 active:brightness-95 ${
              activePanel === "chat"
                ? "bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/30"
                : "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm shadow-slate-900/5"
            }`}
          >
            <MessageSquare className="h-4.5 w-4.5" />
            {messages.length > 1 && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setActivePanel(activePanel === "participants" ? null : "participants")
            }
            title="People in room"
            aria-label="Toggle people list"
            className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-90 active:brightness-95 ${
              activePanel === "participants"
                ? "bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/30"
                : "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-sm shadow-slate-900/5"
            }`}
          >
            <Users className="h-4.5 w-4.5" />
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
        onToggleScreenShare={() => localParticipant.setScreenShareEnabled(!isScreenShareEnabled)}
        onToggleHand={toggleHand}
        onOpenChat={() => setActivePanel("chat")}
        onOpenParticipants={() => setActivePanel("participants")}
        onSendReaction={triggerReaction}
        onLeave={handleLeaveRoom}
      />
    </div>
  );
}
