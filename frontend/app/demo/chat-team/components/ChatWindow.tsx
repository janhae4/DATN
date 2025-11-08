"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Users as UsersIcon } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { SearchPanel } from "./SearchPanel";
import { useChatStore } from "../store/useChatStore";
import { ManageMembersModal } from "./modals/ManageMemberModal";
import { MessageList } from "./MessageList";
import { AiKnowledgePage } from "./AiKnowledge";
import { Discussion, CurrentUser, Team } from "../types/type";
import { useShallow } from "zustand/shallow";

export function ChatWindow({
  currentUser,
  selectedDiscussion,
}: {
  currentUser: CurrentUser;
  selectedDiscussion: Discussion;
}) {
  const [subActiveTab, setSubActiveTab] = useState<"discussion" | "ai">(
    "discussion"
  );
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] =
    useState(false);

  const [isSearchActive, setIsSearchActive] = useState(false);

  const {
    loadInitialDiscussions,
    updateDiscussionInList,
    loadAiTeamMessages,
    loadMessages,
    setSelectedDiscussion,
    setChatMode,
    setMessageForDiscussion,
    chatMode,
  } = useChatStore(
    useShallow((state) => ({
      loadInitialDiscussions: state.loadInitialDiscussions,
      updateDiscussionInList: state.updateDiscussionInList,
      loadAiTeamMessages: state.loadAiTeamMessages,
      loadMessages: state.loadMessages,
      setSelectedDiscussion: state.setSelectedDiscussion,
      setChatMode: state.setChatMode,
      setMessageForDiscussion: state.setMessagesForDiscussion,
      chatMode: state.chatMode,
    }))
  );

  const onDiscussionUpdated = useCallback(
    (updatedDiscussion: Team) => {
      console.log("Updated Discussion:", updatedDiscussion);
      updateDiscussionInList(updatedDiscussion);
      setIsManageMembersModalOpen(false);
    },
    [updateDiscussionInList]
  );

  const onUserLeave = useCallback(() => {
    setIsManageMembersModalOpen(false);
    setSelectedDiscussion({});
    loadInitialDiscussions("team");
  }, [setSelectedDiscussion, loadInitialDiscussions]);

  useEffect(() => {
    setMessageForDiscussion([], 1, true);

    if (chatMode === "team") {
      if (subActiveTab === "ai") {
        setSubActiveTab("ai");
        loadAiTeamMessages(selectedDiscussion?.teamId!, 1, 10);
      } else if (subActiveTab === "discussion") {
        setSubActiveTab("discussion");
        loadMessages("team", selectedDiscussion._id, 1, 10);
      }
    } else {
      loadMessages("ai", selectedDiscussion?._id, 1, 10);
    }
  }, [subActiveTab, selectedDiscussion, chatMode]);

  return (
    <>
      {selectedDiscussion && selectedDiscussion!.isGroup && (
        <ManageMembersModal
          isOpen={isManageMembersModalOpen}
          onClose={() => setIsManageMembersModalOpen(false)}
          conversation={selectedDiscussion}
          currentUser={currentUser}
          onUserLeave={onUserLeave}
          onConversationUpdated={onDiscussionUpdated}
        />
      )}

      <ChatHeader
        currentUser={currentUser}
        selectedDiscussion={selectedDiscussion}
        onManageMembers={() => setIsManageMembersModalOpen(true)}
        onSearch={() => setIsSearchActive(true)}
      />

      {chatMode === "team" &&
        selectedDiscussion &&
        selectedDiscussion!.isGroup && (
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 pt-2 flex items-center gap-4">
            <button
              onClick={() => setSubActiveTab("discussion")}
              className={`py-2 text-sm font-medium border-b-2 ${
                subActiveTab === "discussion"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <UsersIcon className="w-4 h-4 inline-block mr-1.5" />
              Thảo luận Team
            </button>
            <button
              onClick={() => setSubActiveTab("ai")}
              className={`py-2 text-sm font-medium border-b-2 ${
                subActiveTab === "ai"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              AI Knowledge Base
            </button>
          </div>
        )}

      {isSearchActive && (
        <SearchPanel
          discussionId={selectedDiscussion?._id}
          onClose={() => setIsSearchActive(false)}
        />
      )}
      <div className="flex-1 overflow-hidden flex flex-col">
        <MessageList
          currentUser={currentUser}
          selectedDiscussionId={selectedDiscussion?._id}
        />
        <MessageInput
          currentUser={currentUser}
          selectedDiscussion={selectedDiscussion}
        />
      </div>
    </>
  );
}
