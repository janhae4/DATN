import React, { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { CreateCategoryDialog } from "../dialogs/CreateCategoryDialog";
import { CreateChannelDialog } from "../dialogs/CreateChannelDialog";
import { ServerSettingsDialog } from "../dialogs/ServerSettingsDialog";
import { DiscussionDto, ServerMemberDto } from "@/types";
import { VoiceUserItem } from "../chat/voice-channel/VoiceUserItem";
import { ChannelSettingsDialog } from "../dialogs/ChannelSettingsDialog";
import { DirectMessageItem } from "./DirectMessageItem";

interface VoiceParticipant {
    userInfo: {
        id: string;
        name: string;
        avatar?: string;
    };
    isSpeaking?: boolean;
}

interface ChannelListProps {
    selectedServerName: string;
    selectedServerId: string | null;
    channels: DiscussionDto[];
    selectedChannelId: string | null;
    expandedCategories: Set<string>;
    loadingChannels: boolean;
    isCreatingChannel: boolean;
    onUpdateServer: (name?: string) => void;
    onDeleteServer: () => void;
    onPermanentDeleteServer: () => void;
    onInvite: () => void;
    onSelectChannel: (id: string) => void;
    onToggleCategory: (id: string) => void;
    onCreateChannel: (parentId?: string, name?: string, type?: "TEXT" | "VOICE") => void;
    onCreateCategory: (name?: string) => void;
    onUpdateChannel: (id: string, name: string) => void;
    onDeleteChannel: (id: string) => void;
    voiceParticipants?: Record<string, VoiceParticipant[]>;
    speakingUsers?: Set<string>;
    teamMembers?: ServerMemberDto[];
    onSelectDirectMessage?: (userId: string) => void;
    selectedDirectMessageUserId?: string | null;
}

interface ChannelItemProps {
    channel: DiscussionDto;
    isNested?: boolean;
    selectedChannelId: string | null;
    onSelectChannel: (id: string) => void;
    onOpenSettings: (e: React.MouseEvent, channel: DiscussionDto) => void;
    voiceParticipants?: VoiceParticipant[];
    speakingUsers?: Set<string>;
}

const ChannelItem = React.memo(({ channel, isNested = false, selectedChannelId, onSelectChannel, onOpenSettings, voiceParticipants = [], speakingUsers = new Set() }: ChannelItemProps) => {
    const isSelected = selectedChannelId === channel.id;
    const iconName = channel.type === "VOICE" ? "lucide:volume-2" : "lucide:hash";

    return (
        <div className={cn("group relative flex flex-col mb-0.5", isNested ? "ml-4 w-[calc(100%-16px)]" : "w-full")}>
            <div className="flex items-center relative">
                <button
                    onClick={() => onSelectChannel(channel.id)}
                    className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all duration-200 text-sm",
                        isSelected
                            ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                            : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium"
                    )}
                >
                    <Icon
                        icon={iconName}
                        width="16"
                        className={cn(
                            "shrink-0",
                            isSelected
                                ? "text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                        )}
                    />
                    <span className="truncate flex-1 text-left">{channel.name}</span>
                </button>

                {/* Settings Icon */}
                <button
                    onClick={(e) => onOpenSettings(e, channel)}
                    className={cn(
                        "absolute right-1.5 p-1 rounded-sm transition-all",
                        "opacity-0 group-hover:opacity-100",
                        "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                    )}
                    title="Channel Settings"
                >
                    <Icon icon="lucide:settings-2" width="14" />
                </button>
            </div>

            {/* Voice Participants List */}
            {channel.type === "VOICE" && voiceParticipants && voiceParticipants.length > 0 && (
                <div className="pl-8 pr-2 py-1 space-y-1">
                    {voiceParticipants.map((p) => {
                        const isSpeaking = speakingUsers.has(p.userInfo.id);
                        return (
                            <div key={p.userInfo.id} onClick={(e) => e.stopPropagation()}>
                                <VoiceUserItem
                                    userInfo={p.userInfo}
                                    isSpeaking={isSpeaking}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});
ChannelItem.displayName = 'ChannelItem';

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
    onDeleteChannel,
    voiceParticipants = {},
    speakingUsers = new Set(),
    teamMembers = [],
    onSelectDirectMessage,
    selectedDirectMessageUserId
}) => {

    const [settingsChannel, setSettingsChannel] = useState<DiscussionDto | null>(null);
    const [createChannelDialogOpen, setCreateChannelDialogOpen] = useState(false);
    const [createCategoryDialogOpen, setCreateCategoryDialogOpen] = useState(false);
    const [targetParentId, setTargetParentId] = useState<string | null>(null);
    const [serverSettingsOpen, setServerSettingsOpen] = useState(false);
    const [dmCategoryExpanded, setDmCategoryExpanded] = useState(true);

    const handleOpenCreateChannel = (parentId?: string) => {
        setTargetParentId(parentId || null);
        setCreateChannelDialogOpen(true);
    };


    const handleOpenSettings = (e: React.MouseEvent, channel: any) => {
        e.stopPropagation();
        setSettingsChannel(channel);
    };

    const categories = channels
        .filter((c: DiscussionDto) => c.type === "CATEGORY")
        .sort((a: DiscussionDto, b: DiscussionDto) => a.position - b.position);

    const orphans = channels.filter(
        (c: DiscussionDto) => c.type !== "CATEGORY" && !c.parentId
    );

    const [width, setWidth] = useState(260); // Slightly wider default
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = React.useRef<HTMLDivElement>(null);

    const startResizing = React.useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResizing = React.useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = React.useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isResizing && sidebarRef.current) {
                const newWidth = mouseMoveEvent.clientX - sidebarRef.current.getBoundingClientRect().left;
                if (newWidth >= 180 && newWidth <= 420) {
                    setWidth(newWidth);
                }
            }
        },
        [isResizing]
    );

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    return (
        <div
            ref={sidebarRef}
            className="group/sidebar relative flex flex-col h-full shrink-0 bg-zinc-50/50 dark:bg-transparent"
            style={{ width: `${width}px` }}
        >
            {/* Server Header */}
            {!selectedServerId ? (
                <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-center px-4 font-medium text-zinc-500 text-sm">
                    Select a server
                </div>
            ) : (
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
                        <DropdownMenuItem onClick={() => setServerSettingsOpen(true)} className="cursor-pointer text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg py-2">
                            <Icon icon="lucide:settings" className="mr-2 opacity-70" width="16" />
                            <span className="font-medium">Server Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenCreateChannel()} className="cursor-pointer text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg py-2">
                            <Icon icon="lucide:plus-circle" className="mr-2 opacity-70" width="16" />
                            <span className="font-medium">Create Channel</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setCreateCategoryDialogOpen(true)} className="cursor-pointer text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg py-2">
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
            )}

            {/* Channels List */}
            <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
                <div className="px-3 py-4 space-y-4">
                    {/* Direct Messages Category */}
                    {teamMembers && teamMembers.length > 0 && (
                        <div className="space-y-1">
                            <div className="group flex items-center justify-between px-1 mb-1 select-none">
                                <button
                                    onClick={() => setDmCategoryExpanded(!dmCategoryExpanded)}
                                    className="flex items-center text-[10px] font-bold text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors uppercase tracking-widest"
                                >
                                    <Icon
                                        icon={dmCategoryExpanded ? "lucide:chevron-down" : "lucide:chevron-right"}
                                        width="10"
                                        className="mr-1 transition-transform"
                                    />
                                    <span>Direct Messages</span>
                                </button>
                            </div>

                            {dmCategoryExpanded && (
                                <div className="space-y-0.5">
                                    {teamMembers.map((member) => (
                                        <DirectMessageItem
                                            key={member.userId}
                                            userId={member.userId}
                                            name={member.name}
                                            avatar={member.avatar}
                                            isSelected={selectedDirectMessageUserId === member.userId}
                                            onClick={() => onSelectDirectMessage?.(member.userId)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedServerId && loadingChannels && (
                        <div className="flex justify-center p-4">
                            <Icon icon="lucide:loader-2" className="animate-spin text-zinc-400" width="20" />
                        </div>
                    )}

                    {!selectedServerId && (
                        <div className="text-center mt-12 px-4 opacity-40">
                            <div className="w-16 h-16 border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-400">
                                <Icon icon="lucide:server" width="24" />
                            </div>
                        </div>
                    )}

                    {selectedServerId && (
                        <>
                            {orphans.length > 0 && (
                                <div className="space-y-0.5">
                                    {orphans.map((c: DiscussionDto) => (
                                        <ChannelItem
                                            key={c.id}
                                            channel={c}
                                            selectedChannelId={selectedChannelId}
                                            onSelectChannel={onSelectChannel}
                                            onOpenSettings={handleOpenSettings}
                                            voiceParticipants={voiceParticipants ? voiceParticipants[c.id] : []}
                                            speakingUsers={speakingUsers}
                                        />
                                    ))}
                                </div>
                            )}

                            {categories.map((cat: DiscussionDto) => {
                                const isExpanded = expandedCategories.has(cat.id);
                                const children = channels.filter((c: DiscussionDto) => c.parentId === cat.id);

                                return (
                                    <div key={cat.id} className="space-y-1">
                                        <div className="group flex items-center justify-between px-1 mb-1 select-none">
                                            <button
                                                onClick={() => onToggleCategory(cat.id)}
                                                className="flex items-center text-[10px] font-bold text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors uppercase tracking-widest"
                                            >
                                                <Icon
                                                    icon={isExpanded ? "lucide:chevron-down" : "lucide:chevron-right"}
                                                    width="10"
                                                    className="mr-1 transition-transform"
                                                />
                                                <span className="truncate">{cat.name}</span>
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenCreateChannel(cat.id);
                                                }}
                                                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all p-0.5"
                                                title="Create Channel"
                                            >
                                                <Icon icon="lucide:plus" width="12" />
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div className="space-y-0.5 relative">
                                                {/* Guide line for nested items */}
                                                <div className="absolute left-1.5 top-0 bottom-2 w-px bg-zinc-200 dark:bg-zinc-800/50" />

                                                {children.map((child: DiscussionDto) => (
                                                    <ChannelItem
                                                        key={child.id}
                                                        channel={child}
                                                        isNested
                                                        selectedChannelId={selectedChannelId}
                                                        onSelectChannel={onSelectChannel}
                                                        onOpenSettings={handleOpenSettings}
                                                        voiceParticipants={voiceParticipants ? voiceParticipants[child.id] : []}
                                                        speakingUsers={speakingUsers}
                                                    />
                                                ))}

                                                {children.length === 0 && (
                                                    <div className="ml-5 px-2 py-1 text-[11px] text-zinc-400 dark:text-zinc-600 font-mono">
                                                        Empty category
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}

                    <div className="h-8" />
                </div>
            </div>

            {/* Resize Handle */}
            <div
                className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors z-50 opacity-0 group-hover/sidebar:opacity-100"
                onMouseDown={startResizing}
            />

            <ServerSettingsDialog
                open={serverSettingsOpen}
                onOpenChange={setServerSettingsOpen}
                serverName={selectedServerName}
                onUpdate={(name) => onUpdateServer(name)}
                onDelete={onDeleteServer}
            />

            <ChannelSettingsDialog
                open={!!settingsChannel}
                onOpenChange={(open) => !open && setSettingsChannel(null)}
                channel={settingsChannel}
                onUpdate={onUpdateChannel}
                onDelete={onDeleteChannel}
            />

            <CreateChannelDialog
                open={createChannelDialogOpen}
                onOpenChange={setCreateChannelDialogOpen}
                parentId={targetParentId}
                onCreate={(name, type) => onCreateChannel(targetParentId || undefined, name, type)}
            />

            <CreateCategoryDialog
                open={createCategoryDialogOpen}
                onOpenChange={setCreateCategoryDialogOpen}
                onCreate={onCreateCategory}
            />
        </div>
    );
};