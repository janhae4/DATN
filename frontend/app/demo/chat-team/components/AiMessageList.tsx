"use client";

import React from "react";
import { Loader2, Sparkles, ChevronUp, Bot } from "lucide-react";
import { AiMessage, CurrentUser } from "../types/type";
import { Message } from "./Message";

interface AiMessageListProps {
  chatboxRef: React.RefObject<HTMLDivElement>;
  aiMessages: AiMessage[];
  currentUser: CurrentUser;
  isLoadingMessages: boolean;
  isStreaming: boolean;
  isHistoryLoading: boolean;
  messagePagination: { page: number; totalPages: number };
  activeConversationId: string | null;
  teamId: string;
  handleLoadMoreMessages: () => void;
}

export function AiMessageList({
  chatboxRef,
  aiMessages,
  currentUser,
  isLoadingMessages,
  isStreaming,
  isHistoryLoading,
  messagePagination,
  activeConversationId,
  teamId,
  handleLoadMoreMessages,
}: AiMessageListProps) {
  return (
    <div
      ref={chatboxRef}
      className="flex-1 p-6 overflow-y-auto space-y-6"
      style={{ scrollBehavior: "auto" }}
    >
      {/* 1. Trạng thái Tải lần đầu */}
      {isLoadingMessages && aiMessages.length === 0 ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
        </div>
      ) : /* 2. Trạng thái Rỗng (chưa có tin nhắn) */
      !isLoadingMessages && aiMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <Sparkles size={64} className="mb-4 text-indigo-500" />
          <h2 className="text-2xl font-semibold text-slate-700">
            AI Knowledge Base
          </h2>
          <p>Hỏi AI về tài liệu của team bạn.</p>
        </div>
      ) : (
        /* 3. Hiển thị tin nhắn */
        <>
          {/* Nút tải tin nhắn cũ hơn */}
          {messagePagination.page < messagePagination.totalPages && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMoreMessages}
                disabled={isHistoryLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 disabled:opacity-50"
              >
                {isHistoryLoading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <ChevronUp size={16} />
                )}
                Tải tin nhắn cũ hơn
              </button>
            </div>
          )}

          {aiMessages.map((msg, index) => {
            const messageProps = {
              _id: msg._id,
              content: msg.content,
              sender: {
                ...msg.sender,
                role: "MEMBER",
              },
              createdAt: msg.timestamp,
              conversationId: activeConversationId || teamId,
            } as MessageData;


            const isThisMessageStreaming =
              isStreaming &&
              index === aiMessages.length - 1 && // Là tin nhắn cuối
              msg.role === "ai"; // Và là của AI
            return (
              <Message
                key={msg._id}
                message={messageProps}
                isCurrentUser={msg.sender._id === currentUser.id}
                isStreaming={isThisMessageStreaming}
              />
            );
          })}
        </>
      )}

      <div style={{ height: "1px" }} />
    </div>
  );
}
