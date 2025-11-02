"use client";
import React, { useState, useCallback } from "react";
import {
  LogOut as LogOutIcon,
  Plus as PlusIcon,
  Users as UsersIcon,
} from "lucide-react";

import { useChatStore } from "../store/useChatStore";
import { NewChatModal } from "./modals/CreateChatModal";
import { ConversationList } from "./ConversationList";
import { CreateTeamModal } from "./modals/CreateTeamModal";
import { CreateTeam, CurrentUser } from "../types/type";
import { ApiService } from "../services/api-service";

export function ChatSidebar({
  currentUser,
  onLogout,
  chatMode,
  setChatMode,
}: {
  currentUser: CurrentUser;
  onLogout: () => void;
  chatMode: "team" | "ai";
  setChatMode: (mode: "team" | "ai") => void;
}) {
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);

  const {
    ensureConversationVisible,
    moveConversationToTop,
    setSelectedConversation,
  } = useChatStore();

  const handleChatCreated = useCallback(
    (newConversation: CreateTeam) => {
      const id = newConversation.id
      ensureConversationVisible(id, async () => await ApiService.getConversationByTeamId(id)).then(() => {
        moveConversationToTop({teamId: id});
        setSelectedConversation({teamId: id});
      });
      setIsNewChatModalOpen(false);
      setIsCreateTeamModalOpen(false);
    },
    [ensureConversationVisible, moveConversationToTop, setSelectedConversation]
  );

  return (
    <>
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onChatCreated={handleChatCreated}
      />
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onChatCreated={handleChatCreated}
      />

      <aside className="w-1/4 xl:w-1/5 bg-white flex flex-col border-r border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Chat</h1>
          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <LogOutIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChatMode("team")}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                chatMode === "team"
                  ? "bg-white shadow text-indigo-600"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Team Chat
            </button>
            <button
              onClick={() => setChatMode("ai")}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                chatMode === "ai"
                  ? "bg-white shadow text-indigo-600"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              AI Cá nhân
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatMode === "team" ? (
            <ConversationList
              currentUser={currentUser}
              onSelectConversation={setSelectedConversation}
            />
          ) : (
            <div className="p-4 text-sm text-gray-500 text-center">
              <p>
                Trò chuyện riêng tư với AI. Lịch sử của bạn sẽ được lưu ở đây.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            <PlusIcon className="w-5 h-5" /> Trò chuyện mới
          </button>
          <button
            onClick={() => setIsCreateTeamModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            <UsersIcon className="w-5 h-5" /> Tạo Team mới
          </button>
        </div>
      </aside>
    </>
  );
}
