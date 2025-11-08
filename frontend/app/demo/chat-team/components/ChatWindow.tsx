"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Users as UsersIcon } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { SearchPanel } from "./SearchPanel";
import { useChatStore } from "../store/useChatStore";
import { ManageMembersModal } from "./modals/ManageMemberModal";
import { MessageList } from "./MessageList";
import { Discussion, CurrentUser, Team } from "../types/type";
import { useShallow } from "zustand/shallow";
import { useKnowledgeFiles } from "../hooks/useKnowledgeFile";
import { KnowledgeSidebar } from "./KnowledgeSidebar";

export function ChatWindow({
  currentUser,
  selectedDiscussion,
  activeTab,
}: {
  currentUser: CurrentUser;
  selectedDiscussion: Discussion;
  activeTab: "team" | "ai";
}) {
  const [subActiveTab, setSubActiveTab] = useState<"discussion" | "ai">();
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] =
    useState(false);

  const [isSearchActive, setIsSearchActive] = useState(false);

  const {
    loadInitialDiscussions,
    updateDiscussionInList,
    loadMessages,
    setSelectedDiscussion,
    setChatMode,
    chatMode,
  } = useChatStore(
    useShallow((state) => ({
      loadInitialDiscussions: state.loadInitialDiscussions,
      updateDiscussionInList: state.updateDiscussionInList,
      loadMessages: state.loadMessages,
      setSelectedDiscussion: state.setSelectedDiscussion,
      setChatMode: state.setChatMode,
      setMessageForDiscussion: state.setMessagesForDiscussion,
      chatMode: state.chatMode,
    }))
  );

  const {
    files,
    isLoadingFiles,
    isUploading,
    uploadStatus,
    fileInputRef,
    fileContainerRef,
    endFileRef,
    isViewerOpen,
    viewingFile,
    isLoadingMore,
    handleFileUpload,
    handleFileDelete,
    handleOpenFileViewer,
    handleCloseFileViewer,
    handleRenameSuccess,
  } = useKnowledgeFiles(selectedDiscussion.teamId);

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
    if (activeTab === "team") {
      setSubActiveTab("discussion");
    }
  }, [activeTab]);

  useEffect(() => {
    console.log("CHAT WINDOW RENDERED");
    if (!selectedDiscussion?._id) return;
    const mode = subActiveTab === "discussion" ? "team" : "ai";
    console.log("Mode:", mode);
    console.log(subActiveTab);
    setChatMode(mode);
    loadMessages(1, 10, mode);
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

      {activeTab === "team" &&
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
      <div className="flex-1 overflow-hidden flex">
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

        {chatMode === "ai" && (
          <KnowledgeSidebar
            files={files}
            isLoadingFiles={false}
            isUploading={false}
            uploadStatus={""}
            fileInputRef={fileInputRef}
            fileContainerRef={fileContainerRef}
            endFileRef={endFileRef}
            isLoadingMore={false}
            handleFileUpload={handleFileUpload}
            handleFileDelete={handleFileDelete}
            handleOpenFileViewer={handleOpenFileViewer}
            handleSummarize={() => {}}
          />
        )}
      </div>
    </>
  );
}
