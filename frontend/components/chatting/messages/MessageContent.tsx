import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MessageContentProps {
    isEditing: boolean;
    editContent: string;
    onEditContentChange: (content: string) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    content: string;
    isMe: boolean;
    isDeleted?: boolean;
    isEdited?: boolean;
}

export const MessageContent: React.FC<MessageContentProps> = ({
    isEditing,
    editContent,
    onEditContentChange,
    onSaveEdit,
    onCancelEdit,
    content,
    isMe,
    isDeleted,
    isEdited
}) => {
    if (isEditing) {
        return (
            <div className={cn(
                "w-full flex flex-col gap-2 p-2 rounded-lg border",
                "bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50",
                isMe ? "items-end" : "items-start"
            )}>
                <textarea
                    value={editContent}
                    onChange={(e) => onEditContentChange(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded p-2 text-zinc-900 dark:text-zinc-200 text-sm focus:outline-none focus:border-blue-500/50 min-h-[60px] resize-none placeholder:text-zinc-400"
                    autoFocus
                />
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-7 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400">Cancel</Button>
                    <Button size="sm" onClick={onSaveEdit} className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white">Save</Button>
                </div>
            </div>
        );
    }

    if ((!content || content.trim().length === 0) && !isDeleted) return null;

    return (
        <div className={cn(
            "w-full flex",
            isMe ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "rounded-2xl px-4 py-2 max-w-full",
                isMe
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-transparent"
            )}>
                <p className={cn(
                    "text-[15px] leading-relaxed break-words whitespace-pre-wrap",
                    isDeleted && "italic text-zinc-500 dark:text-zinc-400 text-sm"
                )}>
                    {isDeleted ? "This message has been deleted." : content}
                    {!isDeleted && isEdited && (
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 ml-1">(edited)</span>
                    )}
                </p>
            </div>
        </div>
    );
};
