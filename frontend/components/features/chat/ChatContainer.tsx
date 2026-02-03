"use client";

import React from "react";
import { ServerList } from "@/components/chatting/ServerList";
import { ChannelList } from "@/components/chatting/ChannelList";
import { MemberList } from "@/components/chatting/MemberList";
import { ChatArea } from "@/components/chatting/ChatArea";
import { useChatPageLogic } from "@/hooks/chat/useChatPageLogic";

interface ChatContainerProps {
    teamId: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ teamId }) => {
    const { state, actions } = useChatPageLogic(teamId);

    if (!state.userId) return <div className="p-10">Đang tải thông tin user...</div>;

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
            <ServerList
                servers={state.servers}
                selectedServerId={state.selectedServerId}
                loadingServers={state.loadingServers}
                isCreatingServer={state.isCreatingServer}
                onSelectServer={(id) => { actions.setSelectedServerId(id); actions.setSelectedChannelId(null); }}
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
                onSelectChannel={actions.setSelectedChannelId}
                onToggleCategory={actions.toggleCategory}
                onCreateChannel={actions.handleCreateChannel}
                onCreateCategory={actions.handleCreateCategory}
                onUpdateChannel={actions.handleUpdateChannel}
                onDeleteChannel={actions.handleDeleteChannel}
            />

            <ChatArea
                selectedChannelId={state.selectedChannelId}
                selectedChannelName={state.selectedChannel?.name}
                showMembers={state.showMembers}
                onToggleMembers={() => actions.setShowMembers(!state.showMembers)}
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
            />

            <MemberList
                showMembers={state.showMembers}
                selectedServerId={state.selectedServerId}
                members={state.members}
                loadingMembers={state.loadingMembers}
                hasNextMembersPage={state.hasNextMembersPage}
                isFetchingNextMembersPage={state.isFetchingNextMembersPage}
                onLoadMore={actions.fetchNextMembersPage}
            />
        </div>
    );
}
