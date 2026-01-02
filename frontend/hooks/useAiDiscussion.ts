import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiDiscussionService } from "@/services/aiDiscussionService";
import { streamHelper } from "@/services/apiClient";
import { useState } from "react";
import { AiDiscussion, AiMessage, Pagination } from "@/types";

export function useAiDiscussion(discussionId?: string) {
    const queryClient = useQueryClient();
    const [streamingContent, setStreamingContent] = useState("");

    const {
        data: discussionsData,
        isLoading: isLoadingList,
    } = useQuery<Pagination<AiDiscussion>>({
        queryKey: ["ai-discussions"],
        queryFn: () => aiDiscussionService.getDiscussions(1, 50),
    });

    const {
        data: messagesData,
        isLoading: isLoadingMessages,
    } = useQuery<{ data: { messages: AiMessage[]; totalMessage: number }; page: number; totalPages: number }>({
        queryKey: ["ai-messages", discussionId],
        queryFn: () => aiDiscussionService.getMessages(discussionId!, 1, 50),
        enabled: !!discussionId,
    });

    const chatWithAiMutation = useMutation({
        mutationFn: async ({
            message,
            discussionId,
            onChunk
        }: {
            message: string;
            discussionId?: string;
            onChunk: (chunk: string) => void
        }) => {
            const url = `/ai-discussions/handle-message/`;

            return streamHelper(
                url,
                '',
                '',
                message,
                onChunk,
                discussionId
            );
        },
        onSuccess: () => {
            setStreamingContent("");
            queryClient.invalidateQueries({ queryKey: ["ai-messages", discussionId] });
            queryClient.invalidateQueries({ queryKey: ["ai-discussions"] });
        },
    });

    const deleteDiscussionMutation = useMutation({
        mutationFn: (id: string) => aiDiscussionService.deleteDiscussion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai-discussions"] });
        },
    });

    return {
        discussions: discussionsData?.data || [],
        messages: messagesData?.data || [],
        isLoading: isLoadingList || isLoadingMessages,
        streamingContent,
        isStreaming: chatWithAiMutation.isPending,

        // Actions
        sendMessage: (message: string) =>
            chatWithAiMutation.mutateAsync({
                message,
                onChunk: (chunk) => setStreamingContent(prev => prev + chunk)
            }),
        deleteDiscussion: deleteDiscussionMutation.mutateAsync,
    };
}