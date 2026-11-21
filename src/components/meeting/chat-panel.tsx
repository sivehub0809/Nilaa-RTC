"use client";

import { useEffect, useRef, useState } from "react";
import { Send, X, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface ChatMessage {
  id: string;
  senderName: string;
  isGuest?: boolean;
  message: string;
  timestamp: string;
  isSelf?: boolean;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClose: () => void;
}

export function ChatPanel({ messages, onSendMessage, onClose }: ChatPanelProps) {
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText("");
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border w-full sm:w-80 md:w-96">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-accent" />
          <h3 className="font-heading font-bold text-sm text-foreground">
            In-Call Chat
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            ({messages.length})
          </span>
        </div>
        <Button variant="ghost" size="iconSm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground text-xs p-6 space-y-2">
            <MessageSquare className="h-8 w-8 text-surface stroke-[1.5]" />
            <p>No messages yet.</p>
            <p>Send a message to everyone in the room.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.isSelf ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {msg.isSelf ? "You" : msg.senderName}
                </span>
                {msg.isGuest && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                    Guest
                  </Badge>
                )}
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>
              <div
                className={`px-3.5 py-2 rounded-btn text-xs max-w-[85%] break-words leading-relaxed ${
                  msg.isSelf
                    ? "bg-accent text-accent-foreground font-medium"
                    : "bg-surface border border-border text-foreground"
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border flex items-center gap-2 bg-card">
        <Input
          type="text"
          placeholder="Send a message to everyone..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-10 text-xs flex-1"
        />
        <Button
          type="submit"
          variant="accent"
          size="iconSm"
          disabled={!text.trim()}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
