"use client";

import { useEffect, useState } from "react";
import { ChatSidebar } from "./components/ChatSideBar";
import { ChatWindow } from "./components/ChatWindow";
import { useSocketHandler } from "./hooks/useSocketHandler";
import { useChatStore } from "./store/useChatStore";
import { CurrentUser } from "./types/type";
import { useShallow } from "zustand/shallow";

export function ChatPage({
  currentUser,
  onLogout,
}: {
  currentUser: CurrentUser;
  onLogout: () => void;
}) {
  useSocketHandler();

  const { selectedDiscussion, visibleDiscussions } = useChatStore(
    useShallow((state) => ({
      selectedDiscussion: state.selectedDiscussion,
      visibleDiscussions: state.visibleDiscussions,
    }))
  );

  const teamChatPlaceholder = (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-gray-500 text-center px-4">
        {visibleDiscussions.length > 0
          ? "Chọn một cuộc hội thoại để bắt đầu trò chuyện."
          : "Bạn chưa có cuộc trò chuyện nào. Hãy tạo mới!"}
      </p>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      <ChatSidebar currentUser={currentUser} onLogout={onLogout} />

      <main className="flex-1 flex flex-col bg-gray-100">
        {selectedDiscussion ? (
          <ChatWindow
            currentUser={currentUser}
            selectedDiscussion={selectedDiscussion}
          />
        ) : (
          teamChatPlaceholder
        )}
      </main>
    </div>
  );
}
