import React from "react";
import { Icon } from "@iconify-icon/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceHeaderProps {
    channelName?: string;
    isCCOn: boolean;
    participantCount: number;  // total including self
    showMembers: boolean;
    onToggleMembers: () => void;
}

export const VoiceHeader: React.FC<VoiceHeaderProps> = ({
    channelName,
    isCCOn,
    participantCount,
    showMembers,
    onToggleMembers,
}) => {
    return (
        <header className="h-16 flex items-center justify-between px-6 z-30 shrink-0 border-b border-zinc-200 dark:border-[#27272a] bg-white/95 dark:bg-[#09090b]/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#09090b]/60">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700/50">
                    <Icon icon="lucide:mic" width="16" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {channelName || "General Voice"}
                    </h2>
                    <div className="flex items-center gap-1.5 -mt-0.5">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                            Live Session
                        </span>
                        {isCCOn && (
                            <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                                CC
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right — participants button */}
            <Button
                variant="ghost"
                onClick={onToggleMembers}
                className={cn(
                    "h-8 px-3 text-xs font-medium tracking-wide transition-colors rounded-lg border",
                    showMembers
                        ? "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                        : "bg-transparent text-zinc-500 border-transparent hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                )}
            >
                <Icon icon="lucide:users" width="14" className="mr-2" />
                Participants{" "}
                <span className="ml-1.5 text-zinc-400 dark:text-zinc-500">
                    {participantCount}
                </span>
            </Button>
        </header>
    );
};
