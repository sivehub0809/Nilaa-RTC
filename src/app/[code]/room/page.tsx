"use client";

import { useEffect, useState, use, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { Track, ConnectionState } from "livekit-client";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyCode } from "@/components/motion/copy-code";
import { ConnectionChip } from "@/components/meeting/connection-chip";
import { ReactionsOverlay, FloatingReaction } from "@/components/meeting/reactions-overlay";
import { ChatPanel, ChatMessage } from "@/components/meeting/chat-panel";
import { ParticipantsPanel, ParticipantItem } from "@/components/meeting/participants-panel";
import { MobileDrawer } from "@/components/meeting/mobile-drawer";
import { REACTION_EMOJIS } from "@/lib/constants";
import { toast } from "sonner";

interface RoomPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function MeetingRoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code.toUpperCase();
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
          )}`
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
  }, [code, userName]);

  if (loadingToken) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center gap-4 text-foreground">
        <Loader2 className="h-10 w-10 text-accent animate-spin" />
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Connecting to Nilaa RTC room {code}...
        </h2>
        <p className="text-xs text-muted-foreground">Securing real-time media connection</p>
      </div>
    );
  }

  // If user disconnected or connection dropped
  if (isDisconnected && !userInitiatedLeave.current) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center p-6 text-center">
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
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center p-6 text-center">
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
      className="h-screen w-screen bg-background overflow-hidden flex flex-col"
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
  onLeave: () => void;
}

function ConferenceRoom({ code, userName, onLeave }: ConferenceRoomProps) {
  const router = useRouter();
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const participants = useParticipants();
  const speakingParticipants = useSpeakingParticipants();

  // Media & UI States
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [raisedHandParticipants, setRaisedHandParticipants] = useState<Record<string, boolean>>({});
  const [activePanel, setActivePanel] = useState<"chat" | "participants" | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isReactionMenuOpen, setIsReactionMenuOpen] = useState(false);

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

  // LiveKit Data Channel for Real-time Chat, Reactions, Hand Raising
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

      // Send to peers over LiveKit data channel
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

      // Broadcast over LiveKit data channel
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

      // Persist to Supabase in background
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

  // Host Controls: Mute Participant
  const handleMuteParticipant = useCallback(
    (targetIdentity: string) => {
      try {
        const payload = JSON.stringify({
          type: "mute_request",
          targetIdentity,
        });
        send(new TextEncoder().encode(payload), { reliable: true });
        toast("Mute request sent");
      } catch (err) {
        console.warn("Failed to send mute command:", err);
      }
    },
    [send]
  );

  // Host Controls: Remove Participant
  const handleRemoveParticipant = useCallback(
    (targetIdentity: string) => {
      try {
        const payload = JSON.stringify({
          type: "remove_request",
          targetIdentity,
        });
        send(new TextEncoder().encode(payload), { reliable: true });
        toast("Participant removed");
      } catch (err) {
        console.warn("Failed to send remove command:", err);
      }
    },
    [send]
  );

  // Leave room
  const handleLeaveRoom = () => {
    onLeave();
    room.disconnect();
    toast("You left the meeting");
    router.push("/");
  };

  // Convert LiveKit participants into list items for ParticipantsPanel
  const participantListItems: ParticipantItem[] = useMemo(() => {
    return participants.map((p, idx) => ({
      id: p.identity,
      name: p.name || p.identity,
      isHost: idx === 0, // earliest joiner is host
      isSelf: p.isLocal,
      isMuted: !p.isMicrophoneEnabled,
      isVideoOff: !p.isCameraEnabled,
      isHandRaised: !!raisedHandParticipants[p.identity],
    }));
  }, [participants, raisedHandParticipants]);

  // Speaking set for fast lookup
  const speakingIdentities = useMemo(() => {
    return new Set(speakingParticipants.map((p) => p.identity));
  }, [speakingParticipants]);

  // Grid sizing logic according to spec:
  // 1 = full, 2 = side by side, 3-4 = 2x2, 5-6 = 3x2, 7-9 = 3x3, 10-12 = 4x3, 13-15 = 5x3. Mobile = 2 columns.
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
    <div className="relative h-screen w-screen bg-background overflow-hidden flex flex-col select-none">
      {/* Floating Reactions Overlay */}
      <ReactionsOverlay reactions={reactions} />

      {/* Top Header Bar */}
      <header className="h-14 border-b border-border bg-card/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-btn bg-accent text-accent-foreground font-bold shadow-cyan-glow">
              <VideoIcon className="h-4 w-4 fill-current" />
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

          {/* Mobile Hamburger Menu (Opens slide drawer from right to middle) */}
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden h-9 w-9 text-foreground"
            aria-label="Open controls drawer"
          >
            <Menu className="h-5 w-5" />
          </Button>
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
              <div className="relative w-full h-full min-h-[220px] max-h-[75vh] aspect-video rounded-tile overflow-hidden bg-card border border-border flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="h-8 w-8 text-accent animate-spin" />
                <span className="text-xs">Connecting audio & video...</span>
              </div>
            ) : (
              tracks.map((trackRef) => {
                const isSpeaking = speakingIdentities.has(trackRef.participant.identity);
                const isLocal = trackRef.participant.isLocal;
                const handRaised = !!raisedHandParticipants[trackRef.participant.identity];
                const pName = trackRef.participant.name || trackRef.participant.identity;
                const hasVideo = trackRef.publication && !trackRef.publication.isMuted;

                return (
                  <div
                    key={`${trackRef.participant.identity}_${trackRef.source}`}
                    className={`relative w-full h-full min-h-[220px] max-h-[75vh] aspect-video rounded-tile overflow-hidden bg-card border border-border flex items-center justify-center transition-all duration-200 ${
                      isSpeaking ? "speaker-active-ring" : ""
                    }`}
                  >
                    {/* Live Video Track */}
                    {hasVideo ? (
                      <VideoTrack
                        trackRef={trackRef}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-card gap-2">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-surface border border-border flex items-center justify-center text-foreground font-heading text-xl sm:text-2xl font-bold">
                          {pName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-muted-foreground">Camera Off</span>
                      </div>
                    )}

                    {/* Participant Name & Status Pill (Bottom Left) */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-card/85 backdrop-blur-md px-2.5 py-1 rounded-btn border border-border/80 text-xs z-10">
                      <span className="font-semibold text-foreground truncate max-w-[120px]">
                        {pName} {isLocal && "(You)"}
                      </span>
                      {handRaised && (
                        <Hand className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      )}
                      {trackRef.participant.isMicrophoneEnabled ? (
                        <Mic className="h-3 w-3 text-accent" />
                      ) : (
                        <MicOff className="h-3 w-3 text-destructive" />
                      )}
                    </div>

                    {/* Active Speaker Badge (Top Right) */}
                    {isSpeaking && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-accent/20 border border-accent/40 text-accent px-2 py-0.5 rounded-full text-[10px] font-bold z-10">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                        <span>Speaking</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* Desktop Side Panel: Chat */}
        {activePanel === "chat" && (
          <aside className="hidden lg:block h-full z-20">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              onClose={() => setActivePanel(null)}
            />
          </aside>
        )}

        {/* Desktop Side Panel: Participants */}
        {activePanel === "participants" && (
          <aside className="hidden lg:block h-full z-20">
            <ParticipantsPanel
              participants={participantListItems}
              isCurrentUserHost={participantListItems[0]?.isSelf}
              onMuteParticipant={handleMuteParticipant}
              onRemoveParticipant={handleRemoveParticipant}
              onClose={() => setActivePanel(null)}
            />
          </aside>
        )}
      </div>

      {/* Desktop Bottom Controls Bar */}
      <footer className="h-20 border-t border-border bg-card/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{userName}</span>
          <span>•</span>
          <span>{participants.length} connected (Max 15)</span>
        </div>

        {/* Primary Call Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 mx-auto">
          {/* Mic Button */}
          <Button
            variant={isMicrophoneEnabled ? "secondary" : "destructive"}
            size="icon"
            onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
            className="h-12 w-12 rounded-btn"
            title={isMicrophoneEnabled ? "Mute Mic" : "Unmute Mic"}
          >
            {isMicrophoneEnabled ? (
              <Mic className="h-5 w-5 text-accent" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>

          {/* Camera Button */}
          <Button
            variant={isCameraEnabled ? "secondary" : "destructive"}
            size="icon"
            onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
            className="h-12 w-12 rounded-btn"
            title={isCameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
          >
            {isCameraEnabled ? (
              <VideoIcon className="h-5 w-5 text-accent" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>

          {/* Screen Share Button */}
          <Button
            variant={isScreenShareEnabled ? "accent" : "secondary"}
            size="icon"
            onClick={() => localParticipant.setScreenShareEnabled(!isScreenShareEnabled)}
            className="h-12 w-12 rounded-btn hidden sm:flex"
            title={isScreenShareEnabled ? "Stop Sharing Screen" : "Share Screen"}
          >
            <Share2 className="h-5 w-5" />
          </Button>

          {/* Raise Hand Button */}
          <Button
            variant={isHandRaised ? "accent" : "secondary"}
            size="icon"
            onClick={toggleHand}
            className="h-12 w-12 rounded-btn"
            title={isHandRaised ? "Lower Hand" : "Raise Hand"}
          >
            <Hand className="h-5 w-5" />
          </Button>

          {/* Emoji Reactions Button */}
          <div className="relative">
            <Button
              variant={isReactionMenuOpen ? "accent" : "secondary"}
              size="icon"
              onClick={() => setIsReactionMenuOpen(!isReactionMenuOpen)}
              className="h-12 w-12 rounded-btn"
              title="Reactions"
            >
              <Smile className="h-5 w-5" />
            </Button>

            <AnimatePresence>
              {isReactionMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-2 bg-card border border-border rounded-btn shadow-2xl z-30"
                >
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => triggerReaction(emoji)}
                      className="h-9 w-9 flex items-center justify-center text-xl hover:bg-surface-hover rounded-md active:scale-90 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Leave Call Button (Red #E5484D) */}
          <Button
            variant="destructive"
            size="default"
            onClick={handleLeaveRoom}
            className="h-12 px-6 rounded-btn font-semibold gap-2"
          >
            <PhoneOff className="h-5 w-5" />
            <span className="hidden sm:inline">Leave</span>
          </Button>
        </div>

        {/* Right Panel Toggles */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant={activePanel === "chat" ? "accent" : "secondary"}
            size="iconSm"
            onClick={() => setActivePanel(activePanel === "chat" ? null : "chat")}
            title="In-call chat"
            className="h-10 w-10 relative"
          >
            <MessageSquare className="h-4 w-4" />
            {messages.length > 1 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent" />
            )}
          </Button>

          <Button
            variant={activePanel === "participants" ? "accent" : "secondary"}
            size="iconSm"
            onClick={() =>
              setActivePanel(activePanel === "participants" ? null : "participants")
            }
            title="People"
            className="h-10 w-10"
          >
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </footer>

      {/* Mobile Drawer (Slides from Right Edge to Middle of Screen) */}
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
