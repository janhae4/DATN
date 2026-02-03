import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify-icon/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServerListProps {
    servers: any[];
    selectedServerId: string | null;
    loadingServers: boolean;
    isCreatingServer: boolean;
    onSelectServer: (id: string) => void;
    onJoinServer: (code: string) => void;
    onCreateServer: (name: string) => void;
    teamId: string;
}

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
    const [newServerName, setNewServerName] = useState("");
    const [inviteCode, setInviteCode] = useState("");

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newServerName.trim()) {
            onCreateServer(newServerName);
            setNewServerName("");
            setIsCreateDialogOpen(false);
        }
    };

    const handleJoinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inviteCode.trim()) {
            onJoinServer(inviteCode);
            setInviteCode("");
            setIsJoinDialogOpen(false);
        }
    };

    const ActionButton = ({ onClick, icon, label, loading = false, disabled = false, danger = false }: any) => {
        return (
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={onClick}
                            disabled={disabled}
                            className={cn(
                                "group relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:bg-zinc-800",
                                danger ? "text-zinc-500 hover:text-red-400" : "text-zinc-500 hover:text-zinc-100",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {loading ? (
                                <Icon icon="lucide:loader-2" className="animate-spin" width="20" />
                            ) : (
                                <Icon icon={icon} width="20" />
                            )}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs">
                        <p>{label}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    return (
        <div className="w-[72px] flex flex-col items-center py-4 bg-zinc-950 border-r border-zinc-900/50 h-full z-20">
            {/* Server List */}
            <ScrollArea className="flex-1 w-full px-2">
                <div className="flex flex-col items-center gap-2">
                    {loadingServers && (
                        <div className="w-10 h-10 rounded-full bg-zinc-900/50 animate-pulse" />
                    )}

                    {servers.map((server: any) => {
                        const isSelected = selectedServerId === server.id;
                        return (
                            <div key={server.id} className="relative flex items-center justify-center w-full">
                                {/* Active Indicator */}
                                <div
                                    className={cn(
                                        "absolute left-0 w-1 bg-white rounded-r-full transition-all duration-300",
                                        isSelected ? "h-6 opacity-100" : "h-2 opacity-0 group-hover:opacity-50"
                                    )}
                                />

                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => onSelectServer(server.id)}
                                                className={cn(
                                                    "group relative w-10 h-10 flex items-center justify-center rounded-full overflow-hidden transition-all duration-300",
                                                    isSelected ? "bg-zinc-800 text-white shadow-sm rounded-xl" : "bg-transparent text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                                                )}
                                            >
                                                {server.avatar ? (
                                                    <img
                                                        src={server.avatar}
                                                        alt={server.name}
                                                        className={cn(
                                                            "w-full h-full object-cover transition-transform duration-300",
                                                            isSelected ? "scale-100" : "scale-105 opacity-80 group-hover:opacity-100"
                                                        )}
                                                    />
                                                ) : (
                                                    <span className="font-semibold text-xs">
                                                        {(server.name || "??").substring(0, 2).toUpperCase()}
                                                    </span>
                                                )}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="bg-zinc-950 border-zinc-900 text-zinc-300 text-xs font-medium">
                                            <p>{server.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            <Separator className="my-3 bg-zinc-900 w-8 mx-auto" />

            {/* Actions */}
            <div className="flex flex-col items-center gap-1 pb-2">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <div>
                            <ActionButton
                                onClick={() => setIsCreateDialogOpen(true)}
                                icon="lucide:plus"
                                label="Create Server"
                                loading={isCreatingServer}
                                disabled={isCreatingServer}
                            />
                        </div>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create a Server</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Give your new server a personality with a name and an icon.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSubmit} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-zinc-300">Server Name</Label>
                                <Input
                                    id="name"
                                    value={newServerName}
                                    onChange={(e) => setNewServerName(e.target.value)}
                                    className="bg-zinc-950 border-zinc-800 focus:ring-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                                    placeholder="Enter server name"
                                    autoFocus
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={!newServerName.trim() || isCreatingServer} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    Create Server
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                    <DialogTrigger asChild>
                        <div>
                            <ActionButton
                                onClick={() => setIsJoinDialogOpen(true)}
                                icon="lucide:compass"
                                label="Join Server"
                            />
                        </div>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Join a Server</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Enter an invite code to join an existing server.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleJoinSubmit} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="inviteCode" className="text-zinc-300">Invite Code</Label>
                                <Input
                                    id="inviteCode"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    className="bg-zinc-950 border-zinc-800 focus:ring-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                                    placeholder="Enter invite code"
                                    autoFocus
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={!inviteCode.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    Join Server
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Link href={`/${teamId}/chat/trash`} className="mt-1">
                    <ActionButton
                        onClick={() => { }}
                        icon="lucide:trash-2"
                        label="Trash"
                        danger
                    />
                </Link>
            </div>
        </div>
    );
};
