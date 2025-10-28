"use client";

import { useAiChat } from "../hooks/useAiChat";
import { AiMessageList } from "./AiMessageList";
import { AiPromptInput } from "./AiPromptInput";
import { CurrentUser } from "../types/type";

export function PersonalAiChatWindow({
  currentUser,
}: {
  currentUser: CurrentUser;
}) {
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
    handleLoadMoreMessages,
  } = useAiChat(currentUser);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 bg-white shadow-sm">
        <h2 className="text-xl font-semibold">AI Cá nhân</h2>
        <p className="text-sm text-gray-500">
          Cuộc trò chuyện này được cá nhân hóa cho riêng bạn.
        </p>
      </div>
      <AiMessageList
        chatboxRef={chatboxRef}
        messagesEndRef={messagesEndRef}
        aiMessages={aiMessages}
        currentUser={currentUser}
        isLoadingMessages={isLoadingMessages}
        isStreaming={isStreaming}
        isHistoryLoading={isHistoryLoading}
        messagePagination={messagePagination}
        activeConversationId={null}
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
