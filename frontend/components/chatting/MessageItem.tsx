import React from "react";
import { Icon } from "@iconify-icon/react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface Reaction {
    emoji: string;
    userIds: string[];
}

interface MessageSender {
    _id: string;
    name: string;
    avatar?: string;
}

export interface ChatMessage {
    _id: string;
    content: string;
    sender: MessageSender;
    createdAt: string;
    reactions: Reaction[];
}

interface MessageItemProps {
    msg: ChatMessage;
    isSameSender: boolean;
    userId?: string;
    selectedChannelId: string | null;
    onReact: (params: { discussionId: string; messageId: string; emoji: string }) => void;
    getUserName: (id: string) => string;
    formatTime: (dateString: string) => string;
}

export const MessageItem: React.FC<MessageItemProps> = ({
    msg,
    isSameSender,
    userId,
    selectedChannelId,
    onReact,
    getUserName,
    formatTime
}) => {
    const reactions = msg.reactions || [];

    return (
        <div className={`group flex gap-4 ${isSameSender ? 'mt-1' : 'mt-4'} items-start`}>
            <div className="mt-0.5 shrink-0">
                {!isSameSender ? (
                    <Avatar className="h-10 w-10 border border-zinc-800 transition-opacity hover:opacity-80 cursor-pointer">
                        <AvatarImage src={msg.sender?.avatar} />
                        <AvatarFallback className="bg-blue-600 text-white font-medium">
                            {msg.sender?.name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                ) : (
                    <div className="w-10" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                {!isSameSender && (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-zinc-200 hover:underline cursor-pointer">
                            {msg.sender?.name}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-medium">
                            {formatTime(msg.createdAt)}
                        </span>
                    </div>
                )}
                <div className="relative group/msg">
                    <p className={`text-zinc-300 text-[15px] leading-relaxed break-words whitespace-pre-wrap`}>
                        {msg.content}
                    </p>

                    {/* Reactions Display */}
                    {reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
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
                                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs border transition-colors ${isReacted
                                                        ? "bg-blue-500/20 border-blue-500/50 text-blue-200"
                                                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                                                        }`}
                                                >
                                                    <span>{r.emoji}</span>
                                                    <span className="font-medium text-xs ml-0.5">{count}</span>
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs">
                                                <p>{displayNames}{remainder}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            })}
                        </div>
                    )}

                    {/* Hover Actions */}
                    <div className="absolute -top-6 right-0 opacity-0 group-hover/msg:opacity-100 transition-all bg-zinc-900 border border-zinc-700 rounded-md shadow-lg flex items-center p-0.5 z-10 scale-95 hover:scale-100">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-100 rounded-sm hover:bg-zinc-800">
                                    <Icon icon="lucide:smile-plus" width="16" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="top">
                                <EmojiPicker
                                    onEmojiClick={(emojiData: EmojiClickData) => {
                                        onReact({ discussionId: selectedChannelId || "", messageId: msg._id, emoji: emojiData.emoji });
                                    }}
                                    theme={Theme.DARK}
                                />
                            </PopoverContent>
                        </Popover>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-100 rounded-sm hover:bg-zinc-800">
                            <Icon icon="lucide:reply" width="16" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-100 rounded-sm hover:bg-zinc-800">
                            <Icon icon="lucide:more-horizontal" width="16" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
