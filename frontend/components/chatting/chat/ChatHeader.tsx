import React from "react";
import { Icon } from "@iconify-icon/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatLastSeen } from "@/lib/formatLastSeen";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatHeaderProps {
    selectedChannelName?: string;
    showMembers: boolean;
    onToggleMembers: () => void;
    isDirectMessage?: boolean;
    isOnline?: boolean;
    lastSeen?: Date | null;
    onSummarize?: () => void;
    canSummarize?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps & { onOpenMobileMenu?: () => void }> = ({
    selectedChannelName,
    showMembers,
    onToggleMembers,
    onOpenMobileMenu,
    isDirectMessage,
    isOnline,
    lastSeen,
    onSummarize,
    canSummarize = true
}) => {
    return (
        <div className="h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center px-5  to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/50 backdrop-blur-sm shrink-0 justify-between">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 -ml-2 mr-1 transition-all duration-200"
                    onClick={onOpenMobileMenu}
                >
                    <Icon icon="lucide:menu" width="20" />
                </Button>

                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200/50 dark:from-zinc-800 dark:to-zinc-700/50 shadow-sm">
                    <Icon
                        icon={isDirectMessage ? "lucide:at-sign" : "lucide:hash"}
                        className="text-zinc-600 dark:text-zinc-300"
                        width="16"
                    />
                </div>

                {/* Channel/User Info */}
                <div className="flex flex-col gap-0.5">
                    <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-50 truncate leading-none tracking-tight">
                        {selectedChannelName}
                    </h2>
                    {isDirectMessage && (
                        <div className="flex items-center gap-2 mt-1">
                            {/* Animated status indicator */}
                            <div className="relative flex items-center">
                                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-600'} transition-colors duration-300`} />
                                {isOnline && (
                                    <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
                                )}
                            </div>
                            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 tracking-wide">
                                {isOnline ? "Online" : formatLastSeen(lastSeen ?? null)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <TooltipProvider delayDuration={300}>
                <div className="flex items-center gap-1.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onSummarize}
                                    disabled={!canSummarize}
                                    className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon icon="lucide:sparkles" width="18" />
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            {canSummarize ? (
                                <p>AI Summarize Conversation</p>
                            ) : (
                                <p>Need at least 10 messages to summarize</p>
                            )}
                        </TooltipContent>
                    </Tooltip>

                    <Separator orientation="vertical" className="h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-200 rounded-lg"
                            >
                                <Icon icon="lucide:phone" width="18" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Start Voice Call</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all duration-200 rounded-lg"
                            >
                                <Icon icon="lucide:video" width="18" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Start Video Call</p>
                        </TooltipContent>
                    </Tooltip>

                    <Separator orientation="vertical" className="h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleMembers}
                                className={`transition-all duration-200 rounded-lg ${showMembers
                                    ? "text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-950/40 dark:hover:bg-blue-950/60"
                                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    }`}
                            >
                                <Icon icon="lucide:panel-right" width="20" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{showMembers ? "Hide" : "Show"} Member List</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        </div>
    );
};
