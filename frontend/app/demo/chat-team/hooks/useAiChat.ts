import { useState, useEffect, useRef, useCallback } from "react";
import { ApiService } from "../services/api-service";
import { CHATBOT_PATTERN, useSocket } from "@/app/SocketContext";
import { AiMessage, AskQuestionPayload, CurrentUser, KnowledgeFile, SummarizeDocumentPayload, TeamRole } from "../types/type";
import { useInfiniteScroll } from "./useInfiniteroll";

export function useAiChat(
    currentUser: CurrentUser,
    teamId?: string,
) {
    const { socket } = useSocket()
    const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
    const [prompt, setPrompt] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messagePagination, setMessagePagination] = useState({ page: 1, totalPages: 1 });
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const chatboxRef = useRef<HTMLDivElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoadingMessages(true);
            try {
                console.log("Fetching AI chat history...");
                const historyResponse = await ApiService.getAiChatHistory(1, 30, teamId);
                setActiveConversationId(historyResponse.data._id);
                setAiMessages(historyResponse.data.messages || []);
                setMessagePagination({
                    page: historyResponse.page,
                    totalPages: historyResponse.totalPages,
                });
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 100);
            } catch (error) {
                console.error("Failed to load AI chat history:", error);
            } finally {
                setIsLoadingMessages(false);
            }
        };
        fetchHistory();
    }, [teamId, currentUser]);

    useEffect(() => {
        if (!socket) return;

        const handleChunk = (content: string) => {
            setAiMessages((prev) => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage?.role === TeamRole.AI && lastMessage._id.startsWith("streaming-")) {
                    return [
                        ...prev.slice(0, -1),
                        { ...lastMessage, content: lastMessage.content + content },
                    ];
                }
                // Nếu 'start' bị lỡ, tạo mới
                return [...prev, { ...createStreamingPlaceholder(), content }];
            });
        };

        const handleStart = () => {
            console.log("Stream started, creating loading placeholder...");
            setIsStreaming(true);
            setAiMessages((prev) => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage?._id.startsWith("streaming-")) return prev; // Đã có placeholder
                return [...prev, createStreamingPlaceholder()];
            });
        };

        const handleError = (data: { content: string; metadata?: any }) => {
            setIsStreaming(false);
            setAiMessages((prev) => [
                ...prev.filter((m) => !m._id.startsWith("streaming-")),
                {
                    _id: `err-${Date.now()}`, role: TeamRole.SYSTEM, content: `Lỗi AI: ${data.content}`,
                    timestamp: new Date().toISOString(),
                    sender: { _id: "system", name: "System", role: TeamRole.SYSTEM }
                },
            ]);
        };

        const handleEnd = (data: { content: string; metadata?: any }) => {
            setIsStreaming(false);
        };

        const handleAiMessageSaved = (savedMessage: AiMessage) => {
            setAiMessages((prev) =>
                prev.map((m) =>
                    m._id.startsWith("streaming-") ? savedMessage : m
                )
            );
        };

        const handleUserMessage = (newMessage: AiMessage) => {
            // Chỉ thêm nếu discussionId khớp VÀ không phải là tin của mình
            if (newMessage.conversationId === activeConversationId && newMessage.sender._id !== currentUser.id) {
                setAiMessages((prev) => {
                    // Tránh thêm trùng lặp
                    if (prev.find(m => m._id === newMessage._id)) return prev;
                    return [...prev, newMessage];
                });
            }
        };

        // Nhận ID discussion mới (nếu là chat mới)
        const handleConversationStarted = (data: { newConversationId: string }) => {
            setActiveConversationId(data.newConversationId);
        };

        const handleNewMessage = (data: AiMessage) => {
            console.log(activeConversationId)
            if (data.conversationId !== activeConversationId) return;
            setAiMessages((prev) => [...prev, data]);
        };


        socket.on(CHATBOT_PATTERN.RESPONSE_CHUNK, handleChunk);
        socket.on(CHATBOT_PATTERN.RESPONSE_START, handleStart);
        socket.on(CHATBOT_PATTERN.RESPONSE_ERROR, handleError);
        socket.on(CHATBOT_PATTERN.RESPONSE_END, handleEnd);
        socket.on(CHATBOT_PATTERN.CONVERSATION_STARTED, handleConversationStarted);
        socket.on("new_ai_message", handleNewMessage);

        return () => {
            socket.off(CHATBOT_PATTERN.RESPONSE_CHUNK, handleChunk);
            socket.off(CHATBOT_PATTERN.RESPONSE_ERROR, handleError);
            socket.off(CHATBOT_PATTERN.RESPONSE_END, handleEnd);
            socket.off(CHATBOT_PATTERN.CONVERSATION_STARTED, handleConversationStarted);
            socket.off("new_ai_message", handleNewMessage);
        };
    }, [socket, activeConversationId]);

    const createOptimisticMessage = (content: string): AiMessage => ({
        _id: `user-${Date.now()}`,
        role: TeamRole.MEMBER,
        content: content,
        timestamp: new Date().toISOString(),
        sender: {
            _id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            role: TeamRole.MEMBER,
        },
    });

    const createStreamingPlaceholder = (): AiMessage => ({
        _id: `streaming-${Date.now()}`,
        role: TeamRole.AI,
        content: "",
        timestamp: new Date().toISOString(),
        sender: { _id: "ai-system-id", name: "AI Assistant", role: TeamRole.AI },
    });

    const handleSendAiMessage = () => {
        if (!prompt.trim() || !socket || isStreaming) return;

        const userMessage = createOptimisticMessage(prompt);
        const aiPlaceholder = createStreamingPlaceholder();

        setAiMessages((prev) => [...prev, userMessage, aiPlaceholder]);
        console.log("Sending AI message:", prompt, teamId, activeConversationId);
        socket.emit(CHATBOT_PATTERN.ASK_QUESTION, {
            question: prompt,
            conversationId: activeConversationId,
            teamId: teamId,
        } as AskQuestionPayload);

        setPrompt("");
    };

    const handleSummarize = (file: KnowledgeFile) => {
        if (!socket || isStreaming) return;

        const userMessage = createOptimisticMessage(`Vui lòng tóm tắt tài liệu: ${file.name}`);
        const aiPlaceholder = createStreamingPlaceholder();

        setAiMessages((prev) => [...prev, userMessage, aiPlaceholder]);
        setIsStreaming(true);

        socket.emit(CHATBOT_PATTERN.SUMMARIZE_DOCUMENT, {
            fileId: file.id,
            conversationId: activeConversationId,
            teamId: teamId,
        } as SummarizeDocumentPayload);
    };

    const handleLoadMoreMessages = useCallback(async () => {
        if (isHistoryLoading || messagePagination.page >= messagePagination.totalPages) {
            return;
        }

        setIsHistoryLoading(true);
        const nextPage = messagePagination.page + 1;

        const container = chatboxRef.current;
        const oldScrollHeight = container?.scrollHeight || 0;
        const oldScrollTop = container?.scrollTop || 0;

        try {
            const historyResponse = await ApiService.getAiChatHistory(nextPage, 30, teamId);
            setAiMessages((prev) => [...(historyResponse.data.messages || []), ...prev]);
            setMessagePagination({
                page: historyResponse.page,
                totalPages: historyResponse.totalPages,
            });

            requestAnimationFrame(() => {
                if (container) {
                    container.scrollTop = container.scrollHeight - oldScrollHeight + oldScrollTop;
                }
            });

        } catch (error) {
            console.error("Failed to load more AI messages:", error);
        } finally {
            setIsHistoryLoading(false);
        }
    }, [isHistoryLoading, messagePagination, teamId, chatboxRef]);

    useInfiniteScroll({
        containerRef: chatboxRef,
        endRef: messagesEndRef,
        loadOlder: handleLoadMoreMessages,
        count: aiMessages.length,
        isLoadingOlder: isHistoryLoading
    });

    return {
        aiMessages,
        prompt,
        setPrompt,
        isStreaming,
        isLoadingMessages,
        isHistoryLoading,
        chatboxRef,
        messagesEndRef,
        messagePagination,
        handleSendAiMessage,
        handleSummarize,
        handleLoadMoreMessages,
    };
}