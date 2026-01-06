import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { aiDiscussionService } from "@/services/aiDiscussionService";
import { streamHelper } from "@/services/apiClient";
import { useState } from "react";
import { AiDiscussion, AiMessage, Pagination } from "@/types";

export function useAiDiscussion(discussionId?: string) {
    const queryClient = useQueryClient();

    const {
        data: discussionsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingList,
    } = useInfiniteQuery({
        queryKey: ["ai-discussions"],
        initialPageParam: 1,
        queryFn: ({ pageParam = 1 }) => aiDiscussionService.getDiscussions(pageParam, 18),
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.page < lastPage.totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
    });

    const discussions = discussionsData?.pages.flatMap((page) => page.data) || [];

    const {
        data: messagesData,
        isLoading: isLoadingMessages,
    } = useQuery<{ data: { messages: AiMessage[]; totalMessage: number }; page: number; totalPages: number }>({
        queryKey: ["ai-messages", discussionId],
        queryFn: () => aiDiscussionService.getMessages(discussionId!, 1, 50),
        enabled: !!discussionId,
    });

    const deleteDiscussionMutation = useMutation({
        mutationFn: (id: string) => aiDiscussionService.deleteDiscussion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai-discussions"] });
        },
    });

    return {
        discussions,
        isLoading: isLoadingList || isLoadingMessages,
        deleteDiscussion: deleteDiscussionMutation.mutateAsync,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    };
}