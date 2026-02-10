import React from "react";
import { Icon } from "@iconify-icon/react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DirectMessageItemProps {
    userId: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    isSelected: boolean;
    unreadCount?: number;
    onClick: () => void;
}

export const DirectMessageItem: React.FC<DirectMessageItemProps> = ({
    userId,
    name,
    avatar,
    isOnline = false,
    isSelected,
    unreadCount = 0,
    onClick
}) => {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-200 group",
                isSelected
                    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
        >
            {/* Avatar with online status */}
            <div className="relative shrink-0">
                <Avatar className="w-7 h-7">
                    <AvatarImage src={avatar || `https://avatar.vercel.sh/${name}`} alt={name} />
                    <AvatarFallback className="text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                {/* Online status indicator */}
                <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900",
                    isOnline ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600"
                )} />
            </div>

            {/* Name */}
            <span className={cn(
                "truncate flex-1 text-left text-sm",
                isSelected ? "font-semibold" : "font-medium"
            )}>
                {name}
            </span>

            {/* Unread badge */}
            {unreadCount > 0 && (
                <div className="shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </div>
            )}
        </button>
    );
};
