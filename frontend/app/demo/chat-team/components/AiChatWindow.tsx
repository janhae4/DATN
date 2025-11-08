"use client";

import React, { useCallback } from "react";
import { AiPromptInput } from "./AiPromptInput";
import { AiMessageList } from "./AiMessageList";
import { useChatStore } from "../store/useChatStore";
import { CurrentUser } from "../types/type";
import { useShallow } from "zustand/shallow";
import { MessageList } from "./MessageList";

interface AiChatWindowProps {
  chatboxRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  currentUser: CurrentUser;

  discussionId: string; // ĐÃ THAY ĐỔI
  isLoadingInitialMessages: boolean;
  handleSendAiMessage: () => void;
  handleLoadMoreMessages: () => void;
}

export function AiChatWindow({
  chatboxRef,
  messagesEndRef,
  currentUser,
  discussionId, // ĐÃ THAY ĐỔI
  isLoadingInitialMessages,
  handleSendAiMessage,
  handleLoadMoreMessages,
}: AiChatWindowProps) {
  console.log("Rendering AiChatWindow for discussionId:", discussionId);
  const { prompt, isStreaming, setPrompt } = useChatStore(
    useShallow((state) => ({
      prompt: state.currentPrompt || "",
      isStreaming: state.isStreamingResponse || false,
      setPrompt: state.setPrompt,
    }))
  );

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      <MessageList
        currentUser={currentUser}
        selectedConversationId={discussionId}
      />
      <AiPromptInput
        prompt={prompt}
        setPrompt={(e) => setPrompt(e)}
        isStreaming={isStreaming}
        handleSendAiMessage={handleSendAiMessage}
      />
    </div>
  );
}
