"use client";

import { X, Users, Mic, MicOff, Video, VideoOff, Crown, Hand, Ban, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface ParticipantItem {
  id: string;
  name: string;
  avatarUrl?: string;
  isHost?: boolean;
  isGuest?: boolean;
  isSelf?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isHandRaised?: boolean;
}

interface ParticipantsPanelProps {
  participants: ParticipantItem[];
  isCurrentUserHost?: boolean;
  meetingCode?: string;
  onMuteParticipant?: (id: string) => void;
  onRemoveParticipant?: (id: string) => void;
  onMuteAll?: () => void;
  onClose: () => void;
}

export function ParticipantsPanel({
  participants,
  isCurrentUserHost = false,
  meetingCode = "",
  onMuteParticipant,
  onRemoveParticipant,
  onMuteAll,
  onClose,
}: ParticipantsPanelProps) {
  const handleInvite = () => {
    if (typeof window !== "undefined") {
      const inviteUrl = window.location.origin + "/" + meetingCode;
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Meeting link copied to clipboard");
    }
  };
  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <h3 className="font-heading font-bold text-sm text-slate-900">
            People
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            ({participants.length}/15)
          </span>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          title="Close people panel"
          aria-label="Close people panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-slate-50/50">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden bg-sky-50 border border-sky-200 text-xs font-bold text-sky-700">
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{p.name.charAt(0).toUpperCase()}</span>
                )}
                {p.isHost && (
                  <Crown className="absolute -top-1.5 -right-1 h-3.5 w-3.5 text-yellow-500 fill-yellow-500 z-10" />
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {p.name}
                  </span>
                  {p.isSelf && (
                    <span className="text-[10px] text-slate-400">(You)</span>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-0.5">
                  {p.isHost && (
                    <Badge variant="accent" className="text-[9px] px-1 py-0 h-3.5 font-normal bg-blue-100 text-blue-700 border-blue-200">
                      Host
                    </Badge>
                  )}
                  {p.isHandRaised && (
                    <span className="flex items-center gap-0.5 text-[10px] text-yellow-600 font-medium">
                      <Hand className="h-3 w-3 fill-yellow-500" /> Raised Hand
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Media status & Host actions */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-slate-400">
                {p.isMuted ? (
                  <MicOff className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <Mic className="h-3.5 w-3.5 text-blue-600" />
                )}
                {p.isVideoOff ? (
                  <VideoOff className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <Video className="h-3.5 w-3.5 text-slate-500" />
                )}
              </div>

              {/* Host Control Actions (Only host can kick members; Host can never be kicked out) */}
              {isCurrentUserHost && !p.isSelf && !p.isHost && (
                <div className="flex items-center gap-1 ml-1 border-l border-slate-200 pl-1.5">
                  {!p.isMuted && onMuteParticipant && (
                    <button
                      className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors"
                      onClick={() => onMuteParticipant(p.id)}
                      title="Mute participant"
                    >
                      <MicOff className="h-3 w-3" />
                    </button>
                  )}
                  {onRemoveParticipant && (
                    <button
                      className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors"
                      onClick={() => onRemoveParticipant(p.id)}
                      title="Remove participant"
                    >
                      <Ban className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Zoom-Style Action Footer - Medium Well-Clickable Action Buttons */}
      <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={handleInvite}
          className="flex-1 h-11 sm:h-12 rounded-2xl bg-gradient-to-b from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100/90 text-sky-800 border border-sky-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
          title="Copy meeting invite link"
        >
          <Share2 className="h-4 w-4 text-sky-600 shrink-0" />
          <span>Invite</span>
        </button>

        {isCurrentUserHost && onMuteAll && (
          <button
            type="button"
            onClick={onMuteAll}
            className="flex-1 h-11 sm:h-12 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-red-700 border border-slate-200 hover:border-red-200 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Mute all other participants"
          >
            <MicOff className="h-4 w-4 text-red-500 shrink-0" />
            <span>Mute All</span>
          </button>
        )}
      </div>
    </div>
  );
}
