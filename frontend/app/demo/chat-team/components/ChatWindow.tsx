"use client";
import React, { useState, useCallback } from "react";
import { Users as UsersIcon } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { TeamAiKnowledgePage } from "./AiKnowledge";
import { SearchPanel } from "./SearchPanel";
import { useChatStore } from "../store/useChatStore";
import { ManageMembersModal } from "./modals/ManageMemberModal";
import { MessageList } from "./MessageList";

export function ChatWindow({
  currentUser,
  selectedConversation,
}: {
  currentUser: User;
  selectedConversation: Conversation;
}) {
  const [activeTab, setActiveTab] = useState<"discussion" | "ai">("discussion");
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] =
    useState(false);

  const [isSearchActive, setIsSearchActive] = useState(false);

  const {
    updateConversationInList,
    setSelectedConversation,
    loadInitialConversations,
  } = useChatStore();

  const onConversationUpdated = useCallback(
    (updatedConversation: Conversation) => {
      updateConversationInList(updatedConversation);
      setIsManageMembersModalOpen(false);
    },
    [updateConversationInList]
  );

  const onUserLeave = useCallback(() => {
    setIsManageMembersModalOpen(false);
    setSelectedConversation(null);
    loadInitialConversations();
  }, [setSelectedConversation, loadInitialConversations]);

  return (
    <>
      {selectedConversation.isGroupChat && (
        <ManageMembersModal
          isOpen={isManageMembersModalOpen}
          onClose={() => setIsManageMembersModalOpen(false)}
          conversation={selectedConversation}
          currentUser={currentUser}
          onUserLeave={onUserLeave}
          onConversationUpdated={onConversationUpdated}
        />
      )}

      <ChatHeader
        currentUser={currentUser}
        selectedConversation={selectedConversation}
        onManageMembers={() => setIsManageMembersModalOpen(true)}
        onSearch={() => setIsSearchActive(true)}
      />

      {selectedConversation.isGroupChat && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 pt-2 flex items-center gap-4">
          <button
            onClick={() => setActiveTab("discussion")}
            className={`py-2 text-sm font-medium border-b-2 ${
              activeTab === "discussion"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <UsersIcon className="w-4 h-4 inline-block mr-1.5" />
            Thảo luận Team
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`py-2 text-sm font-medium border-b-2 ${
              activeTab === "ai"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {/* ... (icon AI) ... */}
            AI Knowledge Base
          </button>
        </div>
      )}

      {/* Logic render 2 tab chính */}
      {activeTab === "discussion" ? (
        isSearchActive ? ( // <-- Logic render conditional
          <SearchPanel
            conversationId={selectedConversation._id}
            onClose={() => setIsSearchActive(false)} // <-- Tắt tìm kiếm
          />
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <MessageList
              currentUser={currentUser}
              selectedConversationId={selectedConversation._id}
            />
            <MessageInput
              currentUser={currentUser}
              selectedConversation={selectedConversation}
            />
          </div>
        )
      ) : (
        <TeamAiKnowledgePage
          key={selectedConversation._id}
          teamId={selectedConversation.teamId || ""}
          currentUser={currentUser}
        />
      )}
    </>
  );
}
