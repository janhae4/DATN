"use client";

import React, { useCallback } from "react";
import { AiPromptInput } from "./AiPromptInput";
import { AiMessageList } from "./AiMessageList";
import { useChatStore } from "../store/useChatStore";
import { CurrentUser } from "../types/type";

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
  const selector = useCallback(
    (state: any) => ({
      prompt: state.prompts[discussionId] || "",
      isStreaming: state.streamingResponses[discussionId] || false,
      setPrompt: state.setPrompt,
    }),
    [discussionId]
  );

  const { prompt, isStreaming, setPrompt } = useChatStore(selector);

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      <AiMessageList
        chatboxRef={chatboxRef}
        messagesEndRef={messagesEndRef}
        currentUser={currentUser}
        discussionId={discussionId} // ĐÃ THAY ĐỔI
        isLoadingInitialMessages={isLoadingInitialMessages}
        handleLoadMoreMessages={handleLoadMoreMessages}
      />
      <AiPromptInput
        prompt={prompt}
        setPrompt={(e) => setPrompt(discussionId, e)}
        isStreaming={isStreaming}
        handleSendAiMessage={handleSendAiMessage}
      />
    </div>
  );
}
