"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

import { CurrentUser } from "../types/type";
import { useAiChat } from "../hooks/useAiChat";
import { AiChatWindow } from "./AiChatWindow";
import { KnowledgeSidebar } from "./KnowledgeSidebar";
import { useKnowledgeFiles } from "../hooks/useKnowledgeFile";

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

export function AiKnowledgePage({
  currentUser,
  teamId,
}: {
  currentUser: CurrentUser;
  teamId?: string;
}) {
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

  const {
    aiMessages,
    prompt,
    setPrompt,
    isStreaming,
    isLoadingMessages,
    isHistoryLoading,
    messagePagination,
    chatboxRef,
    messagesEndRef,
    handleSendAiMessage,
    handleSummarize,
    handleLoadMoreMessages,
  } = useAiChat(currentUser, teamId);

  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        <AiChatWindow
          aiMessages={aiMessages}
          prompt={prompt}
          setPrompt={setPrompt}
          isStreaming={isStreaming}
          isLoadingMessages={isLoadingMessages}
          isHistoryLoading={isHistoryLoading}
          messagePagination={messagePagination}
          chatboxRef={chatboxRef}
          messagesEndRef={messagesEndRef}
          currentUser={currentUser}
          activeConversationId={null}
          handleSendAiMessage={handleSendAiMessage}
          handleLoadMoreMessages={handleLoadMoreMessages}
          teamId={teamId || ""}
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
          onRenameSuccess={() => {}}
          teamId={teamId}
        />
      )}
    </>
  );
}
