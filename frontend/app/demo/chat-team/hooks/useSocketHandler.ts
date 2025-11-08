"use client";

import { useEffect } from "react";
import { useSocket, CHATBOT_PATTERN } from "@/app/SocketContext";
import { useChatStore } from "../store/useChatStore";
import { AiMessage, MessageData, NewMessageEvent, TeamRole } from "../types/type";
import { useShallow } from "zustand/shallow";
import { useInfiniteScroll } from "./useInfiniteroll";

const isEventForCurrentDiscussion = (
    data: { content?: string; teamId?: string; discussionId?: string; _id?: string }
): boolean => {
    const state = useChatStore.getState();
    const selected = state.selectedDiscussion;
    const chatMode = state.chatMode;

    console.log("[CHECK EVENT MATCH]", {
        incoming: data,
        selectedDiscussion: selected,
        chatMode,
    });

    if (!selected) return false;

    const eventDiscussionId = data.discussionId || data._id;
    if (chatMode === 'team') {
        return eventDiscussionId === selected._id;
    }

    if (chatMode === 'ai') {
        if (data.teamId && selected.teamId) {
            return selected.teamId === data.teamId;
        }
        if (eventDiscussionId && !data.teamId && !selected.teamId) {
            return eventDiscussionId === selected._id;
        }
    }
    return false;
};

