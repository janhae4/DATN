"use client";

import { useEffect } from "react";
import { useSocket, CHATBOT_PATTERN } from "@/app/SocketContext";
import { useChatStore } from "../store/useChatStore";
import { AiMessage, MessageData, NewMessageEvent } from "../types/type";

export function useSocketHandler() {
    const { socket } = useSocket();
    const store = useChatStore();

    useEffect(() => {
        if (!socket) return;

        const getStoreDiscussionId = (
            data: { teamId?: string; discussionId?: string }
        ): string | null => {
            if (data.teamId) {
                return `team_ai_${data.teamId}`;
            }
            if (data.discussionId) {
                const personalId = store.personalAiDiscussionId;
                if (data.discussionId === personalId) {
                    return "personal_ai";
                }
            }
            if (!data.teamId && !data.discussionId) {
                return "personal_ai";
            }
            return null;
        };

        const handleNewMessage = (data: NewMessageEvent) => {
            store.appendMessage(data.message);
            store.upsertDiscussionMeta(data);
        };

        const handleStreamStart = (
            data: { teamId?: string; DiscussionId?: string }
        ) => {
            const storeId = getStoreDiscussionId(data);
            if (storeId) {
                store.setStreaming(true);
                store.appendStreamingPlaceholder();
            }
        };

        const handleStreamChunk = (
            data: { content: string; teamId?: string; discussionId?: string }
        ) => {
            const storeId = getStoreDiscussionId(data);
            if (storeId) {
                store.updateStreamingMessage(data.content);
            }
        };

        const handleStreamEnd = (
            data: { teamId?: string; DiscussionId?: string }
        ) => {
            const storeId = getStoreDiscussionId(data);
            if (storeId) {
                store.setStreaming(false);
            }
        };

        const handleStreamError = (
            data: { content: string; teamId?: string; DiscussionId?: string }
        ) => {
            const storeId = getStoreDiscussionId(data);
            if (storeId) {
                store.handleStreamingError(data.content);
                store.setStreaming(false);
            }
        };

        const handleAiMessageSaved = (savedMessage: AiMessage) => {
            const storeId = getStoreDiscussionId(savedMessage);
            if (storeId) {
                store.finalizeStreamingMessage(savedMessage);
            }
        };

        const handleDiscussionStarted = (data: { newDiscussionId: string }) => {
            store.setPersonalAiDiscussionId(data.newDiscussionId);
        };

        const handleNewAiMessage = (aiMessage: AiMessage) => {
            store.appendMessage({
                _id: aiMessage._id,
                sender: aiMessage.sender,
                content: aiMessage.content,
                createdAt: aiMessage.timestamp,
                discussionId: aiMessage.discussionId || "personal_ai",
                teamId: aiMessage.teamId,
                metadata: aiMessage.metadata,
            });
        };

        socket.on(CHATBOT_PATTERN.NEW_MESSAGE, handleNewMessage);

        socket.on(CHATBOT_PATTERN.RESPONSE_START, handleStreamStart);
        socket.on(CHATBOT_PATTERN.RESPONSE_CHUNK, handleStreamChunk);
        socket.on(CHATBOT_PATTERN.RESPONSE_END, handleStreamEnd);
        socket.on(CHATBOT_PATTERN.RESPONSE_ERROR, handleStreamError);
        socket.on(CHATBOT_PATTERN.CONVERSATION_STARTED, handleDiscussionStarted);

        socket.on(CHATBOT_PATTERN.MESSAGE_SAVED, handleAiMessageSaved);
        socket.on(CHATBOT_PATTERN.NEW_AI_MESSAGE, handleNewAiMessage);

        return () => {
            socket.off("new_message", handleNewMessage);

            socket.off(CHATBOT_PATTERN.RESPONSE_START, handleStreamStart);
            socket.off(CHATBOT_PATTERN.RESPONSE_CHUNK, handleStreamChunk);
            socket.off(CHATBOT_PATTERN.RESPONSE_END, handleStreamEnd);
            socket.off(CHATBOT_PATTERN.RESPONSE_ERROR, handleStreamError);
            socket.off(CHATBOT_PATTERN.CONVERSATION_STARTED, handleDiscussionStarted);

            socket.off(CHATBOT_PATTERN.MESSAGE_SAVED, handleAiMessageSaved);
            socket.off(CHATBOT_PATTERN.NEW_AI_MESSAGE, handleNewAiMessage);
        };
    }, [socket, store]);
}