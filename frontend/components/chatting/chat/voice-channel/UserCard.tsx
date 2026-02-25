
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AudioWaveform } from "./AudioWaveform";

interface UserCardProps {
    name: string;
    avatar?: string;
    isMe?: boolean;
    isSpeaking: boolean;
}

export const UserCard = ({ name, avatar, isMe = false, isSpeaking = false }: UserCardProps) => (
    <div className={cn(
        "relative w-full aspect-[4/4] rounded-xl flex flex-col items-center justify-center transition-all duration-200 group",
        isSpeaking
            ? "bg-white dark:bg-[#18181b] border-2 border-black/80 dark:border-white/50 shadow-lg dark:shadow-[0_0_15px_-3px_rgba(255,255,255,0.15)]"
            : "bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm"
    )}>
        <Avatar className={cn(
            "h-20 w-20 md:h-24 md:w-24 shadow-md transition-all duration-300",
            isSpeaking ? "scale-105 ring-2 ring-black dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-[#18181b]" : "opacity-80 group-hover:opacity-100 grayscale-[0.2] group-hover:grayscale-0"
        )}>
            <AvatarImage src={avatar} className="object-cover" />
            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-400 font-bold text-2xl">
                {name?.[0]?.toUpperCase()}
            </AvatarFallback>
        </Avatar>

        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0 pr-2 overflow-hidden">
                <span className={cn(
                    "text-sm font-medium tracking-tight truncate",
                    isSpeaking ? "text-black dark:text-white" : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"
                )}>
                    {name}
                </span>
                {isMe && <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded ml-1 shrink-0">You</span>}
            </div>

            <div className="shrink-0">
                <AudioWaveform active={isSpeaking} />
            </div>
        </div>
    </div>
);