export function useSocketHandler() {
    const { socket } = useSocket();
    const storeActions = useChatStore(
        useShallow((state) => ({
            appendMessage: state.appendMessage,
            upsertDiscussionMeta: state.upsertDiscussionMeta,
            moveDiscussionToTop: state.moveDiscussionToTop,
            setStreaming: state.setStreaming,
            appendStreamingPlaceholder: state.appendStreamingPlaceholder,
            updateStreamingMessage: state.updateStreamingMessage,
            handleStreamingError: state.handleStreamingError,
            finalizeStreamingMessage: state.finalizeStreamingMessage,
            setPersonalAiDiscussionId: state.setPersonalAiDiscussionId,
            replaceTempMessage: state.replaceTempMessage,
            messages: state.messages,
        }))
    );

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (data: NewMessageEvent) => {
            console.log("🔥 [SOCKET] NEW_MESSAGE", data);

            if (isEventForCurrentDiscussion({ discussionId: data.discussionId })) {
                console.log("✅ → Append message to UI");
                storeActions.appendMessage(data.message);
            } else {
                console.log("⛔ Event NOT for current discussion, skip append");
            }

            console.log("🔄 → Update discussion meta");
            storeActions.upsertDiscussionMeta(data);
        };

        const handleStreamStart = (data: { teamId?: string; discussionId?: string }) => {
            console.log("🟢 [SOCKET] STREAM_START", data);

            if (isEventForCurrentDiscussion(data)) {
                console.log("✅ → Start streaming and add placeholder");
                storeActions.setStreaming(true);
                storeActions.appendStreamingPlaceholder();
            }
        };

        const handleStreamChunk = (data: { content?: string, teamId?: string; discussionId?: string }) => {
            console.log("🟡 [SOCKET] STREAM_CHUNK", data);

            if (isEventForCurrentDiscussion(data)) {
                console.log("✅ → Update streaming message");
                storeActions.updateStreamingMessage(data.content || "");
            }
        };

        const handleStreamEnd = (data: { id: string, teamId?: string; discussionId?: string }) => {
            console.log("🔵 [SOCKET] STREAM_END", data);

            if (isEventForCurrentDiscussion(data)) {
                console.log("✅ → Stop streaming");
                storeActions.setStreaming(false);

                const currentState = useChatStore.getState();
                const messages = currentState.messages;
                const selectedDiscussion = currentState.selectedDiscussion;
                console.log("messages", messages);

                const tempStreamMessage = messages.find((m) => m._id.startsWith("temp-streaming-"));
                if (tempStreamMessage) {
                    tempStreamMessage._id = data.id;
                    const finalAiMessage: AiMessage = {
                        ...tempStreamMessage,
                        role: "AI"
                    };

                    storeActions.finalizeStreamingMessage(finalAiMessage);

                    const discussionUpdatePayload: NewMessageEvent = {
                        _id: data.discussionId || selectedDiscussion?._id as string,
                        discussionId: data.discussionId || selectedDiscussion?._id as string,
                        message: {
                            ...tempStreamMessage,
                            createdAt: new Date().toISOString(),
                        },
                        latestMessageSnapshot: {
                            ...tempStreamMessage,
                            createdAt: new Date().toISOString(),
                        },
                        participants: [],
                    };

                    console.log("streamResponse (đã sửa)", finalAiMessage);

                    console.log("✅ → Finalize streaming message in UI", finalAiMessage);
                    console.log("🔄 → Update discussion meta With streamResponse", finalAiMessage);

                    if (discussionUpdatePayload._id) {
                        storeActions.upsertDiscussionMeta(discussionUpdatePayload);
                        storeActions.moveDiscussionToTop({ discussionId: discussionUpdatePayload.discussionId as string });
                    } else {
                        console.warn("⚠️ Cannot update meta, discussion ID is missing.");
                    }

                } else {
                    console.warn("⚠️ [STREAM_END] Could not find temp-streaming- message to finalize.");
                }
            }
        };

        const handleStreamError = (data: { content: string, teamId?: string, discussionId?: string }) => {
            console.log("🔴 [SOCKET] STREAM_ERROR", data);

            if (isEventForCurrentDiscussion(data)) {
                console.log("⚠️ → Streaming error, update UI");
                storeActions.handleStreamingError(data.content);
                storeActions.setStreaming(false);
            }
        };

        const handleUserMessageSaved = (savedDiscussionData: any) => {
            savedDiscussionData.discussionId = savedDiscussionData._id;

            console.log("💾 [SOCKET] USER_MESSAGE_SAVED", savedDiscussionData);

            const finalMessageSnapshot = savedDiscussionData.latestMessageSnapshot;
            if (!finalMessageSnapshot) return;

            if (isEventForCurrentDiscussion(savedDiscussionData)) {
                const state = useChatStore.getState();
                const tempMsg = state.messages.find(
                    m => m._id.startsWith("temp-user-") && m.content === finalMessageSnapshot.content
                );
                if (tempMsg) {
                    console.log("✅ → Replace temp message");
                    storeActions.replaceTempMessage(tempMsg._id, {
                        ...savedDiscussionData,
                        message: finalMessageSnapshot
                    });
                } else {
                    console.log("✅ → Append message to UI");
                    storeActions.appendMessage(finalMessageSnapshot);
                }
            }

            console.log("🔄 → Update discussion meta (for User)");
            storeActions.upsertDiscussionMeta(savedDiscussionData);
            storeActions.moveDiscussionToTop({ discussionId: savedDiscussionData.discussionId as string });
        };

        const handleDiscussionStarted = (data: { newDiscussionId: string }) => {
            console.log("✨ [SOCKET] DISCUSSION_STARTED", data);
            storeActions.setPersonalAiDiscussionId(data.newDiscussionId);
        };

        socket.on(CHATBOT_PATTERN.NEW_MESSAGE, handleNewMessage);
        socket.on(CHATBOT_PATTERN.RESPONSE_START, handleStreamStart);
        socket.on(CHATBOT_PATTERN.RESPONSE_CHUNK, handleStreamChunk);
        socket.on(CHATBOT_PATTERN.RESPONSE_END, handleStreamEnd);
        socket.on(CHATBOT_PATTERN.RESPONSE_ERROR, handleStreamError);
        socket.on(CHATBOT_PATTERN.CONVERSATION_STARTED, handleDiscussionStarted);
        socket.on(CHATBOT_PATTERN.MESSAGE_SAVED, handleUserMessageSaved);

        return () => {
            console.log("🧹 Cleanup socket listeners");
            socket.off(CHATBOT_PATTERN.NEW_MESSAGE, handleNewMessage);
            socket.off(CHATBOT_PATTERN.RESPONSE_START, handleStreamStart);
            socket.off(CHATBOT_PATTERN.RESPONSE_CHUNK, handleStreamChunk);
            socket.off(CHATBOT_PATTERN.RESPONSE_END, handleStreamEnd);
            socket.off(CHATBOT_PATTERN.RESPONSE_ERROR, handleStreamError);
            socket.off(CHATBOT_PATTERN.CONVERSATION_STARTED, handleDiscussionStarted);
            socket.off(CHATBOT_PATTERN.MESSAGE_SAVED, handleUserMessageSaved);
        };
    }, [socket, storeActions]);
}