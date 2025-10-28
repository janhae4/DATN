import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { ApiService } from "../services/api-service";
import { io, Socket } from "socket.io-client";

export function useSocketHandler() {
    const socketRef = useRef<Socket | null>(null);
    const {
        upsertConversationMeta,
        ensureConversationVisible,
        moveConversationToTop,
        appendMessage,
    } = useChatStore();

    useEffect(() => {
        const socket = io("http://localhost:4001", { withCredentials: true });
        socketRef.current = socket;

        socket.on("connect", () => console.log("✅ Socket connected", socket.id));
        socket.on("disconnect", (reason) =>
            console.warn("⚠️ Socket disconnected:", reason)
        );

        const handleNewMessage = async (payload: MessageData) => {
            console.log("Received new message via socket:", payload);
            const { conversationId } = payload;
            if (!conversationId) {
                console.error("Received message without conversationId:", payload);
                return;
            }

            upsertConversationMeta({ _id: conversationId, latestMessage: payload });

            await ensureConversationVisible(conversationId, async (id) => {
                try {
                    return await ApiService.getConversationById(id);
                } catch (error) {
                    console.error(`Error fetching conversation ${id}:`, error);
                    return null;
                }
            });

            moveConversationToTop(conversationId);
            appendMessage(conversationId, payload);
        };

        socket.on("new_message", handleNewMessage);

        return () => {
            console.log("Disconnecting socket...");
            socket.disconnect();
            socket.off("connect");
            socket.off("disconnect");
            socket.off("new_message", handleNewMessage);
            socketRef.current = null;
        };
    }, [
        upsertConversationMeta,
        ensureConversationVisible,
        moveConversationToTop,
        appendMessage,
    ]);

    // Bạn có thể return socketRef nếu các hook khác cần
    // return socketRef;
}