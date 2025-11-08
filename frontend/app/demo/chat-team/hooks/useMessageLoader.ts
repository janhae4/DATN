import { useState, useEffect, useCallback, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { ApiService } from "../services/api-service";
import { shallow, useShallow } from "zustand/shallow";
import { useInfiniteScroll } from "./useInfiniteroll";

const MESSAGE_LIMIT = 10;

export function useMessageLoader(
    selectedConversationId: string,
    chatContainerRef: React.RefObject<HTMLDivElement | null>
) {
    console.log("useMessageLoader called with selectedConversationId:", selectedConversationId);

    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const {
        messages,
        messagePage,
        hasMoreMessages,
        prependMessages,
        setMessagePage,
        setHasMoreMessages,
        setHistoryLoading,
        loadMessages,
        isHistoryLoading,
        chatMode,
    } = useChatStore(useShallow((state) => ({
        messages: state.messages,
        messagePage: state.messagePage,
        hasMoreMessages: state.hasMoreMessages,
        isHistoryLoading: state.isHistoryLoading,
        chatMode: state.chatMode,
        prependMessages: state.prependMessages,
        setMessagesForDiscussion: state.setMessagesForDiscussion,
        setMessagePage: state.setMessagePage,
        setHasMoreMessages: state.setHasMoreMessages,
        setHistoryLoading: state.setHistoryLoading,
        loadMessages: state.loadMessages
    })));

    useEffect(() => {
        if (selectedConversationId) {
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 100);
        }
    }, [selectedConversationId]);

    const loadOlderMessages = useCallback(async () => {
        if (isHistoryLoading || !hasMoreMessages || !selectedConversationId) {
            console.log("Tải tin nhắn cũ bị bỏ qua:", { isHistoryLoading, hasMoreMessages, selectedConversationId });
            return;
        }

        setHistoryLoading(true);
        const nextPage = messagePage + 1;

        const container = chatContainerRef.current;
        const oldScrollHeight = container?.scrollHeight || 0;

        try {

            console.log("Đang tải tin nhắn TEAM cũ hơn...");
            await loadMessages(
                nextPage,
                MESSAGE_LIMIT
            );

            requestAnimationFrame(() => {
                if (container) {
                    container.scrollTop = container.scrollHeight - oldScrollHeight + (container.scrollTop || 0);
                }
            });

        } catch (error) {
            console.error("Failed to load older messages:", error);
        } finally {
            setHistoryLoading(false);
        }
    }, [
        selectedConversationId,
        isHistoryLoading,
        hasMoreMessages,
        messagePage,
        chatMode,
        prependMessages,
        setMessagePage,
        setHasMoreMessages,
        setHistoryLoading,
        chatContainerRef,
    ]);

    useInfiniteScroll({
        containerRef: chatContainerRef,
        endRef: messagesEndRef,
        loadOlder: loadOlderMessages,
        count: messages.length,
        isLoadingOlder: isLoadingOlderMessages
    });

    return {
        messagesEndRef,
        currentMessages: messages,
        isLoadingMessages: isHistoryLoading && messages.length === 0,
        isLoadingOlderMessages: isHistoryLoading && messages.length > 0,
        currentHasMore: hasMoreMessages,
        loadOlderMessages,
    };
}