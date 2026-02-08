import React, { useState } from "react";
import { Icon } from "@iconify-icon/react";
import { ChatHeader } from "./ChatHeader";
import { VoiceChannelArea } from "./VoiceChannelArea";
import { fileService } from "@/services/fileService";
import { toast } from "sonner";
import { MessageList } from "../messages/MessageList";
import { MessageInput } from "../messages/MessageInput";

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
    replyTo?: {
        messageId: string;
        content: string;
        senderName: string;
        attachments?: any[];
    };
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
    selectedServerId: string | null;
    selectedChannelId: string | null;
    selectedChannelName?: string;
    showMembers: boolean;
    onToggleMembers: () => void;
    messages: ChatMessage[];
    typingUsers: TypingUser[];
    hasNextPage: boolean;
    onFetchNextPage: () => void;
    onSendMessage: (content: string, attachments?: any[], replyToId?: string) => void;
    onTyping: () => void;
    isVoice: boolean;
    user: CurrentUser | null | undefined;
    userId?: string;
    voiceParticipants: VoiceParticipant[];
    remoteStreams: Map<string, MediaStream>;
    onLeaveVoice: () => void;
    onReact: (params: { discussionId: string; messageId: string; emoji: string }) => void;
    members: ChatMember[];
    onUpdateMessage: (messageId: string, content: string, attachments?: any[]) => void;
    onDeleteMessage: (messageId: string) => void;
    onOpenMobileMenu?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
    selectedServerId,
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
    members,
    onUpdateMessage,
    onDeleteMessage,
    onOpenMobileMenu
}) => {
    const [inputMsg, setInputMsg] = React.useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

    const handleAttachFiles = async (files: File[]) => {
        if (!selectedChannelId || !selectedServerId) return;

        setIsUploading(true);
        const attachments: any[] = [];

        try {
            for (const file of files) {
                const { fileId, uploadUrl } = await fileService.initiateUpload(
                    {
                        fileName: file.name,
                        fileType: file.type,
                        parentId: null,
                        isChatAttachment: true
                    },
                    undefined,
                    selectedServerId
                );

                await fileService.uploadFileToMinIO(uploadUrl, file);

                if (!fileId.startsWith('chat-files')) {
                    await fileService.confirmUpload(fileId);
                }

                attachments.push({
                    url: fileId,
                    type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
                    fileName: file.name
                });
            }

            if (attachments.length > 0) {
                const messageContent = inputMsg.trim() || "";
                onSendMessage(messageContent, attachments, replyingTo?._id);
                setInputMsg("");
                setReplyingTo(null);
            }
        } catch (error) {
            console.error('File upload error:', error);
            toast.error('Failed to upload files');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isUploading) {
            onSendMessage(inputMsg, [], replyingTo?._id);
            setInputMsg("");
            setReplyingTo(null);
        }
    };

    const handleReply = (message: ChatMessage) => {
        setReplyingTo(message);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputMsg(e.target.value);
        onTyping();
    };

    if (!selectedChannelId) {
        return (
            <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 relative items-center justify-center text-zinc-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800">
                        <Icon icon="lucide:message-square" width="32" className="opacity-50 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <p className="font-medium">Select a channel to start chatting</p>
                    <button
                        onClick={onOpenMobileMenu}
                        className="md:hidden px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-md text-sm font-medium transition-colors text-zinc-700 dark:text-zinc-200"
                    >
                        Open Menu
                    </button>
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
        <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 h-full overflow-hidden">
            <ChatHeader
                selectedChannelName={selectedChannelName}
                showMembers={showMembers}
                onToggleMembers={onToggleMembers}
                onOpenMobileMenu={onOpenMobileMenu}
            />

            <MessageList
                messages={messages}
                typingUsers={typingUsers}
                selectedChannelName={selectedChannelName}
                selectedChannelId={selectedChannelId}
                selectedServerId={selectedServerId}
                hasNextPage={hasNextPage}
                onFetchNextPage={onFetchNextPage}
                userId={userId}
                onReact={onReact}
                members={members}
                voiceParticipants={voiceParticipants}
                onUpdateMessage={onUpdateMessage}
                onDeleteMessage={onDeleteMessage}
                onReply={handleReply}
            />

            <MessageInput
                inputMsg={inputMsg}
                onInputChange={handleInputChange}
                onSendMessage={handleSendMessage}
                selectedChannelName={selectedChannelName}
                onAttachFiles={handleAttachFiles}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                selectedServerId={selectedServerId}
            />
        </div>
    );
};
