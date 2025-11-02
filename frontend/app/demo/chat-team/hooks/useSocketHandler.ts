import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { ApiService } from "../services/api-service";
import { NewMessageEvent } from "../types/type";
import { useSocket } from "@/app/SocketContext";

export function useSocketHandler() {
    const {
        upsertConversationMeta,
        ensureConversationVisible,
        moveConversationToTop,
        appendMessage,
        selectedConversation
    } = useChatStore();

    const { socket } = useSocket()
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = async (payload: NewMessageEvent) => {
            console.log("Received new message via socket:", payload);
            const { discussionId } = payload;
            if (!discussionId) {
                console.error("Received message without discussionId:", payload);
                return;
            }
            ensureConversationVisible(discussionId, ApiService.getConversationById);
            upsertConversationMeta(payload);
            if (selectedConversation?._id === payload.discussionId) {
                appendMessage(payload.discussionId, payload.message);
            }
        };

        socket.on("new_message", handleNewMessage);

        return () => {
            socket.off("new_message", handleNewMessage);
        };
    }, [
        upsertConversationMeta,
        ensureConversationVisible,
        moveConversationToTop,
        appendMessage,
        selectedConversation
    ]);
}