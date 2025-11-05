"use client";

import React, { useCallback } from "react";
import { Loader2, Sparkles, ChevronUp } from "lucide-react";
import { CurrentUser, TeamRole } from "../types/type";
import { Message } from "./Message"; // Giả sử component Message của bạn
import { ChatState, useChatStore } from "../store/useChatStore";

interface AiMessageListProps {
  chatboxRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  currentUser: CurrentUser;

  discussionId: string; // ĐÃ THAY ĐỔI
  handleLoadMoreMessages: () => void;
  isLoadingInitialMessages: boolean;
}

export function AiMessageList({
  chatboxRef,
  messagesEndRef,
  currentUser,
  discussionId, // ĐÃ THAY ĐỔI
  handleLoadMoreMessages,
  isLoadingInitialMessages,
}: AiMessageListProps) {
  const selector = useCallback(
    (state: ChatState) => {
      const msgs = state.messages[discussionId] || [];
      return {
        messages: msgs ,
        hasMore: state.hasMoreMessages[discussionId] !== false,
        isStreaming: state.streamingResponses[discussionId] || false,
        isHistoryLoading: state.historyLoading[discussionId] || false,
      };
    },
    [discussionId]
  );

  const { messages, hasMore, isStreaming, isHistoryLoading } =
    useChatStore(selector);

  return (
    <div
      ref={chatboxRef}
      className="flex-1 p-6 overflow-y-auto space-y-6"
      style={{ scrollBehavior: "auto" }}
    >
      {isLoadingInitialMessages && messages.length === 0 ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
        </div>
      ) : !isLoadingInitialMessages && messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <Sparkles size={64} className="mb-4 text-indigo-500" />
          <h2 className="text-2xl font-semibold text-slate-700">
            AI Knowledge Base
          </h2>
          <p>Hỏi AI về tài liệu của team bạn.</p>
        </div>
      ) : (
        <>
          {hasMore && (
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

          {messages.map((msg, index) => {
            const isThisMessageStreaming =
              isStreaming &&
              index === messages.length - 1 &&
              msg.sender.role === TeamRole.AI;

            return (
              <Message
                key={msg._id}
                message={msg}
                isCurrentUser={msg.sender._id === currentUser.id}
                isStreaming={isThisMessageStreaming}
              />
            );
          })}
        </>
      )}

      <div ref={messagesEndRef} style={{ height: "1px" }} />
    </div>
  );
}
