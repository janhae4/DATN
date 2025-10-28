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
  messagesEndRef: any;
  currentUser: any;
  activeConversationId: string | null;
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
  messagesEndRef,
  currentUser,
  activeConversationId,
  handleSendAiMessage,
  handleLoadMoreMessages,
}: AiChatWindowProps) {
  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      <AiMessageList
        chatboxRef={chatboxRef}
        aiMessages={aiMessages}
        messagesEndRef={messagesEndRef}
        currentUser={currentUser}
        isLoadingMessages={isLoadingMessages}
        isStreaming={isStreaming}
        isHistoryLoading={isHistoryLoading}
        messagePagination={messagePagination}
        activeConversationId={activeConversationId}
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
