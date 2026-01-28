import { discussionService } from '@/services/discussionService';
import { CreateMessageDto, CreateChannelDto, CreateCategoryDto } from '@/types';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

export const useServerChannels = (teamId: string) => {
  return useQuery({
    queryKey: ['server-channels', teamId],
    queryFn: () => discussionService.getServerChannels(teamId),
    enabled: !!teamId,
  });
};

export const useServerMembers = (teamId: string) => {
  return useInfiniteQuery({
    queryKey: ['server-members', teamId],
    queryFn: ({ pageParam = 1 }) =>
      discussionService.getServerMembers(teamId, pageParam as number, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: !!teamId,
  });
};

export const useUserServers = (userId: string) => {
  return useQuery({
    queryKey: ['user-servers', userId],
    queryFn: () => discussionService.getUserServers(userId),
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

export const useDiscussionMessages = (discussionId: string) => {
  return useInfiniteQuery({
    queryKey: ['messages', discussionId],
    queryFn: ({ pageParam = 1 }) =>
      discussionService.getMessages(discussionId, { page: pageParam as number, limit: 30 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
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

  const createDirectMutation = useMutation({
    mutationFn: discussionService.createDirectDiscussion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-discussions'] });
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
      queryClient.invalidateQueries({ queryKey: ['server-channels', variables.teamId] });
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: (payload: CreateCategoryDto) => discussionService.createCategory(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['server-channels', variables.teamId] });
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
    mutationFn: ({ teamId, payload }: { teamId: string; payload: { name?: string; avatar?: string } }) =>
      discussionService.updateServer(teamId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-servers'] });
      queryClient.invalidateQueries({ queryKey: ['server-channels'] });
    }
  });

  const deleteServerMutation = useMutation({
    mutationFn: (teamId: string) => discussionService.deleteServer(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-servers'] });
    }
  });

  const permanentDeleteServerMutation = useMutation({
    mutationFn: (teamId: string) => discussionService.permanentDeleteServer(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-servers'] });
    }
  });

  return {
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    toggleReaction: toggleReactionMutation.mutateAsync,
    createDirect: createDirectMutation.mutateAsync,

    createServer: createServerMutation.mutateAsync,
    isCreatingServer: createServerMutation.isPending,
    joinServer: joinServerMutation.mutateAsync,
    generateInvite: generateInviteMutation.mutateAsync,
    updateServer: updateServerMutation.mutateAsync,
    deleteServer: deleteServerMutation.mutateAsync,
    permanentDeleteServer: permanentDeleteServerMutation.mutateAsync,

    restoreServer: useMutation({
      mutationFn: (teamId: string) => discussionService.restoreServer(teamId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['user-servers'] });
        queryClient.invalidateQueries({ queryKey: ['deleted-servers'] });
      }
    }).mutateAsync,

    createChannel: createChannelMutation.mutateAsync,
    isCreatingChannel: createChannelMutation.isPending,
    createCategory: createCategoryMutation.mutateAsync,
    deleteChannel: deleteChannelMutation.mutateAsync,
    reorderChannels: reorderChannelsMutation.mutateAsync,
  };
};