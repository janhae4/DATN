import React, { useRef, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageItem, ChatMessage } from "./MessageItem";

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
    messages: ChatMessage[];
    typingUsers: TypingUser[];
    selectedChannelName?: string;
    selectedChannelId: string | null;
    hasNextPage: boolean;
    onFetchNextPage: () => void;
    userId?: string;
    onReact: (params: { discussionId: string; messageId: string; emoji: string }) => void;
    members: ChatMember[];
    voiceParticipants: VoiceParticipant[];
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    typingUsers,
    selectedChannelName,
    selectedChannelId,
    hasNextPage,
    onFetchNextPage,
    userId,
    onReact,
    members,
    voiceParticipants
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Format time helper
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getUserName = (id: string) => {
        if (id === userId) return "You";
        // Check members list
        const member = members.find((m) => m.userId === id);
        if (member) return member.name;

        // Check voice participants
        const voiceP = voiceParticipants.find((p) => p.userInfo?.id === id);
        if (voiceP) return voiceP.userInfo.name;

        // Fallback or search in message senders (if current message sender)
        return "Unknown User";
    };

    return (
        <div className="flex-1 px-4 overflow-y-auto">
            <div className="flex flex-col-reverse min-h-full py-4 gap-2">
                <div ref={messagesEndRef} />

                {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 px-2 animate-pulse">
                        <div className="flex -space-x-2">
                            {typingUsers.slice(0, 3).map((u) => (
                                <Avatar key={u.userId} className="h-6 w-6 border-2 border-zinc-950">
                                    <AvatarImage src={u.avatar} />
                                    <AvatarFallback className="text-[10px] bg-zinc-800">{u.name?.[0]}</AvatarFallback>
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
                        <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                            <Icon icon="lucide:message-square" className="text-zinc-600" width="32" />
                        </div>
                        <h3 className="text-zinc-300 font-medium text-lg">Welcome to #{selectedChannelName}!</h3>
                        <p className="text-zinc-500 text-sm mt-1">This is the start of the <span className="text-blue-400 font-medium">#{selectedChannelName}</span> channel.</p>
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
                            onReact={onReact}
                            getUserName={getUserName}
                            formatTime={formatTime}
                        />
                    );
                })}

                {hasNextPage && (
                    <div className="flex justify-center py-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onFetchNextPage}
                            className="text-xs text-zinc-500 hover:text-zinc-300"
                        >
                            <Icon icon="lucide:arrow-up" className="mr-2" width="14" />
                            Load older messages
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
