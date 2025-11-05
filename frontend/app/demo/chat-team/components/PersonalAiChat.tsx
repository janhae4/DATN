"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { AiMessage, CurrentUser } from "../types/type";
import { useChatStore } from "../store/useChatStore";
import { useSocket } from "@/app/SocketContext";
import { AiChatWindow } from "./AiChatWindow";
import { useInfiniteScroll } from "../hooks/useInfiniteroll";
import { shallow } from "zustand/shallow";

const PERSONAL_AI_DISCUSSION_ID = "personal_ai";
const EMPTY_MESSAGES: AiMessage[] = [];

const selector = (state: any) => ({
  messages: state.messages[PERSONAL_AI_DISCUSSION_ID] || EMPTY_MESSAGES,
  messagesLoaded: state.messages[PERSONAL_AI_DISCUSSION_ID] !== undefined,
  isHistoryLoading: state.historyLoading[PERSONAL_AI_DISCUSSION_ID] || false,
  hasMore: state.hasMoreMessages[PERSONAL_AI_DISCUSSION_ID] !== false,
});

export function PersonalAiChat({ currentUser }: { currentUser: CurrentUser }) {
  const { socket } = useSocket();
  const chatboxRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const { loadInitialAiMessages, loadMoreAiMessages, sendAiMessage } =
    useChatStore();

  const selector = React.useCallback((state: any) => {
    const id = PERSONAL_AI_DISCUSSION_ID;
    return {
      messages: state.messages[id] || [],
      messagesLoaded: state.messages[id] !== undefined,
      isHistoryLoading: state.historyLoading[id] || false,
      hasMore: state.hasMoreMessages[id] !== false,
    };
  }, []);

  const { messages, messagesLoaded, isHistoryLoading, hasMore } = useChatStore(
    selector);

  useEffect(() => {
    if (!messagesLoaded) {
      setIsLoadingInitial(true);
      loadInitialAiMessages(PERSONAL_AI_DISCUSSION_ID, currentUser).finally(
        () => {
          setIsLoadingInitial(false);
        }
      );
    } else {
      setIsLoadingInitial(false);
    }
  }, [messagesLoaded, currentUser]);

  useEffect(() => {
    if (!isLoadingInitial) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isLoadingInitial]);

  const handleSend = () => {
    if (socket) {
      sendAiMessage(PERSONAL_AI_DISCUSSION_ID, currentUser, socket);
    }
  };

  const handleLoadMore = useCallback(async () => {
    if (isHistoryLoading || !hasMore || !chatboxRef.current) return;

    const container = chatboxRef.current;
    const oldScrollHeight = container.scrollHeight;
    const oldScrollTop = container.scrollTop;

    const newMessagesCount = await loadMoreAiMessages(
      PERSONAL_AI_DISCUSSION_ID
    );

    if (newMessagesCount > 0) {
      requestAnimationFrame(() => {
        container.scrollTop =
          container.scrollHeight - oldScrollHeight + oldScrollTop;
      });
    }
  }, [isHistoryLoading, hasMore, chatboxRef]);

  useInfiniteScroll({
    containerRef: chatboxRef,
    endRef: messagesEndRef,
    loadOlder: handleLoadMore,
    count: messages.length,
    isLoadingOlder: isHistoryLoading,
  });

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 bg-white shadow-sm">
        <h2 className="text-xl font-semibold">AI Cá nhân</h2>
        <p className="text-sm text-gray-500">
          Cuộc trò chuyện này được cá nhân hóa cho riêng bạn.
        </p>
      </div>

      <AiChatWindow
        chatboxRef={chatboxRef}
        messagesEndRef={messagesEndRef}
        currentUser={currentUser}
        discussionId={PERSONAL_AI_DISCUSSION_ID}
        isLoadingInitialMessages={isLoadingInitial}
        handleSendAiMessage={handleSend}
        handleLoadMoreMessages={handleLoadMore}
      />
    </div>
  );
}
