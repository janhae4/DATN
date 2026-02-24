import React, { useRef, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageItem } from "./MessageItem";
import { MessageSnapshot, AttachmentDto, ResponseMessageDto, ServerMemberDto, PaginatedResponse } from "@/types";

interface TypingUser {
    userId: string;
    name: string;
    avatar?: string;
}

interface ChatMember {
    userId: string;
    name: string;
    avatar?: string;
    role?: string;
    isAdmin?: boolean;
}

interface VoiceParticipant {
    userInfo: {
        id: string;
        name: string;
        avatar?: string;
    };
}

interface MessageListProps {
    messages: MessageSnapshot[];
    typingUsers: TypingUser[];
    selectedChannelName?: string;
    selectedChannelId: string | null;
    selectedServerId: string | null;
    selectedTeamId: string | null;
    hasNextPage: boolean;
    onFetchNextPage: () => void;
    userId?: string;
    onReact: (params: { discussionId: string; messageId: string; emoji: string }) => void;
    members: ChatMember[];
    voiceParticipants: VoiceParticipant[];
    onUpdateMessage: (messageId: string, content: string, attachments?: AttachmentDto[]) => void;
    onDeleteMessage: (messageId: string) => void;
    onReply: (message: MessageSnapshot) => void;
    onGenerateTask?: (messageId?: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    typingUsers,
    selectedChannelName,
    selectedChannelId,
    selectedServerId,
    selectedTeamId,
    hasNextPage,
    onFetchNextPage,
    userId,
    onReact,
    members,
    voiceParticipants,
    onUpdateMessage,
    onDeleteMessage,
    onReply,
    onGenerateTask
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const prevNewestMessageId = useRef<string | null>(null);
    const prevChannelIdRef = useRef<string | null>(selectedChannelId);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef<number>(0);
    const prevMessageCountRef = useRef<number>(0);

    React.useLayoutEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const currentScrollHeight = container.scrollHeight;
        const countDiff = messages.length - prevMessageCountRef.current;

        const newestMessage = messages.find(m => m?._id);
        const isNewMessage = newestMessage?._id !== prevNewestMessageId.current;

        if (countDiff > 0 && !isNewMessage && prevScrollHeightRef.current > 0) {
            const heightDiff = currentScrollHeight - prevScrollHeightRef.current;
            container.scrollTop += heightDiff;
        }

        prevScrollHeightRef.current = currentScrollHeight;
        prevMessageCountRef.current = messages.length;
    }, [messages]);

    // Handle auto-scroll to bottom for new messages
    useEffect(() => {
        const channelChanged = selectedChannelId !== prevChannelIdRef.current;

        if (channelChanged) {
            prevChannelIdRef.current = selectedChannelId;
            prevNewestMessageId.current = null;
        }

        if (!messages.length) return;

        const newestMessage = messages.find(m => m?._id);

        if (channelChanged || (newestMessage?._id && newestMessage._id !== prevNewestMessageId.current)) {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
            if (newestMessage?._id) {
                prevNewestMessageId.current = newestMessage._id;
            }
        }
    }, [messages, selectedChannelId]);

    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage) {
                    onFetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, onFetchNextPage]);

    const formatTime = (dateString: string | Date) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getUserName = (id: string) => {
        if (id === userId) return "You";
        const member = members.find((m) => m.userId === id);
        if (member) return member.name;

        const voiceP = voiceParticipants.find((p) => p.userInfo?.id === id);
        if (voiceP) return voiceP.userInfo.name;
        return "Unknown User";
    };

    return (
        <div
            ref={scrollContainerRef}
            className="flex-1 px-4 overflow-y-auto"
        >
            <div className="flex flex-col-reverse min-h-full py-4 gap-2">
                <div ref={messagesEndRef} />

                {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 px-2 animate-pulse">
                        <div className="flex -space-x-2">
                            {typingUsers.slice(0, 3).map((u) => (
                                <Avatar key={u.userId} className="h-6 w-6 border-2 border-white dark:border-zinc-950">
                                    <AvatarImage src={u.avatar} />
                                    <AvatarFallback className="text-[10px] bg-zinc-200 dark:bg-zinc-800">{u.name?.[0]}</AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                        <span className="text-xs font-medium text-zinc-500">
                            {typingUsers.length > 3 ? "Several people are typing..." : "typing..."}
                        </span>
                    </div>
                )}

                {messages.length === 0 && !typingUsers.length && (
                    <div className="text-center py-20">
                        <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-200 dark:border-zinc-800">
                            <Icon icon="lucide:message-square" className="text-zinc-400 dark:text-zinc-600" width="32" />
                        </div>
                        <h3 className="text-zinc-900 dark:text-zinc-300 font-medium text-lg">Welcome to #{selectedChannelName}!</h3>
                        <p className="text-zinc-500 text-sm mt-1">This is the start of the <span className="text-blue-500 dark:text-blue-400 font-medium">#{selectedChannelName}</span> channel.</p>
                    </div>
                )}

                {messages.filter(msg => msg?._id).map((msg, index: number) => {
                    const isSameSender = index < messages.length - 1 && messages[index + 1]?.sender?._id === msg.sender?._id;

                    return (
                        <MessageItem
                            key={msg._id}
                            msg={msg}
                            isSameSender={isSameSender}
                            userId={userId}
                            selectedChannelId={selectedChannelId}
                            selectedServerId={selectedServerId}
                            selectedTeamId={selectedTeamId}
                            onReact={onReact}
                            getUserName={getUserName}
                            formatTime={formatTime}
                            onEdit={(updatedMsg) => onUpdateMessage(updatedMsg._id, updatedMsg.content, updatedMsg.attachments)}
                            onDelete={onDeleteMessage}
                            onReply={onReply}
                            onReplyClick={(messageId) => {
                                const element = document.getElementById(`message-${messageId}`);
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    element.classList.add('bg-zinc-100/50', 'dark:bg-zinc-800/50');
                                    setTimeout(() => element.classList.remove('bg-zinc-100/50', 'dark:bg-zinc-800/50'), 2000);
                                } else {
                                    console.log('Message not found in current view');
                                }
                            }}
                            onGenerateTask={() => onGenerateTask?.(msg._id)}
                        />
                    );
                })}

                {hasNextPage && (
                    <div
                        ref={loadMoreRef}
                        className="flex justify-center py-4"
                    >
                        <div className="h-6 w-6 border-2 border-zinc-400 dark:border-zinc-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
};
