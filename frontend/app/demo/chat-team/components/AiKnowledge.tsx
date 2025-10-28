"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

import { CurrentUser } from "../types/type";
import { useTeamKnowledgeSocket } from "../hooks/useTeamAiSocket";
import { useTeamKnowledgeFiles } from "../hooks/useTeamKnowledgeFile";
import { useTeamAiChat } from "../hooks/useTeamAiChat";
import { AiChatWindow } from "./AiChatWindow";
import { KnowledgeSidebar } from "./KnowledgeSidebar";

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

export function TeamAiKnowledgePage({
  teamId,
  currentUser,
}: {
  teamId: string;
  currentUser: CurrentUser;
}) {
  const socket = useTeamKnowledgeSocket(teamId);

  const {
    files,
    isLoadingFiles,
    isUploading,
    uploadStatus,
    fileInputRef,
    isViewerOpen,
    viewingFile,
    handleFileUpload,
    handleFileDelete,
    handleOpenFileViewer,
    handleCloseFileViewer,
    handleRenameSuccess,
  } = useTeamKnowledgeFiles(teamId);

  const {
    aiMessages,
    prompt,
    setPrompt,
    isStreaming,
    isLoadingMessages,
    isHistoryLoading,
    messagePagination,
    chatboxRef,
    handleSendAiMessage,
    handleSummarize,
    handleLoadMoreMessages,
  } = useTeamAiChat(socket, teamId, currentUser);

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
          currentUser={currentUser}
          activeConversationId={null}
          teamId={teamId}
          handleSendAiMessage={handleSendAiMessage}
          handleLoadMoreMessages={handleLoadMoreMessages}
        />

        {/* Sidebar Knowledge Base */}
        <KnowledgeSidebar
          files={files || []}
          isLoadingFiles={isLoadingFiles}
          isUploading={isUploading}
          uploadStatus={uploadStatus}
          fileInputRef={fileInputRef}
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
          fileId={viewingFile.fileId}
          originalName={viewingFile.fileName}
          fileType={viewingFile.fileType || "other"}
          onRenameSuccess={handleRenameSuccess}
          teamId={teamId}
        />
      )}
    </>
  );
}
