import React from "react";
import { Icon } from "@iconify-icon/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ChatHeaderProps {
    selectedChannelName?: string;
    showMembers: boolean;
    onToggleMembers: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    selectedChannelName,
    showMembers,
    onToggleMembers
}) => {
    return (
        <div className="h-14 border-b border-zinc-800 flex items-center px-4 bg-zinc-950 shrink-0 justify-between">
            <div className="flex items-center gap-2">
                <Icon icon="lucide:hash" className="text-zinc-500" width="20" />
                <span className="font-semibold text-zinc-100 truncate">{selectedChannelName}</span>
                <span className="text-xs text-zinc-500 hidden sm:inline-block ml-2 border-l border-zinc-800 pl-2">
                    Channel description placeholder
                </span>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
                    <Icon icon="lucide:phone" width="18" />
                </Button>
                <Separator orientation="vertical" className="h-6 bg-zinc-800 mx-1" />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleMembers}
                    className={showMembers ? "text-blue-400 bg-blue-400/10" : "text-zinc-400 hover:text-zinc-100"}
                >
                    <Icon icon="lucide:users" width="20" />
                </Button>
            </div>
        </div>
    );
};
