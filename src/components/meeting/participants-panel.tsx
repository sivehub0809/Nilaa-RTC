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

  const getInviteUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin + "/" + meetingCode;
    }
    return "";
  };

  const handleShareFacebook = () => {
    const url = getInviteUrl();
    const fbUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=0&redirect_uri=${encodeURIComponent(url)}`;
    window.open(fbUrl, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const handleShareTelegram = () => {
    const url = getInviteUrl();
    const text = `Join my Nilaa RTC meeting: ${url}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const handleShareInstagram = () => {
    // Instagram doesn't have a direct share-to-DM API; copy link and open Instagram
    const url = getInviteUrl();
    navigator.clipboard.writeText(url);
    toast.success("Meeting link copied — paste it in your Instagram chat");
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
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
      <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white space-y-3 shrink-0">
        <div className="flex items-center gap-2.5">
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

        {/* Social Share Row */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mr-1">Share via</span>

          {/* Facebook / Messenger */}
          <button
            type="button"
            onClick={handleShareFacebook}
            className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title="Share via Facebook Messenger"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-700 fill-current">
              <path d="M12 2.04C6.5 2.04 2 6.13 2 11.22c0 2.88 1.42 5.45 3.65 7.15V22l3.46-1.9c.92.26 1.9.4 2.89.4 5.5 0 10-4.09 10-9.18S17.5 2.04 12 2.04zm1.03 12.37-2.54-2.72L6 14.41l4.89-5.19 2.6 2.72L18 8.82l-4.97 5.59z" />
            </svg>
          </button>

          {/* Telegram */}
          <button
            type="button"
            onClick={handleShareTelegram}
            className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title="Share via Telegram"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-700 fill-current">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </button>

          {/* Instagram */}
          <button
            type="button"
            onClick={handleShareInstagram}
            className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title="Share via Instagram"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-700 fill-current">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
