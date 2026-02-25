import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

import { CreateCategoryDialog } from "../dialogs/CreateCategoryDialog";
import { CreateChannelDialog } from "../dialogs/CreateChannelDialog";
import { ServerSettingsDialog } from "../dialogs/ServerSettingsDialog";
import { DiscussionDto, ServerMemberDto, VoiceParticipant } from "@/types";
import { ChannelSettingsDialog } from "../dialogs/ChannelSettingsDialog";
import { DirectMessageItem } from "./DirectMessageItem";
import { HOME_SERVER_ID } from "@/constants/chat";

import { ServerHeader } from "./ServerHeader";
import { ChannelItem } from "./ChannelItem";
import { SearchPalette } from "./SearchPalette";
import { Icon } from "@iconify-icon/react";

import { useOnlineStatus } from "@/hooks/chat/useOnlineStatus";

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
    directDiscussions?: DiscussionDto[];
    currentUserId?: string;
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
    onDeleteChannel,
    voiceParticipants = {},
    speakingUsers = new Set(),
    teamMembers = [],
    onSelectDirectMessage,
    selectedDirectMessageUserId,
    directDiscussions = [],
    currentUserId,
}) => {
    const isHome = selectedServerId === HOME_SERVER_ID;

    const [settingsChannel, setSettingsChannel] = useState<DiscussionDto | null>(null);
    const [createChannelDialogOpen, setCreateChannelDialogOpen] = useState(false);
    const [createCategoryDialogOpen, setCreateCategoryDialogOpen] = useState(false);
    const [targetParentId, setTargetParentId] = useState<string | null>(null);
    const [serverSettingsOpen, setServerSettingsOpen] = useState(false);
    const [dmCategoryExpanded, setDmCategoryExpanded] = useState(true);
    const [searchOpen, setSearchOpen] = useState(false);

    const onlineCheckList = React.useMemo(() => {
        const set = new Set<string>();
        if (isHome) {
            directDiscussions.forEach(dm => {
                const id = dm.partnerId || dm.name.split('_').find(s => s !== currentUserId);
                if (id) set.add(id);
            });
        }
        if (teamMembers) {
            teamMembers.forEach(m => set.add(m.userId));
        }
        return Array.from(set);
    }, [isHome, directDiscussions, currentUserId, teamMembers]);

    const onlineStatusMap = useOnlineStatus(onlineCheckList);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setSearchOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const handleOpenCreateChannel = (parentId?: string) => {
        setTargetParentId(parentId || null);
        setCreateChannelDialogOpen(true);
    };

    const handleOpenSettings = (e: React.MouseEvent, channel: DiscussionDto) => {
        e.stopPropagation();
        setSettingsChannel(channel);
    };

    const categories = channels
        .filter((c: DiscussionDto) => c.type === "CATEGORY")
        .sort((a: DiscussionDto, b: DiscussionDto) => a.position - b.position);

    const orphans = channels.filter(
        (c: DiscussionDto) => c.type !== "CATEGORY" && !c.parentId
    );

    const [width, setWidth] = useState(260);
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
            <ServerHeader
                isHome={isHome}
                selectedServerId={selectedServerId}
                selectedServerName={selectedServerName}
                onSearchOpen={() => setSearchOpen(true)}
                onInvite={onInvite}
                onServerSettingsOpen={() => setServerSettingsOpen(true)}
                onCreateChannel={() => handleOpenCreateChannel()}
                onCreateCategory={() => setCreateCategoryDialogOpen(true)}
                onDeleteServer={onDeleteServer}
            />

            <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
                <div className="px-3 py-4 space-y-4">
                    {isHome ? (
                        <div className="space-y-1">
                            <div className="px-2 pb-2 text-xs font-semibold text-zinc-500 uppercase flex items-center justify-between group">
                                Direct Messages
                            </div>

                            {directDiscussions.length === 0 && (
                                <div className="text-center py-8 text-zinc-400 text-sm italic">
                                    No conversations yet.
                                    <br />
                                    Start a chat from a server!
                                </div>
                            )}

                            {directDiscussions.map((dm: DiscussionDto) => {
                                const partnerId = dm.partnerId || "";
                                const partnerInTeam = teamMembers?.find(m => m.userId === partnerId);
                                let avatar = partnerInTeam?.avatar;
                                let name = partnerInTeam?.name;

                                if (!name && dm.otherUser) {
                                    name = dm.otherUser.name;
                                    avatar = dm.otherUser.avatar;
                                }

                                if (!name) {
                                    const otherId = dm.name.split('_').find((id: string) => id !== currentUserId);
                                    name = otherId ? "User " + otherId.substring(otherId.length - 4) : "Unknown User";
                                }

                                return (
                                    <DirectMessageItem
                                        key={dm.id}
                                        userId={partnerId}
                                        name={name}
                                        avatar={avatar}
                                        isSelected={selectedChannelId === dm.id}
                                        onClick={() => onSelectChannel(dm.id)}
                                        isOnline={onlineStatusMap.has(partnerId)}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <>
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
                                            <span>Members</span>
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
                                                    isOnline={onlineStatusMap.has(member.userId)}
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
                        </>
                    )}
                    <div className="h-8" />
                </div>
            </div>

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

            <SearchPalette
                open={searchOpen}
                onOpenChange={setSearchOpen}
                directDiscussions={directDiscussions}
                teamMembers={teamMembers}
                currentUserId={currentUserId}
                onSelectDirectMessage={onSelectDirectMessage}
            />
        </div>
    );
};