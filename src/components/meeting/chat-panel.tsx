"use client";

import { useEffect, useRef, useState } from "react";
import { Send, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col h-full bg-white border-l border-slate-200 w-full select-text">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <h3 className="font-heading font-bold text-sm text-slate-900">
            In-Call Chat
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            ({messages.length})
          </span>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          title="Close chat"
          aria-label="Close chat panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs p-6 space-y-2">
            <MessageSquare className="h-8 w-8 text-slate-300 stroke-[1.5]" />
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
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-700">
                  {msg.isSelf ? "You" : msg.senderName}
                </span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>
              <div
                className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm max-w-[85%] break-words leading-relaxed shadow-xs ${
                  msg.isSelf
                    ? "bg-blue-600 text-white font-medium"
                    : "bg-white border border-slate-200 text-slate-800"
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form - Comfortable Touch Height */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 flex items-center gap-2 bg-white shrink-0">
        <input
          type="text"
          placeholder="Send a message to everyone..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-11 px-3.5 text-xs sm:text-sm flex-1 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
