"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Smile,
  Hand,
  MessageSquare,
  Users,
  PhoneOff,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { REACTION_EMOJIS } from "@/lib/constants";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onOpenChat: () => void;
  onOpenParticipants: () => void;
  onSendReaction: (emoji: string) => void;
  onLeave: () => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isHandRaised,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHand,
  onOpenChat,
  onOpenParticipants,
  onSendReaction,
  onLeave,
}: MobileDrawerProps) {
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />

          {/* Drawer sliding from right edge to middle of screen */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[55vw] sm:w-[50vw] bg-card border-l border-border shadow-2xl flex flex-col justify-between p-4 overflow-y-auto lg:hidden"
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <span className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Meeting Menu
                </span>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={onClose}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Audio & Video Toggles */}
              <div className="space-y-2 mb-4">
                <Button
                  variant={isAudioEnabled ? "secondary" : "destructive"}
                  size="sm"
                  onClick={onToggleAudio}
                  className="w-full justify-start gap-2.5 text-xs h-10"
                >
                  {isAudioEnabled ? <Mic className="h-4 w-4 text-accent" /> : <MicOff className="h-4 w-4" />}
                  <span>{isAudioEnabled ? "Mute Mic" : "Unmute Mic"}</span>
                </Button>

                <Button
                  variant={isVideoEnabled ? "secondary" : "destructive"}
                  size="sm"
                  onClick={onToggleVideo}
                  className="w-full justify-start gap-2.5 text-xs h-10"
                >
                  {isVideoEnabled ? <Video className="h-4 w-4 text-accent" /> : <VideoOff className="h-4 w-4" />}
                  <span>{isVideoEnabled ? "Stop Camera" : "Start Camera"}</span>
                </Button>

                <Button
                  variant={isScreenSharing ? "accent" : "secondary"}
                  size="sm"
                  onClick={onToggleScreenShare}
                  className="w-full justify-start gap-2.5 text-xs h-10"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{isScreenSharing ? "Stop Share" : "Share Screen"}</span>
                </Button>

                <Button
                  variant={isHandRaised ? "accent" : "secondary"}
                  size="sm"
                  onClick={onToggleHand}
                  className="w-full justify-start gap-2.5 text-xs h-10"
                >
                  <Hand className="h-4 w-4" />
                  <span>{isHandRaised ? "Lower Hand" : "Raise Hand"}</span>
                </Button>
              </div>

              {/* Panels Navigation */}
              <div className="space-y-2 pt-3 border-t border-border/70 mb-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onOpenChat();
                    onClose();
                  }}
                  className="w-full justify-start gap-2.5 text-xs h-10"
                >
                  <MessageSquare className="h-4 w-4 text-accent" />
                  <span>Open Chat</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onOpenParticipants();
                    onClose();
                  }}
                  className="w-full justify-start gap-2.5 text-xs h-10"
                >
                  <Users className="h-4 w-4 text-accent" />
                  <span>People List</span>
                </Button>
              </div>

              {/* Quick Reactions Palette */}
              <div className="pt-3 border-t border-border/70">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Reactions
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onSendReaction(emoji);
                      }}
                      className="h-9 rounded-btn bg-surface hover:bg-surface-hover flex items-center justify-center text-lg active:scale-90 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Leave Meeting Action */}
            <div className="pt-4 border-t border-border mt-4">
              <Button
                variant="destructive"
                size="default"
                onClick={onLeave}
                className="w-full gap-2 text-xs font-semibold h-11"
              >
                <PhoneOff className="h-4 w-4" />
                <span>Leave Call</span>
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
