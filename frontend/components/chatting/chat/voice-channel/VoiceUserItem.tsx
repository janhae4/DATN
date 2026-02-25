import React from "react";
import { Icon } from "@iconify-icon/react";
import { cn } from "@/lib/utils";

interface VoiceUserItemProps {
    userInfo: {
        id: string;
        name: string;
        avatar?: string;
    };
    isSpeaking?: boolean;
}

export const VoiceUserItem: React.FC<VoiceUserItemProps> = ({ userInfo, isSpeaking }) => {
    return (
        <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors group/user cursor-default">
            <div className="relative">
                <img
                    src={userInfo.avatar || `https://avatar.vercel.sh/${userInfo.name}`}
                    alt={userInfo.name}
                    className={cn(
                        "w-5 h-5 rounded-full object-cover ring-2",
                        isSpeaking ? "ring-emerald-500" : "ring-transparent"
                    )}
                />

            </div>
            <span className={cn(
                "text-xs truncate max-w-[120px]",
                isSpeaking ? "text-zinc-900 dark:text-zinc-100 font-bold" : "text-zinc-500 dark:text-zinc-400 group-hover/user:text-zinc-700 dark:group-hover/user:text-zinc-300"
            )}>
                {userInfo.name || "Unknown User"}
            </span>
        </div>
    );
};
