import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify-icon/react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CreateServerDialog } from "../dialogs/CreateServerDialog";
import { JoinServerDialog } from "../dialogs/JoinServerDialog";
import { ServerDto } from "@/types";

interface ServerListProps {
    servers: ServerDto[];
    selectedServerId: string | null;
    loadingServers: boolean;
    isCreatingServer: boolean;
    onSelectServer: (id: string) => void;
    onJoinServer: (code: string) => void;
    onCreateServer: (name: string) => void;
    teamId: string;
}


interface ActionButtonProps {
    onClick: () => void;
    icon: string;
    label: string;
    loading?: boolean;
    disabled?: boolean;
    isActive?: boolean;
    variant?: 'default' | 'dashed' | 'ghost';
}

const ActionButton = React.memo(({ onClick, icon, label, loading = false, disabled = false, isActive = false, variant = 'default' }: ActionButtonProps) => {


    const baseStyles = "group relative flex items-center justify-center w-12 h-12 transition-all duration-300";

    const getVariantStyles = () => {
        switch (variant) {
            case 'dashed':
                return cn(
                    "rounded-[24px] border border-dashed border-zinc-400 dark:border-zinc-600 bg-transparent text-zinc-500",
                    "hover:border-solid hover:bg-zinc-900 hover:text-zinc-100 hover:border-zinc-900",
                    "dark:hover:bg-zinc-100 dark:hover:text-zinc-900 dark:hover:border-zinc-100",
                    "hover:rounded-[16px]"
                );
            case 'ghost':
                return cn(
                    "rounded-[24px] bg-transparent text-zinc-400 dark:text-zinc-500",
                    "hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100",
                    "hover:rounded-[16px]"
                );
            default:
                return cn(
                    "rounded-[24px] bg-zinc-100 dark:bg-zinc-900 text-zinc-500",
                    "hover:rounded-[16px] hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                );
        }
    };

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={onClick}
                        disabled={disabled}
                        className={cn(baseStyles, getVariantStyles(), disabled && "opacity-50 cursor-not-allowed")}
                    >
                        {loading ? (
                            <Icon icon="lucide:loader-2" className="animate-spin" width="20" />
                        ) : (
                            <Icon icon={icon} width="20" className="transition-transform duration-300 group-hover:scale-110" />
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-bold bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border-none shadow-xl text-xs">
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
});
ActionButton.displayName = 'ActionButton';

export const ServerList: React.FC<ServerListProps> = ({
    servers,
    selectedServerId,
    loadingServers,
    isCreatingServer,
    onSelectServer,
    onJoinServer,
    onCreateServer,
    teamId
}) => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

    return (
        <div className="w-[84px] flex flex-col items-center py-6 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-full z-10 shrink-0">
            <div className="flex-1 w-full px-2 overflow-y-auto no-scrollbar scroll-smooth">
                <div className="flex flex-col items-center gap-4">
                    {loadingServers && (
                        <div className="w-12 h-12 rounded-[24px] bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                    )}

                    {servers.map((server: ServerDto) => {
                        const isSelected = selectedServerId === server.id;
                        return (
                            <div key={server.id} className="relative flex items-center justify-center w-full group">
                                <div
                                    className={cn(
                                        "absolute -left-2 w-1.5 bg-zinc-900 dark:bg-white rounded-r-full transition-all duration-300",
                                        isSelected ? "h-10 opacity-100" : "h-2 opacity-0 group-hover:opacity-100 group-hover:h-5"
                                    )}
                                />

                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => onSelectServer(server.id)}
                                                className={cn(
                                                    "group relative w-12 h-12 flex items-center justify-center overflow-hidden transition-all duration-300",
                                                    isSelected ? "rounded-[16px]" : "rounded-[24px] hover:rounded-[16px]",
                                                    isSelected
                                                        ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg shadow-zinc-500/10"
                                                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                                )}
                                            >
                                                {server.avatar ? (
                                                    <img
                                                        src={server.avatar}
                                                        alt={server.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-sm leading-none">
                                                        {(server.name || "??").substring(0, 2).toUpperCase()}
                                                    </span>
                                                )}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="font-bold bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border-none shadow-xl text-xs">
                                            <p>{server.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="w-8 h-[1px] bg-zinc-200 dark:bg-zinc-800 my-3" />

            <div className="flex flex-col items-center gap-2 pb-2">


                <ActionButton
                    onClick={() => setIsCreateDialogOpen(true)}
                    icon="lucide:plus"
                    label="Create Server"
                    variant="dashed"
                    loading={isCreatingServer}
                    disabled={isCreatingServer}
                />

                <div className="flex flex-col gap-1 mt-1">
                    <ActionButton
                        onClick={() => setIsJoinDialogOpen(true)}
                        icon="lucide:compass"
                        label="Join Server"
                        variant="ghost"
                    />

                    <Link href={`/${teamId}/chat/trash`}>
                        <ActionButton
                            onClick={() => { }}
                            icon="lucide:trash-2"
                            label="Trash"
                            variant="ghost"
                        />
                    </Link>
                </div>

                <CreateServerDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    onCreate={onCreateServer}
                    loading={isCreatingServer}
                />

                <JoinServerDialog
                    open={isJoinDialogOpen}
                    onOpenChange={setIsJoinDialogOpen}
                    onJoin={onJoinServer}
                />
            </div>
        </div>
    );
};