import { useState, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { ApiService } from "../services/api-service";

export function useMessageSender(
    selectedConversation: Conversation,
    currentUser: User
) {
    const [newMessage, setNewMessage] = useState("");
    const {
        appendMessage,
        moveConversationToTop,
        upsertConversationMeta,
        replaceTempMessage,
        removeTempMessage,
    } = useChatStore();

    const handleSendMessage = useCallback(
        async (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent) => {
            e.preventDefault();
            if (!newMessage.trim() || !selectedConversation) return;

            const convoId = selectedConversation._id;
            const tempMessageId = `temp-${Date.now()}`;
            const tempMessage: MessageData = {
                _id: tempMessageId,
                content: newMessage,
                sender: {
                    _id: currentUser.id,
                    name: currentUser.name,
                    avatar: currentUser.avatar,
                    role: selectedConversation.participants?.find(
                        (p) => p._id === currentUser.id
                    )?.role,
                },
                createdAt: new Date().toISOString(),
                conversationId: convoId,
                teamId: selectedConversation.teamId,
            };

            appendMessage(convoId, tempMessage);
            moveConversationToTop(convoId);
            upsertConversationMeta({ _id: convoId, latestMessage: tempMessage });

            const messageToSend = newMessage;
            setNewMessage("");

            try {
                const savedMessage = await ApiService.sendMessage(
                    convoId,
                    messageToSend,
                    selectedConversation.teamId
                );
                replaceTempMessage(convoId, tempMessageId, savedMessage);
                upsertConversationMeta({ _id: convoId, latestMessage: savedMessage });
                moveConversationToTop(convoId);
            } catch (error) {
                console.error("❌ Failed to send:", error);
                removeTempMessage(convoId, tempMessageId);
                setNewMessage(messageToSend);
                alert("Gửi tin nhắn thất bại!");
            }
        },
        [
            newMessage,
            selectedConversation,
            currentUser,
            appendMessage,
            moveConversationToTop,
            upsertConversationMeta,
            replaceTempMessage,
            removeTempMessage,
        ]
    );

    return {
        newMessage,
        setNewMessage,
        handleSendMessage,
    };
}