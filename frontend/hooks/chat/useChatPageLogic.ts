import { useState, useEffect, SetStateAction, Dispatch, useMemo } from "react";
import { useUserProfile } from "@/hooks/useAuth";
import {
    useUserServers,
    useServerChannels,
    useDiscussionMessages,
    useDiscussionMutations,
    useServerMembers,
    useTeamMembers,
    useUserDiscussions,
} from "@/hooks/useDiscussion";
import {
    ServerDto,
    DiscussionDto,
    ServerMemberDto,
    AttachmentDto,
    ResponseMessageDto,
    PaginatedResponse,
    CreateMessageDto
} from "@/types";
import { useProjects } from "@/hooks/useProjects";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useChatSocket } from "@/hooks/chat/useChatSocket";
import { useVoiceSocket } from "@/hooks/chat/useVoiceSocket";
import { useServerVoiceStats } from "@/hooks/chat/useServerVoiceStats";
import { HOME_SERVER_ID } from "@/constants/chat";

export const useChatPageLogic = (teamId: string) => {
    const { data: user } = useUserProfile();
    const userId = user?.id;
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedServerId, setSelectedServerId] = useState<string | null>(searchParams.get('serverId'));
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(searchParams.get('channelId'));
    const [selectedDirectMessageUserId, setSelectedDirectMessageUserId] = useState<string | null>(searchParams.get('dm'));
    const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<string | null>(null);
    const [showMembers, setShowMembers] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
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

        if (selectedDirectMessageUserId) params.set('dm', selectedDirectMessageUserId);
        else params.delete('dm');

        router.replace(`/${teamId}/chat?${params.toString()}`, { scroll: false });
    }, [selectedServerId, selectedChannelId, selectedDirectMessageUserId, router, teamId]);

    const params = useParams();
    const currentProjectId = params?.projectId as string | undefined;

    const { data: rawServers = [] as ServerDto[], isLoading: loadingServers } = useUserServers(userId || "", teamId);
    const servers = useMemo(() => (rawServers as ServerDto[]).map((s: ServerDto) => ({ ...s, id: s.id || s._id || "" })), [rawServers]);

    const { data: rawChannels = [] as DiscussionDto[], isLoading: loadingChannels } = useServerChannels(
        (selectedServerId && selectedServerId !== HOME_SERVER_ID) ? selectedServerId : ""
    );
    const channels = useMemo(() => (rawChannels as DiscussionDto[]).map((c: DiscussionDto) => ({ ...c, id: c.id || c._id || "" })), [rawChannels]);

    // Fetch DMs (Universal)
    const { data: directDiscussionsData } = useUserDiscussions(selectedServerId === HOME_SERVER_ID);
    const directDiscussions = useMemo(() =>
        directDiscussionsData?.pages.flatMap((page: PaginatedResponse<DiscussionDto>) => page.data).map(d => ({ ...d, id: d.id || d._id || "" })) || [],
        [directDiscussionsData]
    );

    const { projects = [], isLoading: loadingProjects } = useProjects(teamId);

    const currentProject = projects.find(p => p.id === currentProjectId);

    // Auto-select first server if none selected (but not in DM mode)
    useEffect(() => {
        if (!selectedServerId && !selectedDirectMessageUserId && servers.length > 0 && !loadingServers) {
            setSelectedServerId(servers[0].id);
        }
    }, [selectedServerId, selectedDirectMessageUserId, servers, loadingServers]);


    useEffect(() => {
        if (selectedDirectMessageUserId) return;

        if (channels.length > 0 && !loadingChannels) {
            const isCurrentChannelValid = channels.some((c: DiscussionDto) => c.id === selectedChannelId);

            if (!selectedChannelId || !isCurrentChannelValid) {
                const playbleChannels = channels.filter((c: DiscussionDto) => c.type !== 'CATEGORY');

                const textChannel = playbleChannels.find((c: DiscussionDto) => c.type === 'TEXT' || (!c.type && c.name));
                const voiceChannel = playbleChannels.find((c: DiscussionDto) => c.type === 'VOICE');

                const targetId = textChannel?.id || voiceChannel?.id;

                if (targetId) {
                    setSelectedChannelId(targetId);
                }
            }
        }
    }, [channels, loadingChannels, selectedChannelId, selectedDirectMessageUserId]);


    // Derived
    const selectedChannel = useMemo(() => {
        if (selectedServerId === HOME_SERVER_ID) {
            return directDiscussions.find(d => d.id === selectedChannelId);
        }
        return channels.find((c: DiscussionDto) => c.id === selectedChannelId);
    }, [channels, directDiscussions, selectedServerId, selectedChannelId]);
    const isVoiceChannel = selectedChannel?.type === 'VOICE';

    // Effect to set active voice channel
    useEffect(() => {
        if (isVoiceChannel && selectedChannelId) {
            setActiveVoiceChannelId(selectedChannelId);
        }
    }, [isVoiceChannel, selectedChannelId]);

    // State Hooks
    const { typingUsers, emitTyping, stopTypingImmediately } = useChatSocket(selectedChannelId);
    const {
        voiceParticipants,
        remoteStreams,
        isMuted,
        toggleMute,
        isVideoOn,
        toggleVideo,
        speakingUsers,
        ccCaptions,
        emitCCTranscript,
    } = useVoiceSocket(
        activeVoiceChannelId,
        selectedServerId,
        userId,
        user,
        !!activeVoiceChannelId
    );

    const { globalVoiceParticipants } = useServerVoiceStats(selectedServerId);

    useEffect(() => {
        if (channels.length > 0) {
            const categoryIds = channels
                .filter((c: DiscussionDto) => c.type === "CATEGORY")
                .map((c: DiscussionDto) => c.id);
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

    // Fetch team members for Direct Messages (independent of server)
    const {
        data: teamMembersData,
        isLoading: loadingTeamMembers
    } = useTeamMembers(teamId);

    const members = useMemo(() => membersData?.pages.flatMap((page: PaginatedResponse<ServerMemberDto>) => page.data) || [], [membersData]);
    const teamMembers = useMemo(() => teamMembersData?.pages.flatMap((page: PaginatedResponse<ServerMemberDto>) => page.data).filter(m => m.userId !== userId) || [], [teamMembersData, userId]);

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
        updateChannel,
        deleteChannel,
        isCreatingServer,
        isCreatingChannel,
        toggleReaction,
        updateMessage,
        deleteMessage,
        createDirect
    } = useDiscussionMutations();

    const handleUpdateMessage = async (messageId: string, content: string, attachments?: AttachmentDto[]) => {
        if (!selectedChannelId) return;
        try {
            await updateMessage({ discussionId: selectedChannelId, messageId, content, attachments });
        } catch (error) { console.error('Failed to update message:', error); }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!selectedChannelId) return;
        if (!confirm("Are you sure you want to delete this message?")) return;
        try {
            await deleteMessage({ discussionId: selectedChannelId, messageId });
        } catch (error) { console.error('Failed to delete message:', error); }
    };

    const handleLeaveVoice = () => {
        setActiveVoiceChannelId(null);
    };

    const handleJoinVoice = (channelId: string) => {
        setActiveVoiceChannelId(channelId);
    };

    const handleSelectDirectMessage = async (partnerId: string) => {
        try {
            // Clear current selections immediately
            setSelectedDirectMessageUserId(partnerId);
            setSelectedServerId(HOME_SERVER_ID);
            setSelectedChannelId(null); // Clear immediately to prevent showing old channel

            // Create or get existing direct discussion
            const discussion = await createDirect({
                partnerId: partnerId
            });

            console.log('📩 Direct discussion response:', discussion);

            // Set the DM discussion as the selected channel
            // Backend returns MongoDB _id, not id
            const discussionId = discussion?.id || discussion?._id;
            if (discussionId) {
                console.log('✅ Setting selected channel to DM:', discussionId);
                setSelectedChannelId(discussionId);
            } else {
                console.error('❌ No discussion ID in response:', discussion);
            }
        } catch (error) {
            console.error('Failed to create/fetch direct discussion:', error);
            // Reset state on error
            setSelectedDirectMessageUserId(null);
        }
    };

    useEffect(() => {
        if (selectedDirectMessageUserId && !selectedChannelId && !loadingTeamMembers) {
            handleSelectDirectMessage(selectedDirectMessageUserId);
        }
    }, [selectedDirectMessageUserId, loadingTeamMembers]);

    // Wrapper to clear DM mode when selecting a server
    const handleSelectServer = (serverId: string | null) => {
        setSelectedServerId(serverId);
        if (serverId && serverId !== HOME_SERVER_ID) {
            // Clear DM mode when selecting a REAL server
            setSelectedDirectMessageUserId(null);
        }
    };

    const handleCreateServer = async (serverName?: string) => {
        const name = serverName || prompt("Nhập tên Server mới:");
        if (name) {
            try {
                const result = await createServer({ name, teamId: teamId, avatar: "" });
                if (result) {
                    const newServerId = result.id || result._id;
                    if (newServerId) setSelectedServerId(newServerId);
                }
            } catch (error) {
                console.error('Failed to create server:', error);
            }
        }
    };

    const handleCreateChannel = async (parentId?: string, nameIn?: string, typeIn?: "TEXT" | "VOICE") => {
        if (!selectedServerId || !nameIn) return;
        let validParentId = typeof parentId === 'string' ? parentId : undefined;

        const name = nameIn;
        const type = typeIn || "TEXT";

        if (!validParentId) {
            const targetCategoryName = type === "VOICE" ? "VOICE CHANNELS" : "TEXT CHANNELS";
            const defaultCategory = channels.find((c: DiscussionDto) => c.type === "CATEGORY" && c.name === targetCategoryName);

            if (defaultCategory) {
                validParentId = defaultCategory.id;
            } else {
                try {
                    const newCat = await createCategory({
                        teamId: teamId,
                        serverId: selectedServerId,
                        name: targetCategoryName,
                        ownerId: userId || ""
                    });
                    if (newCat) {
                        validParentId = newCat.id || newCat._id;
                    }
                } catch (e) {
                    console.error(`Failed to create default ${targetCategoryName} category`, e);
                }
            }
        }

        if (name) {
            await createChannel({
                teamId: teamId,
                serverId: selectedServerId,
                name,
                type: type as any,
                parentId: validParentId,
                ownerId: userId || ""
            });
        }
    };

    const handleCreateCategory = async (nameIn?: string) => {
        if (!selectedServerId) return;
        const name = nameIn || prompt("Nhập tên Category mới:");
        if (!name) return;
        try {
            await createCategory({ teamId: teamId, serverId: selectedServerId, name, ownerId: userId || "" });
        } catch (error) { console.error(error); }
    };

    const handleSendMessage = async (content: string, attachments?: AttachmentDto[], replyToId?: string) => {
        if ((!content.trim() && (!attachments || attachments.length === 0)) || !selectedChannelId) return;

        await sendMessage({
            discussionId: selectedChannelId,
            payload: {
                content,
                teamId: selectedServerId || undefined,
                attachments: (attachments && attachments.length > 0) ? attachments : undefined,
                userId: userId || "",
                discussionId: selectedChannelId,
                replyToId: replyToId || undefined
            }
        });

        stopTypingImmediately();
    };

    const handleUpdateServer = async (nameIn?: string, avatarIn?: string) => {
        if (!selectedServerId) return;
        const currentServer = servers.find((s: ServerDto) => s.id === selectedServerId);
        if (!currentServer) return;

        let newName = nameIn;
        let newAvatar = avatarIn;

        if (nameIn === undefined && avatarIn === undefined) {
            const promptedName = prompt("Nhập tên server mới:", currentServer.name);
            if (promptedName === null) return;
            newName = promptedName;

            const promptedAvatar = prompt("Nhập URL avatar mới:", currentServer.avatar || "");
            newAvatar = promptedAvatar !== null ? promptedAvatar : undefined;
        }

        const finalName = newName !== undefined ? newName : currentServer.name;
        const finalAvatar = newAvatar !== undefined ? newAvatar : currentServer.avatar;

        try {
            await updateServer({
                serverId: selectedServerId,
                payload: {
                    name: finalName,
                    avatar: finalAvatar
                }
            });
        } catch (error) { console.error(error); }
    };

    const handleJoinServer = async (inviteCode?: string) => {
        const code = inviteCode || prompt("Nhập mã mời:");
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
            const generalChannel = channels.find((c: DiscussionDto) => c.name.toLowerCase() === "general");
            targetChannelId = generalChannel ? generalChannel.id : channels[0].id;
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

    const handleUpdateChannel = async (channelId: string, newName: string) => {
        try {
            await updateChannel({ id: channelId, name: newName });
        } catch (error) { console.error('Failed to update channel:', error); }
    };

    const handleDeleteChannel = async (channelId: string) => {
        try {
            await deleteChannel(channelId);
            if (selectedChannelId === channelId) {
                setSelectedChannelId(null);
            }
        } catch (error) { console.error('Failed to delete channel:', error); }
    };

    const messages = useMemo(() => messagesData?.pages.flatMap((page: ResponseMessageDto) => page.data) || [], [messagesData]);

    return {
        state: {
            selectedServerId,
            selectedChannelId,
            selectedDirectMessageUserId,
            showMembers,
            expandedCategories,
            servers,
            channels,
            messages,
            members,
            teamMembers,
            user,
            userId,
            selectedChannel,
            isVoiceChannel,
            activeVoiceChannelId,
            typingUsers,
            voiceParticipants,
            globalVoiceParticipants,
            remoteStreams,
            isMuted,
            isVideoOn,
            speakingUsers,
            ccCaptions,
            emitCCTranscript,

            loadingServers,
            loadingChannels,
            loadingMembers,
            loadingTeamMembers,
            hasNextPage,
            hasNextMembersPage,
            isFetchingNextMembersPage,
            isCreatingServer,
            isCreatingChannel,
            projects,
            loadingProjects,
            currentProject,
            directDiscussions
        },
        actions: {
            setSelectedServerId: handleSelectServer,
            setSelectedChannelId,
            setShowMembers,
            toggleCategory,
            handleCreateServer,
            handleCreateChannel,
            handleCreateCategory,
            handleSendMessage,
            handleUpdateServer,
            handleJoinServer,
            handleDeleteServer,
            handlePermanentDeleteServer,
            generateServerInvitationLink,
            fetchNextPage,
            fetchNextMembersPage,
            toggleReaction,
            emitTyping,
            stopTypingImmediately,
            handleUpdateChannel,
            handleDeleteChannel,
            handleUpdateMessage,
            handleDeleteMessage,
            handleLeaveVoice,
            handleJoinVoice,
            handleSelectDirectMessage,
            toggleMute,
            toggleVideo
        }
    };
};
