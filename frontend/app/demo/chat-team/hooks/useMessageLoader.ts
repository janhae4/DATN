import { useState, useEffect, useCallback, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { ApiService } from "../services/api-service";
import { shallow } from "zustand/shallow";
import { useInfiniteScroll } from "./useInfiniteroll";

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
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 100);
                return;
            }

            try {
                setIsLoadingMessages(true);
                const data = await ApiService.getMessages(selectedConversationId, 1, MESSAGE_LIMIT);
                const messages = data.data
                const reversedData = messages.reverse();
                const hasMore = messages.length === MESSAGE_LIMIT;
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
            const reversedOlderMessages = olderMessages.data.reverse();


            const container = chatContainerRef.current;
            const oldScrollHeight = container?.scrollHeight || 0;

            prependMessages(selectedConversationId, reversedOlderMessages);
            setMessagePage(selectedConversationId, nextPage);
            setHasMoreMessages(selectedConversationId, olderMessages.totalPages > nextPage);

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

    useInfiniteScroll({
        containerRef: chatContainerRef,
        endRef: messagesEndRef,
        loadOlder: loadOlderMessages,
        count: currentMessages.length,
        isLoadingOlder: isLoadingOlderMessages
    });

    return {
        messagesEndRef,
        currentMessages,
        isLoadingMessages,
        isLoadingOlderMessages,
        currentHasMore,
        loadOlderMessages,
    };
}