import React from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MessageSnapshot } from "@/types";

interface MessageReactionsProps {
    msg: MessageSnapshot;
    isMe: boolean;
    userId?: string;
    selectedChannelId: string | null;
    getUserName: (id: string) => string;
    onReact: (params: { discussionId: string; messageId: string; emoji: string }) => void;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
    msg,
    isMe,
    userId,
    selectedChannelId,
    getUserName,
    onReact
}) => {
    const reactions = msg.reactions || [];

    if (reactions.length === 0) return null;

    return (
        <div className={cn(
            "flex flex-wrap w-full gap-1 mt-2",
            isMe ? "flex-row-reverse" : "flex-row"
        )}>
            {reactions.map((r) => {
                const count = r.userIds.length;
                const isReacted = userId ? r.userIds.includes(userId) : false;
                const names = r.userIds.map((id: string) => getUserName(id));
                const displayNames = names.slice(0, 5).join(", ");
                const remainder = names.length > 5 ? ` and ${names.length - 5} others` : "";

                return (
                    <TooltipProvider key={r.emoji}>
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => onReact({ discussionId: selectedChannelId || "", messageId: msg._id, emoji: r.emoji })}
                                    className={cn(
                                        "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs border transition-colors",
                                        isReacted
                                            ? "bg-blue-500/20 border-blue-500/50 text-blue-600 dark:text-blue-200"
                                            : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                    )}
                                >
                                    <span>{r.emoji}</span>
                                    <span className="font-medium text-xs ml-0.5">{count}</span>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs">
                                <p>{displayNames}{remainder}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            })}
        </div>
    );
};
