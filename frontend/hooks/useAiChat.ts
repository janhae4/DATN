import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { aiDiscussionService } from "@/services/aiDiscussionService";
import { streamHelper } from "@/services/apiClient";
import { AiMessage, Pagination } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export function useAiChat(discussionId?: string) {
    const queryClient = useQueryClient();
    const { user } = useAuth()
    const [streamingContent, setStreamingContent] = useState("");

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingMessages,
    } = useInfiniteQuery({
        queryKey: ["ai-messages", discussionId],
        initialPageParam: 1,
        enabled: !!discussionId,
        queryFn: ({ pageParam = 1 }) => aiDiscussionService.getMessages(discussionId!, pageParam, 3),
        getNextPageParam: (lastPage) => {
            if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
            return undefined;
        },
    });

    const messages = useMemo(() => {
        if (!data) return [];
        return [...data.pages].reverse().flatMap((page) => page.data.messages);
    }, [data]);

    const sendMessageMutation = useMutation({
        mutationFn: async ({ discussionId, message, onChunk }: { discussionId: string; message: string, onChunk: (chunk: string) => void }) => {
            return streamHelper(
                `/ai-discussions/handle-message/`,
                { discussionId, message },
                onChunk
            );
        },
        onSuccess: () => {
            setStreamingContent("");
            queryClient.invalidateQueries({ queryKey: ["ai-messages", discussionId] });
            queryClient.invalidateQueries({ queryKey: ["ai-discussions"] });
        },
    });

    const pendingMessageContent = sendMessageMutation.variables?.message;
    const isSending = sendMessageMutation.isPending;

    let displayMessages = [...messages];

    if (isSending && pendingMessageContent) {
        const lastMessage = messages[messages.length - 1];

        const isMessageAlreadySaved = lastMessage &&
            lastMessage.content === pendingMessageContent &&
            lastMessage.sender?._id !== "AI_ID";

        if (!isMessageAlreadySaved) {
            const tempUserMessage: AiMessage = {
                _id: "temp-sending-id-" + Date.now().toString(),
                content: pendingMessageContent,
                sender: {
                    _id: user?.id || "user",
                    name: user?.name || "You",
                    avatar: user?.avatar,
                } as any,
                timestamp: new Date().toISOString(),
                discussionId: discussionId || "",
            };

            displayMessages.push(tempUserMessage);
        }
    }

    return {
        messages: displayMessages,
        isLoadingMessages,
        sendMessage: sendMessageMutation.mutateAsync,
        isStreaming: sendMessageMutation.isPending,
        streamingContent,
        setStreamingContent,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    };
}