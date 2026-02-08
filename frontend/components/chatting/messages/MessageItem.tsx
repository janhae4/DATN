import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fileService } from "@/services/fileService";
import { MessageAttachments } from "./MessageAttachments";
import { SystemMessage } from "./SystemMessage";
import { MessageContent } from "./MessageContent";
import { MessageReactions } from "./MessageReactions";
import { MessageActions } from "./MessageActions";
import { MessageReply } from "./MessageReply";
import { ChatMessage } from "./types";

export { type ChatMessage } from "./types";

interface MessageItemProps {
    msg: ChatMessage;
    isSameSender: boolean;
    userId?: string;
    selectedChannelId: string | null;
    selectedServerId: string | null;
    onReact: (params: { discussionId: string; messageId: string; emoji: string }) => void;
    onEdit?: (message: ChatMessage) => void;
    onDelete?: (messageId: string) => void;
    getUserName: (id: string) => string;
    formatTime: (dateString: string) => string;
    onReply: (message: ChatMessage) => void;
    onReplyClick?: (messageId: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
    msg,
    isSameSender,
    userId,
    selectedChannelId,
    selectedServerId,
    onReact,
    onEdit,
    onDelete,
    getUserName,
    formatTime,
    onReply,
    onReplyClick
}) => {
    const isMe = msg.sender?._id === userId;
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(msg.content);

    const isDeleted = msg.isDeleted;
    const isEdited = !!(msg.updatedAt && msg.updatedAt !== msg.createdAt);

    const handleSaveEdit = () => {
        if (editContent.trim() !== msg.content) {
            onEdit?.({ ...msg, content: editContent });
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditContent(msg.content);
        setIsEditing(false);
    };

    if (msg.sender?._id === 'SYSTEM_ID') {
        return <SystemMessage msg={msg} formatTime={formatTime} />;
    }

    return (
        <div
            id={`message-${msg._id}`}
            className={cn(
                "group flex gap-4 items-start w-full",
                isMe ? "flex-row-reverse" : "flex-row",
                isSameSender ? "mt-2" : "mt-6"
            )}>
            {msg.sender?._id !== userId ? (
                !isSameSender ? (
                    <div className="mt-0.5 shrink-0">
                        <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800 transition-opacity hover:opacity-80 cursor-pointer">
                            <AvatarImage src={msg.sender?.avatar} />
                            <AvatarFallback className="bg-blue-600 text-white font-medium">
                                {msg.sender?.name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                ) : (
                    <div className="w-10 shrink-0" />
                )
            ) : null}

            <div className={cn(
                "flex-1 min-w-0 max-w-[80%] flex flex-col",
                isMe ? "items-end" : "items-start"
            )}>

                {msg.replyTo && (
                    <MessageReply
                        replyTo={msg.replyTo}
                        isMe={isMe}
                        senderName={msg.sender.name}
                        selectedServerId={selectedServerId}
                        onReplyClick={onReplyClick}
                    />
                )}

                {!isSameSender && (
                    <div className={cn(
                        "flex items-center gap-2 mb-1 flex-row"
                    )}>
                        {!isMe && (
                            <span className="font-semibold text-zinc-900 dark:text-zinc-200 hover:underline cursor-pointer">
                                {msg.sender?.name}
                            </span>
                        )}
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                            {formatTime(msg.createdAt)}
                        </span>
                    </div>
                )}

                <div className="relative group/msg w-full">
                    <MessageContent
                        isEditing={isEditing}
                        editContent={editContent}
                        onEditContentChange={setEditContent}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        content={msg.content}
                        isMe={isMe}
                        isDeleted={isDeleted}
                        isEdited={isEdited}
                    />

                    {/* File Attachments */}
                    {!isDeleted && (
                        <div className={cn(
                            "mt-2 flex flex-col",
                            isMe ? "items-end text-right" : "items-start text-left"
                        )}>
                            <MessageAttachments
                                attachments={msg.attachments || []}
                                serverId={selectedServerId}
                                isMe={isMe}
                                onRemove={async (index) => {
                                    const attachment = msg.attachments?.[index];
                                    if (!attachment) return;
                                    console.log("attachment: ", attachment);

                                    try {
                                        if (!attachment.url.startsWith('http')) {
                                            await fileService.deleteFile(attachment.url);
                                            toast.success("File deleted from storage");
                                        }
                                    } catch (error) {
                                        console.warn("File deletion failed (might be already deleted):", error);
                                    }

                                    try {
                                        const newAttachments = [...(msg.attachments || [])];
                                        newAttachments.splice(index, 1);

                                        onEdit?.({ ...msg, attachments: newAttachments });
                                    } catch (error) {
                                        console.error("Failed to update message:", error);
                                        toast.error("Failed to update message");
                                    }
                                }}
                                onReply={() => onReply(msg)}
                                onReact={(emoji) => onReact({
                                    discussionId: selectedChannelId || "",
                                    messageId: msg._id,
                                    emoji
                                })}
                            />
                        </div>
                    )}

                    <MessageReactions
                        msg={msg}
                        isMe={isMe}
                        userId={userId}
                        selectedChannelId={selectedChannelId}
                        getUserName={getUserName}
                        onReact={onReact}
                    />

                    <MessageActions
                        msg={msg}
                        isMe={isMe}
                        isDeleted={isDeleted}
                        selectedChannelId={selectedChannelId}
                        onReact={onReact}
                        onReply={onReply}
                        onDelete={onDelete}
                        onStartEdit={() => setIsEditing(true)}
                    />
                </div>
            </div>
        </div>
    );
};
