"use client";

import React from "react";
import {
    ServerList,
    ChannelList,
    ChannelSidebar,
    ChatArea
} from "@/components/chatting";
import { useChatPageLogic } from "@/hooks/chat/useChatPageLogic";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface ChatContainerProps {
    teamId: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ teamId }) => {
    const { state, actions } = useChatPageLogic(teamId);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

    if (!state.userId) return <div className="p-10">Đang tải thông tin user...</div>;

    const renderSidebar = () => (
        <>
            <ServerList
                servers={state.servers}
                selectedServerId={state.selectedServerId}
                loadingServers={state.loadingServers}
                isCreatingServer={state.isCreatingServer}
                onSelectServer={(id) => {
                    actions.setSelectedServerId(id);
                    actions.setSelectedChannelId(null);
                }}
                onJoinServer={actions.handleJoinServer}
                onCreateServer={actions.handleCreateServer}
                teamId={teamId}
            />

            <ChannelList
                selectedServerName={state.servers.find((s: any) => s.id === state.selectedServerId)?.name || "Select a Server"}
                selectedServerId={state.selectedServerId}
                channels={state.channels}
                selectedChannelId={state.selectedChannelId}
                expandedCategories={state.expandedCategories}
                loadingChannels={state.loadingChannels}
                isCreatingChannel={state.isCreatingChannel}
                onUpdateServer={actions.handleUpdateServer}
                onDeleteServer={actions.handleDeleteServer}
                onPermanentDeleteServer={actions.handlePermanentDeleteServer}
                onInvite={actions.generateServerInvitationLink}
                onSelectChannel={(id) => {
                    actions.setSelectedChannelId(id);
                    setMobileMenuOpen(false);
                }}
                onToggleCategory={actions.toggleCategory}
                onCreateChannel={actions.handleCreateChannel}
                onCreateCategory={actions.handleCreateCategory}
                onUpdateChannel={actions.handleUpdateChannel}
                onDeleteChannel={actions.handleDeleteChannel}
            />
        </>
    );

    return (
        <div className="flex h-screen bg-zinc-50/50 dark:bg-black rounded-xl text-zinc-900 dark:text-zinc-200 overflow-hidden p-0 sm:p-2 gap-0 sm:gap-2">
            {/* Desktop Sidebar - Hidden on mobile/tablet */}
            <aside className="hidden lg:flex shrink-0 rounded-none sm:rounded-lg bg-white dark:bg-zinc-900 border-0 sm:border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                {renderSidebar()}
            </aside>

            {/* Mobile/Tablet Left Sidebar (Sheet) */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="left" className="p-0 flex flex-row w-[85vw] sm:w-[340px] gap-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    {renderSidebar()}
                </SheetContent>
            </Sheet>

            <main className="flex-1 flex rounded-none sm:rounded-lg bg-white dark:bg-zinc-900 border-0 sm:border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm relative">
                <ChatArea
                    selectedServerId={state.selectedServerId}
                    selectedChannelId={state.selectedChannelId}
                    selectedChannelName={state.selectedChannel?.name}
                    showMembers={state.showMembers}
                    onToggleMembers={() => {
                        if (window.innerWidth < 1280) { // lg breakpoint
                            setMobileSidebarOpen(!mobileSidebarOpen);
                        } else {
                            actions.setShowMembers(!state.showMembers);
                        }
                    }}
                    messages={state.messages}
                    typingUsers={state.typingUsers}
                    hasNextPage={state.hasNextPage}
                    onFetchNextPage={actions.fetchNextPage}
                    onSendMessage={actions.handleSendMessage}
                    onTyping={actions.emitTyping}
                    isVoice={state.isVoiceChannel}
                    user={state.user}
                    userId={state.userId}
                    voiceParticipants={state.voiceParticipants}
                    remoteStreams={state.remoteStreams}
                    onLeaveVoice={() => actions.setSelectedChannelId(null)}
                    onReact={actions.toggleReaction as any}
                    members={state.members}
                    onUpdateMessage={actions.handleUpdateMessage}
                    onDeleteMessage={actions.handleDeleteMessage}
                    onOpenMobileMenu={() => setMobileMenuOpen(true)}
                />


                {/* Desktop ChannelSidebar - Inline, only on large screens */}
                {state.showMembers && (
                    <div className="hidden lg:block w-80 shrink-0">
                        <ChannelSidebar
                            showMembers={state.showMembers}
                            selectedServerId={state.selectedServerId}
                            selectedChannelId={state.selectedChannelId}
                            members={state.members}
                            loadingMembers={state.loadingMembers}
                            hasNextMembersPage={state.hasNextMembersPage}
                            isFetchingNextMembersPage={state.isFetchingNextMembersPage}
                            onLoadMore={actions.fetchNextMembersPage}
                            teamId={teamId}
                            currentProjectId={state.currentProject?.id}
                            currentProjectName={state.currentProject?.name}
                            projects={state.projects}
                        />
                    </div>
                )}
            </main>

            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                <SheetContent
                    side="right"
                    className="p-0 gap-0 w-[85vw] sm:w-[380px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                >
                    <SheetTitle className="sr-only">Channel Members and Media</SheetTitle>
                    <ChannelSidebar
                        showMembers={true}
                        selectedServerId={state.selectedServerId}
                        selectedChannelId={state.selectedChannelId}
                        members={state.members}
                        loadingMembers={state.loadingMembers}
                        hasNextMembersPage={state.hasNextMembersPage}
                        isFetchingNextMembersPage={state.isFetchingNextMembersPage}
                        onLoadMore={actions.fetchNextMembersPage}
                        onClose={() => setMobileSidebarOpen(false)}
                        teamId={teamId}
                        currentProjectId={state.currentProject?.id}
                        currentProjectName={state.currentProject?.name}
                        projects={state.projects}
                    />
                </SheetContent>
            </Sheet>
        </div>
    );
}
