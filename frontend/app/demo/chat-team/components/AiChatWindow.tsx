import React from "react";
// (Import các component con và types)
import { AiPromptInput } from "./AiPromptInput";
import { AiMessageList } from "./AiMessageList";

interface AiChatWindowProps {
    aiMessages: any[];
    prompt: string;
    setPrompt: (value: string) => void;
    isStreaming: boolean;
    isLoadingMessages: boolean;
    isHistoryLoading: boolean;
    messagePagination: any;
    chatboxRef: any;
    currentUser: any;
    activeConversationId: string | null;
    teamId: string;
    handleSendAiMessage: () => void;
    handleLoadMoreMessages: () => void;
}

export function AiChatWindow({
  aiMessages,
  prompt,
  setPrompt,
  isStreaming,
  isLoadingMessages,
  isHistoryLoading,
  messagePagination,
  chatboxRef,
  currentUser,
  activeConversationId,
  teamId,
  handleSendAiMessage,
  handleLoadMoreMessages,
}: AiChatWindowProps) {
  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      <AiMessageList
        chatboxRef={chatboxRef}
        aiMessages={aiMessages}
        currentUser={currentUser}
        isLoadingMessages={isLoadingMessages}
        isStreaming={isStreaming}
        isHistoryLoading={isHistoryLoading}
        messagePagination={messagePagination}
        activeConversationId={activeConversationId}
        teamId={teamId}
        handleLoadMoreMessages={handleLoadMoreMessages}
      />
      <AiPromptInput
        prompt={prompt}
        setPrompt={setPrompt}
        isStreaming={isStreaming}
        handleSendAiMessage={handleSendAiMessage}
      />
    </div>
  );
}
