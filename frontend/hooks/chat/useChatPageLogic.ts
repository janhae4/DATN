import { useState, useEffect, SetStateAction, Dispatch } from "react";
import { useUserProfile } from "@/hooks/useAuth";
import {
    useUserServers,
    useServerChannels,
    useDiscussionMessages,
    useDiscussionMutations,
    useServerMembers,
} from "@/hooks/useDiscussion";
import { useProjects } from "@/hooks/useProjects";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useChatSocket } from "@/hooks/chat/useChatSocket";
import { useVoiceSocket } from "@/hooks/chat/useVoiceSocket";

export const useChatPageLogic = (teamId: string) => {
    const { data: user } = useUserProfile();
    const userId = user?.id;
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedServerId, setSelectedServerId] = useState<string | null>(searchParams.get('serverId'));
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(searchParams.get('channelId'));
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

        router.replace(`/${teamId}/chat?${params.toString()}`, { scroll: false });
    }, [selectedServerId, selectedChannelId, router, teamId]);

    const params = useParams();
    const currentProjectId = params?.projectId as string | undefined;

    const { data: servers = [], isLoading: loadingServers } = useUserServers(userId || "");
    const { data: channels = [], isLoading: loadingChannels } = useServerChannels(selectedServerId || "");
    const { projects = [], isLoading: loadingProjects } = useProjects(teamId);

    const currentProject = projects.find(p => p.id === currentProjectId);

    // Auto-select first server if none selected
    useEffect(() => {
        if (!selectedServerId && servers.length > 0 && !loadingServers) {
            setSelectedServerId(servers[0].id);
        }
    }, [selectedServerId, servers, loadingServers]);

    // Auto-select first channel when server changes or channels load
    useEffect(() => {
        if (channels.length > 0 && !loadingChannels) {
            const isCurrentChannelValid = channels.some((c: any) => c._id === selectedChannelId);

            if (!selectedChannelId || !isCurrentChannelValid) {
                const playbleChannels = channels.filter((c: any) => c.type !== 'CATEGORY');

                const textChannel = playbleChannels.find((c: any) => c.type === 'TEXT' || (!c.type && c.name));
                const voiceChannel = playbleChannels.find((c: any) => c.type === 'VOICE');

                const targetId = textChannel?._id || voiceChannel?._id;

                if (targetId) {
                    setSelectedChannelId(targetId);
                }
            }
        }
    }, [channels, loadingChannels, selectedChannelId]);

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

    const members = membersData?.pages.flatMap((page: any) => page.data) || [];

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
        deleteMessage
    } = useDiscussionMutations();

    const handleUpdateMessage = async (messageId: string, content: string, attachments?: any[]) => {
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

    const handleCreateServer = async (serverName?: string) => {
        const name = serverName || prompt("Nhập tên Server mới:");
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

    const handleCreateChannel = async (parentId?: string, nameIn?: string, typeIn?: "TEXT" | "VOICE") => {
        if (!selectedServerId || !nameIn) return;
        let validParentId = typeof parentId === 'string' ? parentId : undefined;

        const name = nameIn;
        const type = typeIn || "TEXT";

        if (!validParentId) {
            const targetCategoryName = type === "VOICE" ? "VOICE CHANNELS" : "TEXT CHANNELS";
            const defaultCategory = channels.find((c: any) => c.type === "CATEGORY" && c.name === targetCategoryName);

            if (defaultCategory) {
                validParentId = defaultCategory._id;
            } else {
                try {
                    const newCat = await createCategory({
                        teamId: selectedServerId,
                        name: targetCategoryName,
                        ownerId: userId || ""
                    });
                    if (newCat && newCat._id) {
                        validParentId = newCat._id;
                    }
                } catch (e) {
                    console.error(`Failed to create default ${targetCategoryName} category`, e);
                }
            }
        }

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

    const handleCreateCategory = async (nameIn?: string) => {
        if (!selectedServerId) return;
        const name = nameIn || prompt("Nhập tên Category mới:");
        if (!name) return;
        try {
            await createCategory({ teamId: selectedServerId, name, ownerId: userId || "" });
        } catch (error) { console.error(error); }
    };

    const handleSendMessage = async (content: string, attachments?: any[], replyToId?: string) => {
        if ((!content.trim() && (!attachments || attachments.length === 0)) || !selectedChannelId || !selectedServerId) return;

        await sendMessage({
            discussionId: selectedChannelId,
            payload: {
                content,
                teamId: selectedServerId,
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
        const currentServer = servers.find((s: any) => s.id === selectedServerId);
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
                teamId: selectedServerId,
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

    const messages = messagesData?.pages.flatMap((page: any) => page.data) || [];

    return {
        state: {
            selectedServerId,
            selectedChannelId,
            showMembers,
            expandedCategories,
            servers,
            channels,
            messages,
            members,
            user,
            userId,
            selectedChannel,
            isVoiceChannel,
            typingUsers,
            voiceParticipants,
            remoteStreams,
            loadingServers,
            loadingChannels,
            loadingMembers,
            hasNextPage,
            hasNextMembersPage,
            isFetchingNextMembersPage,
            isCreatingServer,
            isCreatingChannel,
            projects,
            loadingProjects,
            currentProject
        },
        actions: {
            setSelectedServerId,
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
            handleDeleteMessage
        }
    };
};
