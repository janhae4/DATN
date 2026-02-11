"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDiscussionAttachments } from "@/hooks/useDiscussion";
import { cn } from "@/lib/utils";
import { MembersTab } from "./MembersTab";
import { MediaTab } from "./MediaTab";
import { ServerHeader } from "./ServerHeader";
import { ChannelItem } from "./ChannelItem";
import { SearchPalette } from "./SearchPalette";
import { Icon } from "@iconify-icon/react";
import { HOME_SERVER_ID } from "@/constants/chat";
import { ServerMemberDto } from "@/types";

interface ChannelSidebarProps {
    showMembers: boolean;
    selectedServerId: string | null;
    selectedChannelId?: string | null;
    members: ServerMemberDto[];
    loadingMembers: boolean;
    hasNextMembersPage: boolean;
    isFetchingNextMembersPage: boolean;
    onLoadMore: () => void;
    onClose?: () => void;
    teamId?: string;
    currentProjectId?: string;
    currentProjectName?: string;
    projects?: Array<{ id: string; name: string }>;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
    showMembers,
    selectedServerId,
    selectedChannelId,
    members,
    loadingMembers,
    hasNextMembersPage,
    isFetchingNextMembersPage,
    onLoadMore,
    onClose,
    teamId,
    currentProjectId,
    currentProjectName,
    projects
}) => {
    const isDirectChat = selectedServerId === HOME_SERVER_ID;

    const {
        data: attachmentData,
        fetchNextPage: fetchNextAttachments,
        hasNextPage: hasNextAttachmentPage,
        isFetchingNextPage: isFetchingAttachments
    } = useDiscussionAttachments(selectedChannelId || "");

    const attachments = attachmentData?.pages.flatMap((page: any) => page.data) || [];

    if (!showMembers || !selectedServerId) return null;

    return (
        <div className={cn(
            "w-full h-full flex flex-col bg-white dark:bg-black",
            !onClose && "border-l border-zinc-200 dark:border-zinc-800"
        )}>
            <Tabs defaultValue={isDirectChat ? "media" : "members"} className="flex-1 flex flex-col overflow-hidden">

                {/* Header / Tab Switcher Area */}
                {!isDirectChat && (
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-black z-10">
                        <TabsList className="grid w-full grid-cols-2 h-9 p-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg">
                            <TabsTrigger
                                value="members"
                                className="text-xs font-medium rounded-md transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm"
                            >
                                Members
                            </TabsTrigger>
                            <TabsTrigger
                                value="media"
                                className="text-xs font-medium rounded-md transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm"
                            >
                                Media
                            </TabsTrigger>
                        </TabsList>
                    </div>
                )}

                {/* Tab Contents */}
                <div className="flex-1 overflow-hidden relative">
                    {!isDirectChat && (
                        <MembersTab
                            members={members}
                            loadingMembers={loadingMembers}
                            hasNextMembersPage={hasNextMembersPage}
                            isFetchingNextMembersPage={isFetchingNextMembersPage}
                            onLoadMore={onLoadMore}
                        />
                    )}

                    <MediaTab
                        attachments={attachments}
                        selectedServerId={selectedServerId}
                        isFetchingAttachments={isFetchingAttachments}
                        hasNextAttachmentPage={hasNextAttachmentPage}
                        onLoadMore={fetchNextAttachments}
                        teamId={teamId}
                        currentProjectId={currentProjectId}
                        currentProjectName={currentProjectName}
                        projects={projects}
                    />
                </div>
            </Tabs>
        </div>
    );
};
