"use client";

import React, { useState, useEffect } from "react";
import { useUserProfile } from "@/hooks/useAuth";
import {
  useUserServers,
  useServerChannels,
  useDiscussionMessages,
  useDiscussionMutations,
  useServerMembers,
} from "@/hooks/useDiscussion";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "@/contexts/SocketContext";
import { ServerList } from "@/components/chatting/ServerList";
import { ChannelList } from "@/components/chatting/ChannelList";
import { MemberList } from "@/components/chatting/MemberList";
import { ChatArea } from "@/components/chatting/ChatArea";
import { useChatSocket } from "@/hooks/chat/useChatSocket";
import { useVoiceSocket } from "@/hooks/chat/useVoiceSocket";

export default function ChatPage() {
  const { data: user } = useUserProfile();
  const userId = user?.id;
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const teamId = params.teamId as string;

  // Initialize state from URL params
  const [selectedServerId, setSelectedServerId] = useState<string | null>(searchParams.get('serverId'));
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(searchParams.get('channelId'));
  // UI State
  const [showMembers, setShowMembers] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Socket Context for sending actions (not state) - state moved to hooks
  const { chatSocket } = useSocket();

  // Helper: Toggle Category Expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedServerId) params.set('serverId', selectedServerId);
    else params.delete('serverId');

    if (selectedChannelId) params.set('channelId', selectedChannelId);
    else params.delete('channelId');

    router.replace(`/${teamId}/chat?${params.toString()}`, { scroll: false });
  }, [selectedServerId, selectedChannelId, router, teamId]);

  // Data Fetching
  const { data: servers = [], isLoading: loadingServers } = useUserServers(userId || "");
  const { data: channels = [], isLoading: loadingChannels } = useServerChannels(selectedServerId || "");

  // Derived
  const selectedChannel = channels.find((c: any) => c._id === selectedChannelId);
  const isVoiceChannel = selectedChannel?.type === 'VOICE';

  // State Hooks
  const { typingUsers, emitTyping, stopTypingImmediately } = useChatSocket(selectedChannelId);
  const { voiceParticipants, remoteStreams } = useVoiceSocket(
    selectedChannelId,
    selectedServerId,
    userId,
    user,
    isVoiceChannel
  );

  useEffect(() => {
    if (channels.length > 0) {
      const categoryIds = channels
        .filter((c: any) => c.type === "CATEGORY")
        .map((c: any) => c._id);
      setExpandedCategories(new Set(categoryIds));
    }
  }, [selectedServerId, !!channels.length]);

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage
  } = useDiscussionMessages(selectedChannelId || "");

  const {
    data: membersData,
    fetchNextPage: fetchNextMembersPage,
    hasNextPage: hasNextMembersPage,
    isFetchingNextPage: isFetchingNextMembersPage,
    isLoading: loadingMembers
  } = useServerMembers(selectedServerId || "");

  const members = membersData?.pages.flatMap(page => page.data) || [];

  const {
    createServer,
    createChannel,
    createCategory,
    sendMessage,
    generateInvite,
    joinServer,
    updateServer,
    deleteServer,
    permanentDeleteServer,
    isCreatingServer,
    isCreatingChannel
  } = useDiscussionMutations();

  // --- Handlers ---
  const handleCreateServer = async () => {
    const name = prompt("Nhập tên Server mới:");
    if (name) {
      const newTeamId = crypto.randomUUID();
      try {
        const result = await createServer({ name, teamId: newTeamId, avatar: "" });
        if (result && result.teamId) {
          setSelectedServerId(result.teamId);
          if (result._id) setSelectedChannelId(result._id);
        }
      } catch (error) {
        console.error('Failed to create server:', error);
      }
    }
  };

  const handleCreateChannel = async (parentId?: string) => {
    if (!selectedServerId) return;
    const validParentId = typeof parentId === 'string' ? parentId : undefined;
    const name = prompt(validParentId ? "Nhập tên Channel trong Category:" : "Nhập tên Channel:");
    if (!name) return;
    const type = confirm("Là kênh Voice? (OK=Voice, Cancel=Text)") ? "VOICE" : "TEXT";

    if (name) {
      await createChannel({
        teamId: selectedServerId,
        name,
        type: type as any,
        parentId: validParentId,
        ownerId: userId || ""
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!selectedServerId) return;
    const name = prompt("Nhập tên Category mới:");
    if (!name) return;
    try {
      await createCategory({ teamId: selectedServerId, name, ownerId: userId || "" });
    } catch (error) { console.error(error); }
  };

  const [inputMsg, setInputMsg] = useState("");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !selectedChannelId || !selectedServerId) return;

    await sendMessage({
      discussionId: selectedChannelId,
      payload: {
        content: inputMsg,
        teamId: selectedServerId,
        attachments: [],
        userId: userId || "",
        discussionId: selectedChannelId
      }
    });

    stopTypingImmediately();
    setInputMsg("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMsg(e.target.value);
    emitTyping();
  };

  const handleUpdateServer = async () => {
    if (!selectedServerId) return;
    const currentServer = servers.find((s: any) => s.id === selectedServerId);
    if (!currentServer) return;

    const newName = prompt("Nhập tên server mới:", currentServer.name);
    const newAvatar = prompt("Nhập URL avatar mới:", currentServer.avatar || "");

    if (newName !== null) {
      try {
        await updateServer({
          teamId: selectedServerId,
          payload: {
            name: newName || currentServer.name,
            avatar: newAvatar !== null ? newAvatar : currentServer.avatar
          }
        });
        alert("Cập nhật server thành công!");
      } catch (error) { console.error(error); }
    }
  };

  const handleJoinServer = async () => {
    const code = prompt("Nhập mã mời:");
    if (!code) return;
    try {
      await joinServer(code);
      alert("Đã tham gia server thành công!");
    } catch (error) { console.error(error); alert("Mã mời không hợp lệ."); }
  };

  const handleDeleteServer = async () => {
    if (!selectedServerId) return;
    if (!confirm("Bạn có chắc chắn muốn xóa server này? (Soft delete)")) return;
    try {
      await deleteServer(selectedServerId);
      setSelectedServerId(null);
      setSelectedChannelId(null);
      alert("Đã xóa server thành công!");
    } catch (error) { console.error(error); }
  };

  const handlePermanentDeleteServer = async () => {
    if (!selectedServerId) return;
    if (!confirm("CẢNH BÁO: Xóa VĨNH VIỄN server? Không thể hoàn tác!")) return;
    try {
      await permanentDeleteServer(selectedServerId);
      setSelectedServerId(null);
      setSelectedChannelId(null);
      alert("Đã xóa vĩnh viễn server!");
    } catch (error) { console.error(error); }
  };

  const generateServerInvitationLink = async () => {
    if (!selectedServerId) { alert("Vui lòng chọn server."); return; }
    let targetChannelId = selectedChannelId;
    if (!targetChannelId && channels.length > 0) {
      const generalChannel = channels.find((c: any) => c.name.toLowerCase() === "general");
      targetChannelId = generalChannel ? generalChannel._id : channels[0]._id;
    }
    if (!targetChannelId) { alert("Server không có channel."); return; }

    try {
      const result = await generateInvite({
        teamId: selectedServerId,
        discussionId: targetChannelId,
        maxUses: 0
      });
      if (result?.code) {
        const inviteLink = `${window.location.origin}/invite/${result.code}`;
        navigator.clipboard.writeText(inviteLink);
        alert(`Link mời: \n${inviteLink}`);
      }
    } catch (error) { console.error(error); }
  };

  const messages = messagesData?.pages.flatMap((page: any) => page.data) || [];

  if (!userId) return <div className="p-10">Đang tải thông tin user...</div>;

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
      <ServerList
        servers={servers}
        selectedServerId={selectedServerId}
        loadingServers={loadingServers}
        isCreatingServer={isCreatingServer}
        onSelectServer={(id) => { setSelectedServerId(id); setSelectedChannelId(null); }}
        onJoinServer={handleJoinServer}
        onCreateServer={handleCreateServer}
        teamId={teamId}
      />

      <ChannelList
        selectedServerName={servers.find((s: any) => s.id === selectedServerId)?.name || "Select a Server"}
        selectedServerId={selectedServerId}
        channels={channels}
        selectedChannelId={selectedChannelId}
        expandedCategories={expandedCategories}
        loadingChannels={loadingChannels}
        isCreatingChannel={isCreatingChannel}
        onUpdateServer={handleUpdateServer}
        onDeleteServer={handleDeleteServer}
        onPermanentDeleteServer={handlePermanentDeleteServer}
        onInvite={generateServerInvitationLink}
        onSelectChannel={setSelectedChannelId}
        onToggleCategory={toggleCategory}
        onCreateChannel={handleCreateChannel}
        onCreateCategory={handleCreateCategory}
      />

      <ChatArea
        selectedChannelId={selectedChannelId}
        selectedChannelName={selectedChannel?.name}
        showMembers={showMembers}
        onToggleMembers={() => setShowMembers(!showMembers)}
        messages={messages}
        typingUsers={typingUsers}
        inputMsg={inputMsg}
        hasNextPage={hasNextPage}
        onFetchNextPage={fetchNextPage}
        onSendMessage={handleSendMessage}
        onInputChange={handleInputChange}
        isVoice={isVoiceChannel}
        user={user}
        userId={userId}
        voiceParticipants={voiceParticipants}
        remoteStreams={remoteStreams}
        onLeaveVoice={() => setSelectedChannelId(null)}
      />

      <MemberList
        showMembers={showMembers}
        selectedServerId={selectedServerId}
        members={members}
        loadingMembers={loadingMembers}
        hasNextMembersPage={hasNextMembersPage}
        isFetchingNextMembersPage={isFetchingNextMembersPage}
        onLoadMore={fetchNextMembersPage}
      />
    </div>
  );
}
