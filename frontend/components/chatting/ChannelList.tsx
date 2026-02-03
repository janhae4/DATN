import React, { useState } from "react";
import { Icon } from "@iconify-icon/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChannelListProps {
    selectedServerName: string;
    selectedServerId: string | null;
    channels: any[];
    selectedChannelId: string | null;
    expandedCategories: Set<string>;
    loadingChannels: boolean;
    isCreatingChannel: boolean;
    onUpdateServer: () => void;
    onDeleteServer: () => void;
    onPermanentDeleteServer: () => void;
    onInvite: () => void;
    onSelectChannel: (id: string) => void;
    onToggleCategory: (id: string) => void;
    onCreateChannel: (parentId?: string) => void;
    onCreateCategory: () => void;
    onUpdateChannel: (id: string, name: string) => void;
    onDeleteChannel: (id: string) => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({
    selectedServerName,
    selectedServerId,
    channels,
    selectedChannelId,
    expandedCategories,
    loadingChannels,
    isCreatingChannel,
    onUpdateServer,
    onDeleteServer,
    onPermanentDeleteServer,
    onInvite,
    onSelectChannel,
    onToggleCategory,
    onCreateChannel,
    onCreateCategory,
    onUpdateChannel,
    onDeleteChannel
}) => {

    const [settingsChannel, setSettingsChannel] = useState<any | null>(null);
    const [editName, setEditName] = useState("");

    const handleOpenSettings = (e: React.MouseEvent, channel: any) => {
        e.stopPropagation();
        setSettingsChannel(channel);
        setEditName(channel.name);
    };

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        if (settingsChannel && editName.trim()) {
            onUpdateChannel(settingsChannel._id, editName.trim());
            setSettingsChannel(null);
        }
    };

    const handleDeleteChannel = () => {
        if (settingsChannel) {
            onDeleteChannel(settingsChannel._id);
            setSettingsChannel(null);
        }
    };

    const categories = channels
        .filter((c: any) => c.type === "CATEGORY")
        .sort((a: any, b: any) => a.position - b.position);

    const orphans = channels.filter(
        (c: any) => c.type !== "CATEGORY" && !c.parentId
    );

    const ChannelItem = ({ channel, isNested = false }: { channel: any; isNested?: boolean }) => {
        const isSelected = selectedChannelId === channel._id;
        const iconName = channel.type === "VOICE" ? "lucide:volume-2" : "lucide:hash";

        return (
            <div className={cn("group relative flex items-center", isNested ? "ml-2 w-[calc(100%-8px)]" : "w-full")}>
                <button
                    onClick={() => onSelectChannel(channel._id)}
                    className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 text-sm font-medium",
                        isSelected
                            ? "bg-zinc-800 text-zinc-100 shadow-sm"
                            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    )}
                >
                    <Icon
                        icon={iconName}
                        width="18"
                        className={cn(
                            "shrink-0",
                            isSelected ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-400"
                        )}
                    />
                    <span className="truncate flex-1 text-left">{channel.name}</span>
                </button>

                {/* Settings Button (Visible on Hover or Selected) */}
                <button
                    onClick={(e) => handleOpenSettings(e, channel)}
                    className={cn(
                        "absolute right-1 p-1 rounded-sm text-zinc-400 hover:text-zinc-100 opacity-0 transition-opacity",
                        (isSelected || "group-hover:opacity-100") // Show if selected or hovered
                    )}
                    title="Channel Settings"
                >
                    <Icon icon="lucide:settings" width="14" />
                </button>
            </div>
        );
    };

    return (
        <div className="w-64 bg-zinc-900 flex flex-col h-full border-r border-zinc-800">
            {/* Server Header */}
            {!selectedServerId ? (
                <div className="h-12 border-b border-zinc-800 flex items-center justify-center px-4 font-semibold text-zinc-500 shadow-sm bg-zinc-900/50">
                    Select a server
                </div>
            ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 hover:bg-zinc-800/50 transition-colors w-full focus:outline-none">
                            <span className="font-bold text-zinc-100 truncate flex-1 text-left">{selectedServerName}</span>
                            <Icon icon="lucide:chevron-down" className="text-zinc-400 ml-2" width="16" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-zinc-300 font-medium" align="start" sideOffset={5}>
                        <DropdownMenuLabel className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 py-1.5">
                            {selectedServerName}
                        </DropdownMenuLabel>
                        <DropdownMenuItem onClick={onInvite} className="cursor-pointer text-indigo-400 focus:text-indigo-300 focus:bg-indigo-500/10">
                            <Icon icon="lucide:user-plus" className="mr-2" width="16" />
                            Invite People
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem onClick={onUpdateServer} className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-200">
                            <Icon icon="lucide:settings" className="mr-2" width="16" />
                            Server Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCreateChannel()} className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-200">
                            <Icon icon="lucide:plus-circle" className="mr-2" width="16" />
                            Create Channel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onCreateCategory} className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-200">
                            <Icon icon="lucide:folder-plus" className="mr-2" width="16" />
                            Create Category
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem onClick={onDeleteServer} className="cursor-pointer text-yellow-500 focus:text-yellow-400 focus:bg-yellow-500/10">
                            <Icon icon="lucide:trash-2" className="mr-2" width="16" />
                            Delete Server
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Channels List */}
            <ScrollArea className="flex-1 w-full">
                <div className="p-3 space-y-2">
                    {/* Loading State or Empty */}
                    {selectedServerId && loadingChannels && (
                        <div className="flex justify-center p-4">
                            <Icon icon="lucide:loader-2" className="animate-spin text-zinc-500" width="20" />
                        </div>
                    )}

                    {!selectedServerId && (
                        <div className="text-center mt-8 px-4 opacity-50">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
                                <Icon icon="lucide:server" width="32" />
                            </div>
                            <p className="text-sm text-zinc-500">Select a server to view channels</p>
                        </div>
                    )}

                    {/* Orphan Channels */}
                    {orphans.length > 0 && (
                        <div className="space-y-0.5">
                            {orphans.map((c: any) => (
                                <ChannelItem key={c._id} channel={c} />
                            ))}
                        </div>
                    )}

                    {/* Categories */}
                    {categories.map((cat: any) => {
                        const isExpanded = expandedCategories.has(cat._id);
                        const children = channels.filter((c: any) => c.parentId === cat._id);

                        return (
                            <div key={cat._id} className="space-y-0.5 pt-2">
                                {/* Category Header */}
                                <div className="group flex items-center justify-between px-1 mb-1">
                                    <button
                                        onClick={() => onToggleCategory(cat._id)}
                                        className="flex items-center text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors"
                                    >
                                        <Icon
                                            icon={isExpanded ? "lucide:chevron-down" : "lucide:chevron-right"}
                                            width="10"
                                            className="mr-0.5 transition-transform"
                                        />
                                        <span className="truncate">{cat.name}</span>
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCreateChannel(cat._id);
                                        }}
                                        className="text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-all p-0.5"
                                        title="Create Channel"
                                    >
                                        <Icon icon="lucide:plus" width="14" />
                                    </button>
                                </div>

                                {/* Nested Channels */}
                                {isExpanded && (
                                    <div className="space-y-0.5 relative">
                                        {children.map((child: any) => (
                                            <ChannelItem key={child._id} channel={child} isNested />
                                        ))}

                                        {children.length === 0 && (
                                            <div className="ml-4 px-2 py-1 text-xs text-zinc-600 italic">
                                                No channels
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Bottom spacer */}
                    <div className="h-4" />
                </div>
            </ScrollArea>

            {/* Channel Settings Dialog */}
            <Dialog open={!!settingsChannel} onOpenChange={(open) => !open && setSettingsChannel(null)}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Channel Settings</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Make changes to your channel here.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveSettings} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="channelName" className="text-zinc-300">Channel Name</Label>
                            <Input
                                id="channelName"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-zinc-950 border-zinc-800 focus:ring-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                            />
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteChannel}
                                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400"
                            >
                                <Icon icon="lucide:trash-2" className="mr-2" width="16" />
                                Delete Channel
                            </Button>

                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
