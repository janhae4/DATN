import { useRef, useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useQueryClient } from '@tanstack/react-query';

export const useChatSocket = (selectedChannelId: string | null) => {
    const { chatSocket } = useSocket();
    const queryClient = useQueryClient();
    const [typingUsers, setTypingUsers] = useState<{ userId: string; name: string; avatar?: string }[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!chatSocket || !selectedChannelId) return;

        chatSocket.emit("join_room", { roomId: selectedChannelId });

        const handleNewMessage = (newMessage: any) => {
            console.log("Socket: New message received:", newMessage);
            if (newMessage.discussionId === selectedChannelId) {
                queryClient.setQueryData(['messages', selectedChannelId], (oldData: any) => {
                    if (!oldData) return oldData;
                    const isDuplicate = oldData.pages.some((page: any) =>
                        page.data.some((m: any) => m._id === (newMessage.message?._id || newMessage._id))
                    );
                    if (isDuplicate) return oldData;
                    const newPages = [...oldData.pages];
                    if (newPages.length > 0) {
                        newPages[0] = {
                            ...newPages[0],
                            data: [newMessage.message || newMessage, ...newPages[0].data]
                        };
                    }
                    return { ...oldData, pages: newPages };
                });
            }
        };

        const handleTypingStart = (data: { userId: string, name: string, avatar?: string }) => {
            setTypingUsers(prev => {
                if (prev.find(u => u.userId === data.userId)) return prev;
                return [...prev, data];
            });
        };

        const handleTypingStop = (data: { userId: string }) => {
            setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        };

        chatSocket.on("new_message", handleNewMessage);
        chatSocket.on("typing_start", handleTypingStart);
        chatSocket.on("typing_stop", handleTypingStop);

        return () => {
            chatSocket.off("new_message", handleNewMessage);
            chatSocket.off("typing_start", handleTypingStart);
            chatSocket.off("typing_stop", handleTypingStop);
            chatSocket.emit("leave_room", { roomId: selectedChannelId });
        };
    }, [chatSocket, selectedChannelId, queryClient]);

    const emitTyping = () => {
        if (!chatSocket || !selectedChannelId) return;
        if (!typingTimeoutRef.current) {
            chatSocket.emit("typing_start", { roomId: selectedChannelId });
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            chatSocket.emit("typing_stop", { roomId: selectedChannelId });
            typingTimeoutRef.current = null;
        }, 3000);
    };

    const stopTypingImmediately = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            chatSocket?.emit("typing_stop", { roomId: selectedChannelId });
            typingTimeoutRef.current = null;
        }
    };

    return { typingUsers, emitTyping, stopTypingImmediately };
};
