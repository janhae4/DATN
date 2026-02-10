import React from "react";
import { Icon } from "@iconify-icon/react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MessageSnapshot } from "@/types";

interface MessageActionsProps {
    msg: MessageSnapshot;
    isMe: boolean;
    isDeleted?: boolean;
    selectedChannelId: string | null;
    onReact: (params: { discussionId: string; messageId: string; emoji: string }) => void;
    onReply: (message: MessageSnapshot) => void;
    onDelete?: (messageId: string) => void;
    onStartEdit: () => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
    msg,
    isMe,
    isDeleted,
    selectedChannelId,
    onReact,
    onReply,
    onDelete,
    onStartEdit
}) => {
    if (isDeleted) return null;

    return (
        <div className={cn(
            "absolute -top-10 opacity-0 group-hover/msg:opacity-100 transition-all bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg flex items-center p-0.5 z-10 scale-95 hover:scale-100",
            isMe ? "right-0" : "left-0"
        )}>
            <Popover>
                <TooltipProvider>
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                    <Icon icon="lucide:smile-plus" width="16" />
                                </Button>
                            </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-900 dark:bg-zinc-900 border-zinc-800 text-zinc-300 text-xs">
                            <p>Add reaction</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="top">
                    <EmojiPicker
                        onEmojiClick={(emojiData: EmojiClickData) => {
                            onReact({ discussionId: selectedChannelId || "", messageId: msg._id, emoji: emojiData.emoji });
                        }}
                        theme={Theme.AUTO}
                    />
                </PopoverContent>
            </Popover>

            <TooltipProvider>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            onClick={() => onReply(msg)}
                        >
                            <Icon icon="lucide:reply" width="16" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs">
                        <p>Reply</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
                <TooltipProvider>
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                    <Icon icon="lucide:more-horizontal" width="16" />
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs">
                            <p>More</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(msg.content)} className="hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-900 dark:focus:text-zinc-200">
                        <Icon icon="lucide:copy" className="mr-2" width="16" /> Copy Text
                    </DropdownMenuItem>
                    {isMe && (
                        <>
                            <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
                            <DropdownMenuItem onClick={onStartEdit} className="hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-900 dark:focus:text-zinc-200">
                                <Icon icon="lucide:pencil" className="mr-2" width="16" /> Edit Message
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete?.(msg._id)} className="hover:bg-red-900/50 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-900/50">
                                <Icon icon="lucide:trash-2" className="mr-2" width="16" /> Delete Message
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
