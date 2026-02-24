// components/features/meeting/ChatPanel.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  isPrivate?: boolean;
  targetUserId?: string;
  targetUserName?: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (content: string, targetUserId?: string) => void;
  currentUserId?: string;
  peerNames?: Map<string, string>;
}

export function ChatPanel({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentUserId,
  peerNames,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [targetUserId, setTargetUserId] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim(), targetUserId === "all" ? undefined : targetUserId);
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full flex-shrink-0 bg-neutral-900/95 backdrop-blur-md border-l border-white/10 flex flex-col z-10 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Chat</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-500">
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.userId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
              >
                <div
                  className={`rounded-lg px-3 py-2 max-w-[85%] ${msg.isPrivate
                    ? isOwnMessage ? "bg-purple-600 text-white" : "bg-purple-900/50 border border-purple-500/50 text-white"
                    : isOwnMessage
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-800 text-white"
                    }`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-medium text-neutral-400 mb-1 flex items-center gap-1">
                      {msg.userName}
                      {msg.isPrivate && <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded ml-1">Private</span>}
                    </p>
                  )}
                  {isOwnMessage && msg.isPrivate && (
                    <p className="text-[10px] font-medium text-purple-200 mb-1">
                      Nhắn riêng cho {msg.targetUserName || peerNames?.get(msg.targetUserId!) || 'ai đó'}
                    </p>
                  )}
                  <p className="text-sm break-words">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${isOwnMessage ? "text-blue-200" : "text-neutral-500"}`}
                  >
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-neutral-900/90 flex flex-col gap-3">
        {peerNames && peerNames.size > 0 && (
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-xs bg-neutral-800/80 border-white/10 text-neutral-300 hover:bg-neutral-800 hover:text-white">
                  {targetUserId === "all" ? "Tất cả mọi người" : peerNames.get(targetUserId)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 bg-neutral-900 border-white/10 text-neutral-300 mb-2">
                <DropdownMenuItem
                  className="text-xs focus:bg-white/10 focus:text-white cursor-pointer"
                  onClick={() => setTargetUserId("all")}
                >
                  Tất cả mọi người
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuLabel className="text-[10px] text-neutral-500 uppercase tracking-wider">Trong phòng</DropdownMenuLabel>
                {Array.from(peerNames.entries()).map(([id, name]) => (
                  <DropdownMenuItem
                    key={id}
                    className="text-xs focus:bg-white/10 focus:text-white cursor-pointer"
                    onClick={() => setTargetUserId(id)}
                  >
                    {name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <div className="flex gap-2 relative">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus-visible:ring-blue-500"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
