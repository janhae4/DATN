"use client";

import { ChatSidebar } from "./components/ChatSideBar";
import { ChatWindow } from "./components/ChatWindow";
import { useSocketHandler } from "./hooks/useSocketHandler";
import { useChatStore } from "./store/useChatStore";



export function ChatPage({
  currentUser,
  onLogout,
}: {
  currentUser: User;
  onLogout: () => void;
}) {
  useSocketHandler();

  const selectedConversation = useChatStore(
    (state) => state.selectedConversation
  );

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      <ChatSidebar currentUser={currentUser} onLogout={onLogout} />

      <main className="flex-1 flex flex-col bg-gray-100">
        {selectedConversation ? (
          <ChatWindow
            key={selectedConversation._id}
            currentUser={currentUser}
            selectedConversation={selectedConversation}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-center px-4">
              {useChatStore.getState().visibleConversations.length > 0
                ? "Chọn một cuộc hội thoại để bắt đầu trò chuyện."
                : "Bạn chưa có cuộc trò chuyện nào. Hãy tạo mới!"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
