import { useState, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { ApiService } from "../services/api-service";
import { Discussion, CurrentUser, MessageData, NewMessageEvent } from "../types/type";
import { useShallow } from "zustand/shallow";
import { Socket } from "socket.io-client";

export function useMessageSender(
    selectedDiscussion: Discussion | null,
    currentUser: CurrentUser | null,
    socket: Socket | null
) {
    const [newMessage, setNewMessage] = useState("");

    const {
        appendMessage,
        moveDiscussionToTop,
        upsertDiscussionMeta,
        replaceTempMessage,
        removeTempMessage,
        chatMode,
        sendAiMessage,
        setPrompt,
    } = useChatStore(useShallow((state) => ({
        appendMessage: state.appendMessage,
        moveDiscussionToTop: state.moveDiscussionToTop,
        upsertDiscussionMeta: state.upsertDiscussionMeta,
        replaceTempMessage: state.replaceTempMessage,
        removeTempMessage: state.removeTempMessage,
        chatMode: state.chatMode,
        sendAiMessage: state.sendAiMessage,
        setPrompt: state.setPrompt,
    })));

    const handleSendMessage = useCallback(
        async (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent) => {
            e.preventDefault();

            const messageToSend = newMessage.trim();
            if (!messageToSend || !selectedDiscussion || !currentUser) return;
            console.log("🟦 [handleSendMessage] TRIGGERED with message:", messageToSend);
            if (chatMode === 'ai') {
                if (!socket) {
                    console.error("Socket is not available for AI chat.");
                    alert("Lỗi kết nối AI, vui lòng thử lại.");
                    return;
                }

                setPrompt(messageToSend);

                sendAiMessage(currentUser, socket, selectedDiscussion.teamId);

                setNewMessage("");

            } else {
                const discId = selectedDiscussion._id;
                const tempMessageId = `temp-${Date.now()}`;

                const tempMessage: MessageData = {
                    _id: tempMessageId,
                    content: messageToSend, 
                    sender: {
                        _id: currentUser.id,
                        name: currentUser.name,
                        avatar: currentUser.avatar,
                        role: selectedDiscussion.participants?.find(
                            (p) => p.id === currentUser.id
                        )?.role,
                    },
                    createdAt: new Date().toISOString(),
                    discussionId: discId,
                    teamId: selectedDiscussion.teamId,
                };

                appendMessage(tempMessage);
                moveDiscussionToTop({ discussionId: discId });
                setNewMessage(""); 
                try {
                    const savedMessageEvent: NewMessageEvent = await ApiService.sendMessage(
                        discId,
                        messageToSend,
                    );
                    replaceTempMessage(tempMessageId, savedMessageEvent);
                    upsertDiscussionMeta(savedMessageEvent);
                } catch (error) {
                    console.error("❌ Failed to send team message:", error);
                    removeTempMessage(tempMessageId);
                    setNewMessage(messageToSend);
                    alert("Gửi tin nhắn thất bại!");
                }
            }
        },
        [
            newMessage,
            selectedDiscussion,
            currentUser,
            appendMessage,
            moveDiscussionToTop,
            upsertDiscussionMeta,
            replaceTempMessage,
            removeTempMessage,
            chatMode,
            socket,
            sendAiMessage,
            setPrompt
        ]
    );

    return {
        newMessage,
        setNewMessage,
        handleSendMessage,
    };
}