"use client";
import React, { useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useMessageLoader } from "../hooks/useMessageLoader";
import { Message } from "./Message"; // (Component Message cũ của bạn)
import { CurrentUser, User } from "../types/type";

export function MessageList({
  currentUser,
  selectedConversationId,
}: {
  currentUser: CurrentUser;
  selectedConversationId: string;
}) {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Toàn bộ logic được lấy từ hook này
  const {
    messagesEndRef,
    currentMessages,
    isLoadingMessages,
    isLoadingOlderMessages,
    currentHasMore,
    loadOlderMessages,
  } = useMessageLoader(selectedConversationId, chatContainerRef);

  // Callback để xử lý cuộn, gọi logic từ hook
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    // Nếu cuộn gần lên đỉnh, tải tin nhắn cũ
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
      {/* Spinner khi tải tin nhắn cũ (ở trên cùng) */}
      {isLoadingOlderMessages && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
        </div>
      )}

      {/* Spinner khi tải lần đầu */}
      {isLoadingMessages && currentMessages.length === 0 && (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
        </div>
      )}

      {/* Khi không có tin nhắn */}
      {!isLoadingMessages && currentMessages.length === 0 && (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-500">Chưa có tin nhắn nào.</p>
        </div>
      )}

      {/* Render danh sách tin nhắn */}
      {currentMessages.map((msg: any) => {
        if (!msg || !msg.sender) return null;
        return (
          <Message
            key={msg._id || msg.createdAt}
            message={msg}
            isCurrentUser={msg.sender._id === currentUser.id}
          />
        );
      })}

      {/* Thẻ div trống để cuộn xuống dưới cùng */}
      <div ref={messagesEndRef} style={{ height: "1px" }} />
    </main>
  );
}
