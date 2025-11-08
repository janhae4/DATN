"use client";
import React, { useRef, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useMessageLoader } from "../hooks/useMessageLoader";
import { Message } from "./Message"; // (Component Message cũ của bạn)
import { CurrentUser } from "../types/type";

export function MessageList({
  currentUser,
  selectedDiscussionId,
}: {
  currentUser: CurrentUser;
  selectedDiscussionId: string;
}) {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    messagesEndRef,
    currentMessages,
    isLoadingMessages,
    isLoadingOlderMessages,
    currentHasMore,
    loadOlderMessages,
  } = useMessageLoader(selectedDiscussionId, chatContainerRef);

  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 50 && !isLoadingOlderMessages && currentHasMore) {
      loadOlderMessages();
    }
  }, [isLoadingOlderMessages, currentHasMore, loadOlderMessages]);

  return (
    <main
      ref={chatContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4"
      style={{ scrollBehavior: "auto" }} // Đảm bảo cuộn tức thì khi tải
    >
      {isLoadingOlderMessages && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
        </div>
      )}

      {isLoadingMessages && currentMessages.length === 0 && (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
        </div>
      )}

      {!isLoadingMessages && currentMessages.length === 0 && (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-500">Chưa có tin nhắn nào.</p>
        </div>
      )}

      {currentMessages.map((msg: any) => {
        if (!msg || !msg.sender) return null;
        return (
          <Message
            key={msg._id}
            message={msg}
            isCurrentUser={msg.sender._id === currentUser.id}
          />
        );
      })}

      <div ref={messagesEndRef} style={{ height: "1px" }} />
    </main>
  );
}
