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

export function ChatSidebar({
  currentUser,
  onLogout,
}: {
  currentUser: User;
  onLogout: () => void;
}) {
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);

  const {
    ensureConversationVisible,
    moveConversationToTop,
    setSelectedConversation,
  } = useChatStore();

  const handleChatCreated = useCallback(
    (newConversation: Conversation & CreateTeam) => {
      const id = newConversation.id || newConversation._id;
      ensureConversationVisible(id, async () => newConversation).then(() => {
        moveConversationToTop(id);
        setSelectedConversation(newConversation);
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

        <ConversationList
          currentUser={currentUser}
          onSelectConversation={setSelectedConversation}
        />

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
