import React from "react";
import { Icon } from "@iconify-icon/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HOME_SERVER_ID } from "@/constants/chat";

interface ServerHeaderProps {
    isHome: boolean;
    selectedServerId: string | null;
    selectedServerName: string;
    onSearchOpen: () => void;
    onInvite: () => void;
    onServerSettingsOpen: () => void;
    onCreateChannel: () => void;
    onCreateCategory: () => void;
    onDeleteServer: () => void;
}

export const ServerHeader: React.FC<ServerHeaderProps> = ({
    isHome,
    selectedServerId,
    selectedServerName,
    onSearchOpen,
    onInvite,
    onServerSettingsOpen,
    onCreateChannel,
    onCreateCategory,
    onDeleteServer,
}) => {
    if (isHome) {
        return (
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4">
                <button
                    onClick={onSearchOpen}
                    className="group w-full flex items-center gap-2 bg-zinc-200/50 dark:bg-zinc-800/40 text-[13px] px-3 h-8 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800/60 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-200 text-left font-medium"
                >
                    <Icon icon="lucide:search" width="14" className="opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="flex-1">Search</span>
                </button>
            </div>
        );
    }

    if (!selectedServerId) {
        return (
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-center px-4 font-medium text-zinc-500 text-sm">
                Select a server
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors w-full focus:outline-none">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate flex-1 text-left">{selectedServerName}</span>
                    <Icon icon="lucide:chevron-down" className="text-zinc-500" width="16" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl p-1" align="start" sideOffset={5}>
                <DropdownMenuItem onClick={onInvite} className="cursor-pointer text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg py-2">
                    <Icon icon="lucide:user-plus" className="mr-2 opacity-70" width="16" />
                    <span className="font-medium">Invite People</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800 my-1" />
                <DropdownMenuItem onClick={onServerSettingsOpen} className="cursor-pointer text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg py-2">
                    <Icon icon="lucide:settings" className="mr-2 opacity-70" width="16" />
                    <span className="font-medium">Server Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCreateChannel} className="cursor-pointer text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg py-2">
                    <Icon icon="lucide:plus-circle" className="mr-2 opacity-70" width="16" />
                    <span className="font-medium">Create Channel</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCreateCategory} className="cursor-pointer text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg py-2">
                    <Icon icon="lucide:folder-plus" className="mr-2 opacity-70" width="16" />
                    <span className="font-medium">Create Category</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800 my-1" />
                <DropdownMenuItem onClick={onDeleteServer} className="cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg py-2 focus:bg-red-50 focus:text-red-600">
                    <Icon icon="lucide:trash-2" className="mr-2 opacity-70" width="16" />
                    <span className="font-medium">Delete Server</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
