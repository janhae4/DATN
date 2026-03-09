import React, { useState } from "react";
import { Icon } from "@iconify-icon/react";
import { ChatHeader } from "./ChatHeader";
import { VoiceChannelArea } from "./VoiceChannelArea";
import { DisconnectedVoice } from "./DisconnectedVoice";
import { fileService } from "@/services/fileService";
import { toast } from "sonner";
import { MessageList } from "../messages/MessageList";
import { MessageInput } from "../messages/MessageInput";
import { MessageSnapshot, AttachmentDto } from "@/types";
import { HOME_SERVER_ID } from "@/constants/chat";
import { SummaryBox } from "./SummaryBox";
import { ChatTaskProposalDialog } from "../dialogs/ChatTaskProposalDialog";
import { taskService } from "@/services/taskService";
import { discussionService } from "@/services/discussionService";
import { CaptionEntry } from "@/hooks/chat/useVoiceSocket";


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
    selectedTeamId: string | null;
    selectedChannelName?: string;
    showMembers: boolean;
    onToggleMembers: () => void;
    messages: MessageSnapshot[];
    typingUsers: TypingUser[];
    hasNextPage: boolean;
    onFetchNextPage: () => void;
    onSendMessage: (content: string, attachments?: AttachmentDto[], replyToId?: string) => void;
    onTyping: () => void;
    isVoice: boolean;
    user: CurrentUser | null | undefined;
    userId?: string;
    voiceParticipants: VoiceParticipant[];
    remoteStreams: Map<string, MediaStream>;
    onLeaveVoice: () => void;
    onJoinVoice?: (channelId: string) => void;
    activeVoiceChannelId?: string | null;
    isMuted: boolean;
    speakingUsers: Set<string>;
    onToggleMute: () => void;
    onReact: (params: { discussionId: string; messageId: string; emoji: string }) => void;
    members: ChatMember[];
    onUpdateMessage: (messageId: string, content: string, attachments?: AttachmentDto[]) => void;
    onDeleteMessage: (messageId: string) => void;
    onOpenMobileMenu?: () => void;
    isOnline?: boolean;
    lastSeen?: Date | null;
    ccCaptions?: Map<string, CaptionEntry>;
    onEmitCCTranscript?: (text: string, isFinal: boolean) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
    selectedServerId,
    selectedChannelId,
    selectedTeamId,
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
    isMuted,
    speakingUsers,
    onToggleMute,
    onReact,
    members,
    onUpdateMessage,
    onDeleteMessage,
    onOpenMobileMenu,
    onJoinVoice,
    activeVoiceChannelId,
    isOnline,
    lastSeen,
    ccCaptions,
    onEmitCCTranscript,
}) => {
    const [inputMsg, setInputMsg] = React.useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [replyingTo, setReplyingTo] = React.useState<MessageSnapshot | null>(null);
    const [showSummary, setShowSummary] = useState(false);

    // Summary state (shared between ChatHeader button & /summarize slash command)
    const [summaryText, setSummaryText] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);

    const handleSummarize = async () => {
        if (!selectedChannelId) {
            toast.error("No channel selected");
            return;
        }
        setIsSummarizing(true);
        setSummaryText(null);
        try {
            const result = await discussionService.summarizeDiscussion(selectedChannelId, 50);
            const text =
                typeof result === "string"
                    ? result
                    : typeof result?.summary === "string"
                        ? result.summary
                        : null;
            setSummaryText(text || "Failed to generate summary. Please try again.");
        } catch {
            toast.error("Failed to summarize conversation");
        } finally {
            setIsSummarizing(false);
        }
    };

    const [showTaskProposal, setShowTaskProposal] = useState(false);
    const [proposedTasks, setProposedTasks] = useState<any[]>([]);

    const handleGenerateTask = async (messageId?: string) => {
        if (!selectedChannelId || !selectedTeamId) {
            toast.error("Cannot create task: Missing context");
            return;
        }

        const toastId = toast.loading("Analyzing conversation...");
        try {
            let tasks;
            if (messageId) {
                tasks = await taskService.generateFromMessage({
                    messageId,
                    teamId: selectedTeamId
                });
            } else {
                tasks = await taskService.generateFromChat({
                    discussionId: selectedChannelId,
                    teamId: selectedTeamId,
                    messageLimit: 50
                });
            }

            if (tasks && tasks.length > 0) {
                setProposedTasks(tasks);
                setShowTaskProposal(true);
                toast.dismiss(toastId);
            } else {
                toast.error("No tasks could be generated.", { id: toastId });
            }
        } catch (error) {
            console.error("Failed to generate tasks:", error);
            toast.error("Failed to generate tasks", { id: toastId });
        }
    };


    const handleAttachFiles = async (files: File[]) => {
        if (!selectedChannelId) return;

        setIsUploading(true);
        const attachments: AttachmentDto[] = [];

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
                    selectedServerId || undefined // serverId is optional for DM
                );

                await fileService.uploadFileToMinIO(uploadUrl, file);

                if (!fileId.startsWith('chat-files')) {
                    await fileService.confirmUpload(fileId);
                }

                attachments.push({
                    url: fileId,
                    type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
                    fileName: file.name,
                    size: file.size
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

    const handleReply = (message: MessageSnapshot) => {
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
        if (activeVoiceChannelId !== selectedChannelId) {
            return (
                <DisconnectedVoice
                    selectedChannelName={selectedChannelName}
                    showMembers={showMembers}
                    onToggleMembers={onToggleMembers}
                    onOpenMobileMenu={onOpenMobileMenu}
                    voiceParticipants={voiceParticipants}
                    selectedChannelId={selectedChannelId || ""}
                    onJoinVoice={onJoinVoice}
                />
            );
        }

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
                isMuted={isMuted}
                speakingUsers={speakingUsers}
                onToggleMute={onToggleMute}
                ccCaptions={ccCaptions}
                onEmitCCTranscript={onEmitCCTranscript}
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
                isDirectMessage={selectedServerId === HOME_SERVER_ID}
                isOnline={isOnline}
                lastSeen={lastSeen}
                onSummarize={handleSummarize}
                canSummarize={messages.length >= 10}
            />

            <MessageList
                messages={messages}
                typingUsers={typingUsers}
                selectedChannelName={selectedChannelName}
                selectedChannelId={selectedChannelId}
                selectedServerId={selectedServerId}
                selectedTeamId={selectedTeamId}
                hasNextPage={hasNextPage}
                onFetchNextPage={onFetchNextPage}
                userId={userId}
                onReact={onReact}
                members={members}
                voiceParticipants={voiceParticipants}
                onUpdateMessage={onUpdateMessage}
                onDeleteMessage={onDeleteMessage}
                onReply={handleReply}
                onGenerateTask={handleGenerateTask}
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
                selectedChannelId={selectedChannelId}
                selectedTeamId={selectedTeamId}
                onGenerateTask={() => handleGenerateTask()}
                summaryText={summaryText}
                isSummarizing={isSummarizing}
                onSummarize={handleSummarize}
                onCloseSummary={() => setSummaryText(null)}
            />

            {/* SummaryBox kept but no longer primary — banner in MessageInput is used */}
            <SummaryBox
                open={showSummary}
                onClose={() => setShowSummary(false)}
                discussionId={selectedChannelId}
                messageLimit={50}
            />

            {selectedTeamId && (
                <ChatTaskProposalDialog
                    open={showTaskProposal}
                    onOpenChange={setShowTaskProposal}
                    initialTasks={proposedTasks}
                    teamId={selectedTeamId}
                />
            )}
        </div>
    );
};
