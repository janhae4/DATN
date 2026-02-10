import React from "react";
import { Icon } from "@iconify-icon/react";
import { cn } from "@/lib/utils";
import { MessageSnapshot } from "@/types";
import { ReplyAttachmentPreview } from "./ReplyAttachmentPreview";

interface MessageReplyProps {
    replyTo: NonNullable<MessageSnapshot['replyTo']>;
    isMe: boolean;
    senderName: string;
    selectedServerId: string | null;
    onReplyClick?: (messageId: string) => void;
}

export const MessageReply: React.FC<MessageReplyProps> = ({
    replyTo,
    isMe,
    senderName,
    selectedServerId,
    onReplyClick
}) => {
    return (
        <div
            onClick={() => onReplyClick?.(replyTo.messageId || "")}
            className={cn(
                "flex flex-col gap-1 mb-1 text-xs opacity-70 transition-opacity hover:opacity-100 cursor-pointer",
                isMe ? "items-end text-right" : "items-start text-left"
            )}>
            <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                <Icon icon="lucide:reply" width="12" className="transform scale-x-[-1]" />
                <span className="font-medium"> {isMe ? "You" : senderName} replied to @{replyTo.senderName}</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors max-w-[200px]">
                {replyTo.attachments && replyTo.attachments.length > 0 && (
                    <div className="flex items-center justify-center h-8 w-8 bg-zinc-200 dark:bg-zinc-700 rounded overflow-hidden shrink-0">
                        <ReplyAttachmentPreview
                            attachment={replyTo.attachments[0]}
                            serverId={selectedServerId}
                        />
                    </div>
                )}
                <span className="text-zinc-500 truncate">
                    {(() => {
                        const content = replyTo.content;
                        const hasAttachments = replyTo.attachments && replyTo.attachments.length > 0;

                        if (hasAttachments && (content === "Click to see attachment" || !content)) {
                            const att = replyTo.attachments![0];
                            const extension = att.fileName?.toLowerCase().split('.').pop() || '';
                            const isImage = att.type === 'image' || att.type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);

                            return isImage ? "Image" : att.fileName;
                        }

                        return content || "Message";
                    })()}
                </span>
            </div>
        </div>
    );
};
