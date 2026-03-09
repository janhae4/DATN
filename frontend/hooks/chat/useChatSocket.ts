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

        const handleConnect = () => {
             chatSocket.emit("join_room", { roomId: selectedChannelId });
        };

        if (chatSocket.connected) {
            handleConnect();
        }

        chatSocket.on("connect", handleConnect);

        const handleNewMessage = (newMessage: any) => {
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

        const handleMessageUpdate = (updatedData: any) => {
            console.log("Socket: Message update received:", updatedData);
            if (updatedData.discussionId === selectedChannelId) {
                queryClient.setQueryData(['messages', selectedChannelId], (oldData: any) => {
                    if (!oldData) return oldData;

                    const newPages = oldData.pages.map((page: any) => ({
                        ...page,
                        data: page.data.map((msg: any) => {
                            // Update the actual message if it matches
                            if (msg._id === updatedData.messageId) {
                                return { ...msg, ...updatedData };
                            }
                            // Update the snapshot if this message is a reply to the updated message
                            if (msg.replyTo && msg.replyTo.messageId === updatedData.messageId) {
                                return {
                                    ...msg,
                                    replyTo: {
                                        ...msg.replyTo,
                                        content: updatedData.content
                                    }
                                };
                            }
                            return msg;
                        })
                    }));

                    return { ...oldData, pages: newPages };
                });
            }
        };

        const handleMessageDelete = (deletedData: any) => {
            console.log("Socket: Message delete received:", deletedData);
            if (deletedData.discussionId === selectedChannelId) {
                queryClient.setQueryData(['messages', selectedChannelId], (oldData: any) => {
                    if (!oldData) return oldData;

                    const newPages = oldData.pages.map((page: any) => ({
                        ...page,
                        data: page.data.reduce((acc: any[], msg: any) => {
                            if (msg._id === deletedData.messageId) return acc;
                            if (msg.replyTo && msg.replyTo.messageId === deletedData.messageId) {
                                acc.push({
                                    ...msg,
                                    replyTo: {
                                        ...msg.replyTo,
                                        content: 'This message has been deleted.'
                                    }
                                });
                            } else {
                                acc.push(msg);
                            }
                            return acc;
                        }, [])
                    }));

                    return { ...oldData, pages: newPages };
                });
            }
        };

        chatSocket.on("message_update", handleMessageUpdate);
        chatSocket.on("message_delete", handleMessageDelete);

        return () => {
            chatSocket.off("connect", handleConnect);
            chatSocket.off("new_message", handleNewMessage);
            chatSocket.off("typing_start", handleTypingStart);
            chatSocket.off("typing_stop", handleTypingStop);
            chatSocket.off("message_update", handleMessageUpdate);
            chatSocket.off("message_delete", handleMessageDelete);
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
