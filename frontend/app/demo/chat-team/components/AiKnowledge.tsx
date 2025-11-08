"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

import { CurrentUser, KnowledgeFile } from "../types/type";
import { AiChatWindow } from "./AiChatWindow";
import { KnowledgeSidebar } from "./KnowledgeSidebar";
import { useKnowledgeFiles } from "../hooks/useKnowledgeFile";
import { useChatStore } from "../store/useChatStore";
import { useSocket } from "@/app/SocketContext";
import { useInfiniteScroll } from "../hooks/useInfiniteroll";
import { useShallow } from "zustand/shallow";

const FileViewerModal = dynamic(
  () => import("./fileViewModal").then((mod) => mod.FileViewerModal),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Loader2 className="animate-spin text-white h-10 w-10" />
      </div>
    ),
  }
);

const getTeamAiDiscussionId = (teamId?: string) => {
  if (!teamId) return "personal_ai";
  return `team_ai_${teamId}`;
};

export function AiKnowledgePage({
  currentUser,
  teamId,
}: {
  currentUser: CurrentUser;
  teamId?: string;
}) {
  const { socket } = useSocket();
  const {
    files,
    isLoadingFiles,
    isUploading,
    uploadStatus,
    fileInputRef,
    fileContainerRef,
    endFileRef,
    isLoadingMore,
    isViewerOpen,
    viewingFile,
    handleFileUpload,
    handleFileDelete,
    handleOpenFileViewer,
    handleCloseFileViewer,
    handleRenameSuccess,
  } = useKnowledgeFiles(teamId);

  const aiDiscussionId: string = useMemo(
    () => getTeamAiDiscussionId(teamId),
    [teamId]
  );

  const chatboxRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const {
    messages,
    messagesLoaded,
    isHistoryLoading,
    hasMore,
    loadMessages,
    sendAiMessage,
    summarizeAiDocument,
    setSelectedDiscussion,
  } = useChatStore(
    useShallow((state) => ({
      messages: state.messages,
      messagesLoaded: state.messages !== undefined,
      isHistoryLoading: state.isHistoryLoading || false,
      hasMore: state.hasMoreMessages!== false,
      loadMessages: state.loadMessages,
      sendAiMessage: state.sendAiMessage,
      summarizeAiDocument: state.summarizeAiDocument,
      setSelectedDiscussion: state.setSelectedDiscussion,
    }))
  );

  useEffect(() => {
    if (aiDiscussionId && !messagesLoaded) {
      setIsLoadingInitial(true);
    } else {
      setIsLoadingInitial(false);
    }
  }, [aiDiscussionId, messagesLoaded, currentUser, teamId]);

  useEffect(() => {
    if (!isLoadingInitial) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isLoadingInitial]);

  const handleSend = () => {
    if (socket) {
      sendAiMessage(aiDiscussionId, currentUser, socket, teamId);
    }
  };

  const handleLoadMore = useCallback(async () => {
    if (isHistoryLoading || !hasMore || !chatboxRef.current) return;

    const container = chatboxRef.current;
    const oldScrollHeight = container.scrollHeight;
    const oldScrollTop = container.scrollTop;

    const newMessagesCount = await loadMoreAiMessages(aiDiscussionId);

    if (newMessagesCount > 0) {
      requestAnimationFrame(() => {
        container.scrollTop =
          container.scrollHeight - oldScrollHeight + oldScrollTop;
      });
    }
  }, [isHistoryLoading, hasMore, aiDiscussionId, chatboxRef]);

  const handleSummarize = (file: KnowledgeFile) => {
    if (socket) {
      summarizeAiDocument(aiDiscussionId, currentUser, socket, file, teamId);
    }
  };

  useInfiniteScroll({
    containerRef: chatboxRef,
    endRef: messagesEndRef,
    loadOlder: handleLoadMore,
    count: messages.length,
    isLoadingOlder: isHistoryLoading,
  });

  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        <AiChatWindow
          chatboxRef={chatboxRef}
          messagesEndRef={messagesEndRef}
          currentUser={currentUser}
          discussionId={aiDiscussionId}
          isLoadingInitialMessages={isLoadingInitial}
          handleSendAiMessage={handleSend}
          handleLoadMoreMessages={handleLoadMore}
        />

        <KnowledgeSidebar
          files={files || []}
          isLoadingFiles={isLoadingFiles}
          isUploading={isUploading}
          uploadStatus={uploadStatus}
          fileInputRef={fileInputRef}
          fileContainerRef={fileContainerRef}
          endFileRef={endFileRef}
          isLoadingMore={isLoadingMore}
          handleFileUpload={handleFileUpload}
          handleFileDelete={handleFileDelete}
          handleOpenFileViewer={handleOpenFileViewer}
          handleSummarize={handleSummarize}
        />
      </div>

      {viewingFile && (
        <FileViewerModal
          isOpen={isViewerOpen}
          onClose={handleCloseFileViewer}
          fileId={viewingFile.id}
          originalName={viewingFile.name}
          fileType={viewingFile.type || "other"}
          onRenameSuccess={handleRenameSuccess}
          teamId={teamId}
        />
      )}
    </>
  );
}
