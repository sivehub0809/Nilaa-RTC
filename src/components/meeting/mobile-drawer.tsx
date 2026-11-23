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

              {/* Quick Audio & Video Toggles with Light Gradient */}
              <div className="space-y-2.5 mb-4">
                <button
                  type="button"
                  onClick={onToggleAudio}
                  className={`w-full flex items-center justify-start gap-3 text-xs h-11 px-3.5 rounded-xl font-medium transition-all duration-150 cursor-pointer active:scale-95 ${
                    isAudioEnabled
                      ? "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 border border-slate-200/90 shadow-xs"
                      : "bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-md shadow-red-500/20"
                  }`}
                >
                  {isAudioEnabled ? <Mic className="h-4 w-4 text-sky-600" /> : <MicOff className="h-4 w-4 text-white" />}
                  <span>{isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleVideo}
                  className={`w-full flex items-center justify-start gap-3 text-xs h-11 px-3.5 rounded-xl font-medium transition-all duration-150 cursor-pointer active:scale-95 ${
                    isVideoEnabled
                      ? "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 border border-slate-200/90 shadow-xs"
                      : "bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-md shadow-red-500/20"
                  }`}
                >
                  {isVideoEnabled ? <Video className="h-4 w-4 text-sky-600" /> : <VideoOff className="h-4 w-4 text-white" />}
                  <span>{isVideoEnabled ? "Stop Camera" : "Start Camera"}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleScreenShare}
                  className={`w-full flex items-center justify-start gap-3 text-xs h-11 px-3.5 rounded-xl font-medium transition-all duration-150 cursor-pointer active:scale-95 ${
                    isScreenSharing
                      ? "bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 border border-slate-200/90 shadow-xs"
                  }`}
                >
                  <Share2 className={`h-4 w-4 ${isScreenSharing ? "text-white" : "text-slate-600"}`} />
                  <span>{isScreenSharing ? "Stop Sharing" : "Share Screen"}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleHand}
                  className={`w-full flex items-center justify-start gap-3 text-xs h-11 px-3.5 rounded-xl font-medium transition-all duration-150 cursor-pointer active:scale-95 ${
                    isHandRaised
                      ? "bg-gradient-to-b from-amber-400 to-yellow-500 text-white shadow-md shadow-yellow-500/25"
                      : "bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 border border-slate-200/90 shadow-xs"
                  }`}
                >
                  <Hand className={`h-4 w-4 ${isHandRaised ? "text-white fill-white" : "text-slate-600"}`} />
                  <span>{isHandRaised ? "Lower Hand" : "Raise Hand"}</span>
                </button>
              </div>

              {/* Panels Navigation */}
              <div className="space-y-2.5 pt-3.5 border-t border-slate-200/80 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    onOpenChat();
                    onClose();
                  }}
                  className="w-full flex items-center justify-start gap-3 text-xs h-11 px-3.5 rounded-xl font-medium bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-all duration-150 cursor-pointer active:scale-95"
                >
                  <MessageSquare className="h-4 w-4 text-sky-600" />
                  <span>Open Chat</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenParticipants();
                    onClose();
                  }}
                  className="w-full flex items-center justify-start gap-3 text-xs h-11 px-3.5 rounded-xl font-medium bg-gradient-to-b from-white to-slate-100 hover:from-white hover:to-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-all duration-150 cursor-pointer active:scale-95"
                >
                  <Users className="h-4 w-4 text-sky-600" />
                  <span>People List</span>
                </button>
              </div>

              {/* Quick Reactions Palette */}
              <div className="pt-3.5 border-t border-slate-200/80">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Reactions
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onSendReaction(emoji);
                      }}
                      className="h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center text-lg active:scale-85 transition-all cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Leave Meeting Action */}
            <div className="pt-4 border-t border-slate-200/80 mt-4">
              <button
                type="button"
                onClick={onLeave}
                className="w-full flex items-center justify-center gap-2 text-xs font-medium h-11 rounded-xl bg-gradient-to-b from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-md shadow-red-500/25 transition-all duration-150 cursor-pointer active:scale-95"
              >
                <PhoneOff className="h-4 w-4" />
                <span>Leave Call</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
