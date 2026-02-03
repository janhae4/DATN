import React from "react";
import { Icon } from "@iconify-icon/react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { VoiceChannelArea } from "./VoiceChannelArea";

interface Reaction {
    emoji: string;
    userIds: string[];
}

interface MessageSender {
    _id: string;
    name: string;
    avatar?: string;
}

interface ChatMessage {
    _id: string;
    content: string;
    sender: MessageSender;
    createdAt: string;
    reactions: Reaction[];
}

interface TypingUser {
    userId: string;
    name: string;
    avatar?: string;
}

interface VoiceParticipant {
    userInfo: {
        id: string;
        name: string;
        avatar?: string;
    };
}

interface ChatMember {
    userId: string;
    name: string;
    avatar?: string;
    role?: string;
    isAdmin?: boolean;
}

interface CurrentUser {
    id: string;
    name: string;
    avatar?: string;
}

interface ChatAreaProps {
    selectedChannelId: string | null;
    selectedChannelName?: string;
    showMembers: boolean;
    onToggleMembers: () => void;
    messages: ChatMessage[];
    typingUsers: TypingUser[];
    hasNextPage: boolean;
    onFetchNextPage: () => void;
    onSendMessage: (content: string) => void;
    onTyping: () => void;
    isVoice: boolean;
    user: CurrentUser | null | undefined;
    userId?: string;
    voiceParticipants: VoiceParticipant[];
    remoteStreams: Map<string, MediaStream>;
    onLeaveVoice: () => void;
    onReact: (params: { discussionId: string; messageId: string; emoji: string }) => void;
    members: ChatMember[];
}

export const ChatArea: React.FC<ChatAreaProps> = ({
    selectedChannelId,
    selectedChannelName,
    showMembers,
    onToggleMembers,
    messages,
    typingUsers,
    hasNextPage,
    onFetchNextPage,
    onSendMessage,
    onTyping,
    isVoice,
    user,
    userId,
    voiceParticipants,
    remoteStreams,
    onLeaveVoice,
    onReact,
    members
}) => {
    const [inputMsg, setInputMsg] = React.useState("");

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        onSendMessage(inputMsg);
        setInputMsg("");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputMsg(e.target.value);
        onTyping();
    };

    if (!selectedChannelId) {
        return (
            <div className="flex-1 flex flex-col bg-zinc-950 relative items-center justify-center text-zinc-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800">
                        <Icon icon="lucide:message-square" width="32" className="opacity-50" />
                    </div>
                    <p className="font-medium">Select a channel to start chatting</p>
                </div>
            </div>
        );
    }

    if (isVoice) {
        return (
            <VoiceChannelArea
                selectedChannelName={selectedChannelName}
                onToggleMembers={onToggleMembers}
                showMembers={showMembers}
                user={user}
                userId={userId}
                voiceParticipants={voiceParticipants}
                remoteStreams={remoteStreams}
                onLeaveVoice={onLeaveVoice}
            />
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-zinc-950 h-full overflow-hidden">
            <ChatHeader
                selectedChannelName={selectedChannelName}
                showMembers={showMembers}
                onToggleMembers={onToggleMembers}
            />

            <MessageList
                messages={messages}
                typingUsers={typingUsers}
                selectedChannelName={selectedChannelName}
                selectedChannelId={selectedChannelId}
                hasNextPage={hasNextPage}
                onFetchNextPage={onFetchNextPage}
                userId={userId}
                onReact={onReact}
                members={members}
                voiceParticipants={voiceParticipants}
            />

            <MessageInput
                inputMsg={inputMsg}
                onInputChange={handleInputChange}
                onSendMessage={handleSendMessage}
                selectedChannelName={selectedChannelName}
            />
        </div>
    );
};
