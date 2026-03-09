import { discussionService } from '@/services/discussionService';
import {
  CreateMessageDto,
  CreateChannelDto,
  CreateCategoryDto,
  ResponseMessageDto,
  AttachmentDto,
  DiscussionDto,
  ServerMemberDto,
  PaginatedResponse,
  ServerDto
} from '@/types';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery, InfiniteData } from '@tanstack/react-query';

export const useServerChannels = (serverId: string) => {
  return useQuery({
    queryKey: ['server-channels', serverId],
    queryFn: () => discussionService.getServerChannelsByServer(serverId),
    enabled: !!serverId,
  });
};

export const useServerMembers = (serverId: string) => {
  return useInfiniteQuery<PaginatedResponse<ServerMemberDto>, Error, InfiniteData<PaginatedResponse<ServerMemberDto>>, string[], number>({
    queryKey: ['server-members', serverId],
    queryFn: ({ pageParam = 1 }) =>
      discussionService.getServerMembers(serverId, pageParam as number, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<ServerMemberDto>) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: !!serverId,
  });
};

export const useTeamMembers = (teamId: string) => {
  return useInfiniteQuery<PaginatedResponse<ServerMemberDto>, Error, InfiniteData<PaginatedResponse<ServerMemberDto>>, string[], number>({
    queryKey: ['team-members', teamId],
    queryFn: ({ pageParam = 1 }) =>
      discussionService.getTeamMembers(teamId, pageParam as number, 50),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<ServerMemberDto>) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: !!teamId,
  });
};

export const useUserServers = (userId: string, teamId?: string) => {
  return useQuery({
    queryKey: ['user-servers', userId, teamId],
    queryFn: () => discussionService.getUserServers(userId, teamId),
    enabled: !!userId,
  });
};

export const useDeletedServers = (userId: string) => {
  return useQuery({
    queryKey: ['deleted-servers', userId],
    queryFn: () => discussionService.getDeletedServers(),
    enabled: !!userId,
  });
};

export const useUserDiscussions = (enabled: boolean = true) => {
  return useInfiniteQuery<PaginatedResponse<DiscussionDto>, Error, InfiniteData<PaginatedResponse<DiscussionDto>>, string[], number>({
    queryKey: ['user-discussions'],
    queryFn: ({ pageParam = 1 }) =>
      discussionService.getDiscussionsForUser(pageParam as number, 50),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<DiscussionDto>) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: enabled,
  });
};

export const useDiscussionMessages = (discussionId: string) => {
  return useInfiniteQuery<ResponseMessageDto, Error, InfiniteData<ResponseMessageDto>, string[], number>({
    queryKey: ['messages', discussionId],
    queryFn: ({ pageParam = 1 }) =>
      discussionService.getMessages(discussionId, { page: pageParam as number, limit: 30 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: ResponseMessageDto) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: !!discussionId,
  });
};

export const useDiscussionAttachments = (discussionId: string) => {
  return useInfiniteQuery<PaginatedResponse<AttachmentDto>, Error, InfiniteData<PaginatedResponse<AttachmentDto>>, string[], number>({
    queryKey: ['attachments', discussionId],
    queryFn: ({ pageParam = 1 }) =>
      discussionService.getDiscussionAttachments(discussionId, { page: pageParam as number, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<AttachmentDto>) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: !!discussionId,
  });
};

export const useDiscussionMutations = () => {
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: ({ discussionId, payload }: { discussionId: string; payload: CreateMessageDto }) =>
      discussionService.sendMessage(discussionId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.discussionId] });
    }
  });

  const toggleReactionMutation = useMutation({
    mutationFn: ({ discussionId, messageId, emoji }: { discussionId: string; messageId: string; emoji: string }) =>
      discussionService.toggleReaction(discussionId, messageId, emoji),
  });

  const updateMessageMutation = useMutation({
    mutationFn: ({ discussionId, messageId, content, attachments }: { discussionId: string; messageId: string; content: string; attachments?: AttachmentDto[] }) =>
      discussionService.updateMessage(discussionId, messageId, content, attachments),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.discussionId] });
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: ({ discussionId, messageId }: { discussionId: string; messageId: string }) =>
      discussionService.deleteMessage(discussionId, messageId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.discussionId] });
    }
  });

  const createDirectMutation = useMutation({
    mutationFn: discussionService.createDirectDiscussion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-discussions'] });
    }
  });

  const createServerMutation = useMutation({
    mutationFn: discussionService.createServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-servers'] });
    }
  });

  const createChannelMutation = useMutation({
    mutationFn: (payload: CreateChannelDto) => discussionService.createChannel(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['server-channels', variables.serverId || variables.teamId] });
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: (payload: CreateCategoryDto) => discussionService.createCategory(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['server-channels', variables.serverId || variables.teamId] });
    }
  });

  const updateChannelMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => discussionService.updateChannel(id, { name }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['server-channels'] });
    }
  });

  const deleteChannelMutation = useMutation({
    mutationFn: discussionService.deleteChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-channels'] });
    }
  });

  const reorderChannelsMutation = useMutation({
    mutationFn: discussionService.reorderChannels,
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey: ['server-channels', newOrder.teamId] });
      const previousData = queryClient.getQueryData(['server-channels', newOrder.teamId]);
      return { previousData };
    },
    onError: (err, newOrder, context) => {
      queryClient.setQueryData(['server-channels', newOrder.teamId], context?.previousData);
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['server-channels', variables.teamId] });
    }
  });

  const joinServerMutation = useMutation({
    mutationFn: discussionService.joinServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-servers'] });
    }
  });

  const generateInviteMutation = useMutation({
    mutationFn: discussionService.generateInvite
  });

  const updateServerMutation = useMutation({
    mutationFn: ({ serverId, payload }: { serverId: string; payload: { name?: string; avatar?: string } }) =>
      discussionService.updateServer(serverId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-servers'] });
      queryClient.invalidateQueries({ queryKey: ['server-channels'] });
    }
  });

  const deleteServerMutation = useMutation({
    mutationFn: (serverId: string) => discussionService.deleteServer(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-servers'] });
    }
  });

  const permanentDeleteServerMutation = useMutation({
    mutationFn: (serverId: string) => discussionService.permanentDeleteServer(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-servers'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-servers'] });
    }
  });

  return {
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    toggleReaction: toggleReactionMutation.mutateAsync,
    updateMessage: updateMessageMutation.mutateAsync,
    deleteMessage: deleteMessageMutation.mutateAsync,
    createDirect: createDirectMutation.mutateAsync,

    createServer: createServerMutation.mutateAsync,
    isCreatingServer: createServerMutation.isPending,
    joinServer: joinServerMutation.mutateAsync,
    generateInvite: generateInviteMutation.mutateAsync,
    updateServer: updateServerMutation.mutateAsync,
    deleteServer: deleteServerMutation.mutateAsync,
    permanentDeleteServer: permanentDeleteServerMutation.mutateAsync,

    restoreServer: useMutation({
      mutationFn: (serverId: string) => discussionService.restoreServer(serverId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-servers'] });
        queryClient.invalidateQueries({ queryKey: ['deleted-servers'] });
      }
    }).mutateAsync,

    createChannel: createChannelMutation.mutateAsync,
    isCreatingChannel: createChannelMutation.isPending,
    createCategory: createCategoryMutation.mutateAsync,
    updateChannel: updateChannelMutation.mutateAsync,
    deleteChannel: deleteChannelMutation.mutateAsync,
    reorderChannels: reorderChannelsMutation.mutateAsync,
  };
};