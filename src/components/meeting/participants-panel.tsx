"use client";

import { X, Users, Mic, MicOff, Video, VideoOff, Crown, Hand, MoreVertical, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ParticipantItem {
  id: string;
  name: string;
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
  onMuteParticipant?: (id: string) => void;
  onRemoveParticipant?: (id: string) => void;
  onClose: () => void;
}

export function ParticipantsPanel({
  participants,
  isCurrentUserHost = false,
  onMuteParticipant,
  onRemoveParticipant,
  onClose,
}: ParticipantsPanelProps) {
  return (
    <div className="flex flex-col h-full bg-card border-l border-border w-full sm:w-80 md:w-96">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          <h3 className="font-heading font-bold text-sm text-foreground">
            People
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            ({participants.length}/15)
          </span>
        </div>
        <Button variant="ghost" size="iconSm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-2.5 rounded-btn bg-surface/60 hover:bg-surface border border-transparent hover:border-border transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface border border-border text-xs font-bold text-foreground">
                {p.name.charAt(0).toUpperCase()}
                {p.isHost && (
                  <Crown className="absolute -top-1.5 -right-1 h-3.5 w-3.5 text-accent fill-accent" />
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {p.name}
                  </span>
                  {p.isSelf && (
                    <span className="text-[10px] text-muted-foreground">(You)</span>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-0.5">
                  {p.isHost && (
                    <Badge variant="accent" className="text-[9px] px-1 py-0 h-3.5 font-normal">
                      Host
                    </Badge>
                  )}
                  {p.isGuest && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal">
                      Guest
                    </Badge>
                  )}
                  {p.isHandRaised && (
                    <span className="flex items-center gap-0.5 text-[10px] text-yellow-400 font-medium">
                      <Hand className="h-3 w-3 fill-yellow-400" /> Raised Hand
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Media status & Host actions */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-muted-foreground">
                {p.isMuted ? (
                  <MicOff className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <Mic className="h-3.5 w-3.5 text-accent" />
                )}
                {p.isVideoOff ? (
                  <VideoOff className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <Video className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>

              {/* Host Control Actions */}
              {isCurrentUserHost && !p.isSelf && (
                <div className="flex items-center gap-1 ml-1 border-l border-border pl-1.5">
                  {!p.isMuted && onMuteParticipant && (
                    <Button
                      variant="ghost"
                      size="iconSm"
                      className="h-7 w-7 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => onMuteParticipant(p.id)}
                      title="Mute participant"
                    >
                      <MicOff className="h-3 w-3" />
                    </Button>
                  )}
                  {onRemoveParticipant && (
                    <Button
                      variant="ghost"
                      size="iconSm"
                      className="h-7 w-7 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveParticipant(p.id)}
                      title="Remove participant"
                    >
                      <Ban className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
