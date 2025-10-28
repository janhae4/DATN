import { useState, useEffect, useCallback, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { ApiService } from "../services/api-service";
import { shallow } from "zustand/shallow";

const MESSAGE_LIMIT = 20;

export function useMessageLoader(
    selectedConversationId: string,
    chatContainerRef: React.RefObject<HTMLDivElement | null>
) {
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const {
        messages,
        messagePages,
        hasMoreMessages,
        prependMessages,
        setMessagesForConversation,
        setMessagePage,
        setHasMoreMessages,
    } = useChatStore.getState()

    const currentMessages = messages[selectedConversationId] || [];
    const currentPage = messagePages[selectedConversationId] || 1;
    const currentHasMore = hasMoreMessages[selectedConversationId] ?? true;

    useEffect(() => {
        const fetchInitialMessages = async () => {
            if (!selectedConversationId) return;
            if (messages[selectedConversationId]) {
                setIsLoadingMessages(false);
                // Đã có tin nhắn, cuộn xuống dưới
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 100);
                return;
            }

            try {
                setIsLoadingMessages(true);
                const data = await ApiService.getMessages(selectedConversationId, 1, MESSAGE_LIMIT);
                const reversedData = data.reverse();
                const hasMore = data.length === MESSAGE_LIMIT;
                setMessagesForConversation(selectedConversationId, reversedData, 1, hasMore);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 100);
            } catch (error) {
                console.error("Failed to fetch initial messages:", error);
                setMessagesForConversation(selectedConversationId, [], 1, false);
            } finally {
                setIsLoadingMessages(false);
            }
        };
        fetchInitialMessages();
    }, [selectedConversationId, setMessagesForConversation, messages]);

    const loadOlderMessages = useCallback(async () => {
        if (isLoadingOlderMessages || !currentHasMore) return;

        setIsLoadingOlderMessages(true);
        const nextPage = currentPage + 1;

        try {
            const olderMessages = await ApiService.getMessages(
                selectedConversationId,
                nextPage,
                MESSAGE_LIMIT
            );
            const reversedOlderMessages = olderMessages.reverse();
            const hasMore = olderMessages.length === MESSAGE_LIMIT;

            const container = chatContainerRef.current;
            const oldScrollHeight = container?.scrollHeight || 0;

            prependMessages(selectedConversationId, reversedOlderMessages);
            setMessagePage(selectedConversationId, nextPage);
            setHasMoreMessages(selectedConversationId, hasMore);

            requestAnimationFrame(() => {
                if (container) {
                    container.scrollTop = container.scrollHeight - oldScrollHeight + (container.scrollTop || 0);
                }
            });
        } catch (error) {
            console.error("Failed to load older messages:", error);
        } finally {
            setIsLoadingOlderMessages(false);
        }
    }, [
        selectedConversationId,
        isLoadingOlderMessages,
        currentHasMore,
        currentPage,
        prependMessages,
        setMessagePage,
        setHasMoreMessages,
        chatContainerRef,
    ]);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const scrollThreshold = 100;
        const isScrolledToBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < scrollThreshold;

        if (isScrolledToBottom) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }, 100);
        }
    }, [currentMessages.length, chatContainerRef]);

    return {
        messagesEndRef,
        currentMessages,
        isLoadingMessages,
        isLoadingOlderMessages,
        currentHasMore,
        loadOlderMessages,
    };
}