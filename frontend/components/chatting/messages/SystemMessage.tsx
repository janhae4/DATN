import React from "react";
import { MessageSnapshot } from "@/types";

interface SystemMessageProps {
    msg: MessageSnapshot;
    formatTime: (date: string | Date) => string;
}

export const SystemMessage: React.FC<SystemMessageProps> = ({ msg, formatTime }) => {
    return (
        <div className="flex w-full gap-2 flex-col items-center justify-center my-4 group/system">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-600 ml-2">
                {formatTime(msg.createdAt)}
            </span>
            <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-900 transition-colors">
                <span className="text-xs text-zinc-500 font-medium group-hover/system:text-zinc-600 dark:group-hover/system:text-zinc-400 transition-colors">
                    {msg.content}
                </span>
            </div>
        </div>
    );
};
