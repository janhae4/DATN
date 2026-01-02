import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { aiDiscussionService } from "@/services/aiDiscussionService";
import { streamHelper } from "@/services/apiClient";
import { AiMessage, Pagination } from "@/types";

export function useAiChat(discussionId?: string) {
    const queryClient = useQueryClient();
    const [streamingContent, setStreamingContent] = useState("");

    const { data, isLoading: isLoadingMessages } = useQuery({
        queryKey: ["ai-messages", discussionId],
        queryFn: () => aiDiscussionService.getMessages(discussionId!, 1, 50),
        enabled: !!discussionId,
    });

    const messages = data?.data?.messages || [];

    const sendMessageMutation = useMutation({
        mutationFn: async (message: string) => {
            setStreamingContent("");
            return await streamHelper(
                '/ai-discussions/handle-message',
                '', '',
                message,
                (chunk) => setStreamingContent((prev) => prev + chunk),
                discussionId
            );
        },
        onSuccess: () => {
            setStreamingContent("");
            queryClient.invalidateQueries({ queryKey: ["ai-messages", discussionId] });
            queryClient.invalidateQueries({ queryKey: ["ai-discussions"] });
        },
    });

    return {
        messages,
        isLoadingMessages,
        sendMessage: sendMessageMutation.mutateAsync,
        isStreaming: sendMessageMutation.isPending,
        streamingContent,
    };
}