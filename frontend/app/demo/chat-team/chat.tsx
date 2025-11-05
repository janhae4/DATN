"use client";

import { useEffect, useState } from "react";
import { ChatSidebar } from "./components/ChatSideBar";
import { ChatWindow } from "./components/ChatWindow";
import { useSocketHandler } from "./hooks/useSocketHandler";
import { useChatStore } from "./store/useChatStore";
import { CurrentUser } from "./types/type";
import { PersonalAiChat } from "./components/PersonalAiChat";

export function ChatPage({
  currentUser,
  onLogout,
}: {
  currentUser: CurrentUser;
  onLogout: () => void;
}) {
  useSocketHandler();

  const [chatMode, setChatMode] = useState<"team" | "ai">("team");

  const selectedConversation = useChatStore(
    (state) => state.selectedDiscussion
  );

  const teamChatPlaceholder = (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-gray-500 text-center px-4">
        {useChatStore.getState().visibleDiscussions.length > 0
          ? "Chọn một cuộc hội thoại để bắt đầu trò chuyện."
          : "Bạn chưa có cuộc trò chuyện nào. Hãy tạo mới!"}
      </p>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      <ChatSidebar
        currentUser={currentUser}
        onLogout={onLogout}
        chatMode={chatMode}
        setChatMode={setChatMode}
      />

      <main className="flex-1 flex flex-col bg-gray-100">
        {chatMode === "team" ? (
          selectedConversation ? (
            <ChatWindow
              key={selectedConversation._id}
              currentUser={currentUser}
              selectedConversation={selectedConversation}
            />
          ) : (
            teamChatPlaceholder
          )
        ) : (
          <PersonalAiChat currentUser={currentUser} />
        )}
      </main>
    </div>
  );
}
