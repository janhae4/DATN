import { create } from "zustand";
import { ApiService } from "../services/api-service";
import { AiMessage, Discussion, CurrentUser, MessageData, NewMessageEvent, Team, TeamRole, AskQuestionPayload, SummarizeDocumentPayload, FileStatusEvent } from "../types/type";
import { Socket } from "socket.io-client";
import { CHATBOT_PATTERN } from "@/app/SocketContext";

function transformAiMessage(aiMsg: AiMessage, discId: string): MessageData {
    return {
        _id: aiMsg._id,
        content: aiMsg.content,
        sender: {
            _id: aiMsg.sender._id,
            name: aiMsg.sender.name,
            avatar: aiMsg.sender.avatar,
            role: aiMsg.role || "MEMBER",
        },
        createdAt: aiMsg.timestamp,
        discussionId: discId,
    };
}

const createOptimisticMessage = (content: string, currentUser: CurrentUser, discussionId: string): MessageData => ({
    _id: `temp-user-${Date.now()}`,
    discussionId,
    content: content,
    createdAt: new Date().toISOString(),
    sender: {
        _id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: TeamRole.MEMBER,
    },
});

const createStreamingPlaceholder = (discussionId: string): MessageData => ({
    _id: `temp-streaming-${Date.now()}`,
    discussionId,
    content: "",
    createdAt: new Date().toISOString(),
    sender: { _id: "ai-system-id", name: "AI Assistant", role: TeamRole.AI },
});

export interface ChatState {
    selectedDiscussion: Discussion | null;
    messages: { [discussionId: string]: MessageData[] };
    messagePages: { [discussionId: string]: number };
    hasMoreMessages: { [discussionId: string]: boolean };

    streamingResponses: { [discussionId: string]: boolean };
    historyLoading: { [discussionId: string]: boolean };
    prompts: { [discussionId: string]: string };
    personalAiDiscussionId: string | null;

    visibleDiscussions: Discussion[];
    metaMap: { [discussionId: string]: Discussion };
    currentPage: number;
    totalPages: number;
    isLoadingDiscussions: boolean;

    appendStreamingPlaceholder: (discussionId: string) => void;

    setStreaming: (discussionId: string, isStreaming: boolean) => void;
    setHistoryLoading: (discussionId: string, isLoading: boolean) => void;
    setPrompt: (discussionId: string, prompt: string) => void;
    setPersonalAiDiscussionId: (id: string | null) => void;
    updateStreamingMessage: (discussionId: string, contentChunk: string) => void;
    setSelectedDiscussion: (payload: { discussion?: Discussion | null, teamId?: string }) => void;
    finalizeStreamingMessage: (discussionId: string, finalAiMessage: AiMessage) => void;
    handleStreamingError: (discussionId: string, errorContent: string) => void;
    summarizeAiDocument: (conversationId: string, currentUser: CurrentUser, socket: Socket, file: FileStatusEvent, teamId?: string) => void;
    appendMessage: (discussionId: string, message: MessageData) => void;
    prependMessages: (discussionId: string, messages: MessageData[]) => void;
    loadInitialDiscussions: (chatMode: 'team' | 'ai') => Promise<void>;
    loadMoreDiscussions: () => Promise<void>;
    upsertDiscussionMeta: (meta: NewMessageEvent) => void;
    ensureDiscussionVisible: (
        DiscussionId: string,
        fetchIfMissing: (id: string) => Promise<Discussion | null>
    ) => Promise<void>;
    moveDiscussionToTop: (payload: { discussionId?: string, teamId?: string }) => void;
    updateDiscussionInList: (updatedDiscussion: Team) => void;
    setMessagesForDiscussion: (
        DiscussionId: string,
        messages: MessageData[],
        page: number,
        hasMore: boolean
    ) => void;
    replaceTempMessage: (
        DiscussionId: string,
        tempId: string,
        finalMessage: NewMessageEvent
    ) => void;
    removeTempMessage: (discussionId: string, tempId: string) => void;
    setMessagePage: (discussionId: string, page: number) => void;
    setHasMoreMessages: (discussionId: string, hasMore: boolean) => void;

    loadInitialAiMessages: (
        discussionId: string,
        currentUser: CurrentUser,
        teamId?: string
    ) => Promise<void>;
    loadMoreAiMessages: (discussionId: string) => Promise<number>;
    sendAiMessage: (
        discersationId: string,
        currentUser: CurrentUser,
        socket: Socket,
        teamId?: string
    ) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    selectedDiscussion: null,
    messages: {},
    messagePages: {},
    hasMoreMessages: {},
    visibleDiscussions: [],
    metaMap: {},
    currentPage: 0,
    totalPages: 1,
    isLoadingDiscussions: false,
    streamingResponses: {},
    historyLoading: {},
    prompts: {},
    personalAiDiscussionId: null,

    setPersonalAiDiscussionId: (id) => set({ personalAiDiscussionId: id }),

    updateStreamingMessage: (discussionId, contentChunk) =>
        set((state) => {
            const currentMessages = state.messages[discussionId] || [];
            if (currentMessages.length === 0) return {};

            const lastMessage = currentMessages[currentMessages.length - 1];

            if (lastMessage?._id.startsWith("temp-streaming-")) {
                const updatedMessage = {
                    ...lastMessage,
                    content: lastMessage.content + contentChunk,
                };
                return {
                    messages: {
                        ...state.messages,
                        [discussionId]: [
                            ...currentMessages.slice(0, -1),
                            updatedMessage,
                        ],
                    },
                };
            }
            return {};
        }),

    finalizeStreamingMessage: (discersationId, finalAiMessage) => {
        const finalMessage = transformAiMessage(finalAiMessage, discersationId);
        set((state) => {
            const currentMessages = state.messages[discersationId] || [];
            const updatedMessages = currentMessages.map((msg) =>
                msg._id.startsWith("temp-streaming-") ? finalMessage : msg
            );
            return {
                messages: { ...state.messages, [discersationId]: updatedMessages },
            };
        });
    },

    handleStreamingError: (discussionId, errorContent) => {
        const errorMsg: MessageData = {
            _id: `err-${Date.now()}`,
            content: `Lỗi AI: ${errorContent}`,
            createdAt: new Date().toISOString(),
            discussionId,
            sender: { _id: "system", name: "System", role: TeamRole.SYSTEM },
        };
        set((state) => ({
            messages: {
                ...state.messages,
                [discussionId]: [
                    ...(state.messages[discussionId] || []).filter(
                        (m) => !m._id.startsWith("temp-streaming-")
                    ),
                    errorMsg,
                ],
            },
            streamingResponses: {
                ...state.streamingResponses,
                [discussionId]: false,
            },
        }));
    },

    summarizeAiDocument: (conversationId, currentUser, socket, file, teamId) => {
        const state = get();
        if (state.streamingResponses[conversationId] || !socket) {
            return;
        }

        const prompt = `Vui lòng tóm tắt tài liệu: ${file.name}`;
        const userMessage = createOptimisticMessage(prompt, currentUser, conversationId);
        state.appendMessage(conversationId, userMessage);

        const payload: SummarizeDocumentPayload = {
            fileId: file.id,
            discussionId: state.personalAiDiscussionId,
            teamId: teamId || "",
        };

        socket.emit(CHATBOT_PATTERN.SUMMARIZE_DOCUMENT, payload);
    },

    loadInitialAiMessages: async (discussionId, currentUser, teamId) => {
        const { setHistoryLoading, setMessagesForDiscussion } = get();
        console.log("Đang tải tin nhắn AI ban đầu cho:", discussionId, teamId);
        setHistoryLoading(discussionId, true);

        try {
            const response = await ApiService.getAiChatHistory(1, 30, teamId);

            const transformedMessages = (response.data.messages || [])
                .map((msg: AiMessage) => transformAiMessage(msg, discussionId))
                .reverse();

            const hasMore = response.page < response.totalPages;

            setMessagesForDiscussion(discussionId, transformedMessages, response.page, hasMore);

            if (!teamId && response.data.discussionId) {
                get().setPersonalAiDiscussionId(response.data.discussionId);
            }

        } catch (error) {
            console.error(`Failed to fetch initial AI messages for ${discussionId}:`, error);
            setMessagesForDiscussion(discussionId, [], 1, false);
        } finally {
            setHistoryLoading(discussionId, false);
        }
    },

    loadMoreAiMessages: async (discussionId) => {
        const state = get();
        if (state.historyLoading[discussionId] || !state.hasMoreMessages[discussionId]) return 0;

        state.setHistoryLoading(discussionId, true);

        const nextPage = state.messagePages[discussionId] + 1;

        try {
            const response = await ApiService.getAiChatHistory(nextPage, 30);

            const transformedMessages = (response.data.messages || [])
                .map((msg: AiMessage) => transformAiMessage(msg, discussionId))
                .reverse();

            state.prependMessages(discussionId, transformedMessages);
            state.setMessagePage(discussionId, response.page);
            state.setHasMoreMessages(discussionId, response.page < response.totalPages);
            return transformedMessages.length;

        } catch (error) {
            console.error(`Failed to load more AI messages for ${discussionId}:`, error);
            return 0;
        } finally {
            state.setHistoryLoading(discussionId, false);
        }
    },

    sendAiMessage: (discussionId, currentUser, socket, teamId) => {
        const state = get();
        const { setPrompt, appendMessage, setStreaming, personalAiDiscussionId } = state;
        const prompt = state.prompts[discussionId];

        if (!prompt?.trim() || state.streamingResponses[discussionId] || !socket) {
            console.warn("Gửi tin nhắn AI bị chặn:", { prompt, streaming: state.streamingResponses[discussionId], socket: !!socket });
            return;
        }

        const userMessage = createOptimisticMessage(prompt, currentUser, discussionId);
        appendMessage(discussionId, userMessage);

        const aiPlaceholder = createStreamingPlaceholder(discussionId);
        appendMessage(discussionId, aiPlaceholder);

        setPrompt(discussionId, "");
        setStreaming(discussionId, true);

        let payload: AskQuestionPayload;

        if (teamId) {
            payload = {
                question: prompt,
                teamId: teamId,
            };
        } else {
            payload = {
                question: prompt,
                discussionId: discussionId,
            };
        }

        console.log("Emitting socket 'ask_question':", payload);
        socket.emit(CHATBOT_PATTERN.ASK_QUESTION, payload);
    },

    setStreaming: (discussionId, isStreaming) =>
        set((state) => ({
            streamingResponses: {
                ...state.streamingResponses,
                [discussionId]: isStreaming,
            },
        })),

    appendStreamingPlaceholder: (discussionId) => {
        set((state) => {
            const currentMessages = state.messages[discussionId] || [];
            const lastMessage = currentMessages[currentMessages.length - 1];

            if (lastMessage?._id.startsWith("temp-streaming-")) {
                return {};
            }

            const placeholder = createStreamingPlaceholder(discussionId);
            return {
                messages: {
                    ...state.messages,
                    [discussionId]: [...currentMessages, placeholder],
                },
            };
        });
    },

    setHistoryLoading: (discussionId, isLoading) =>
        set((state) => ({
            historyLoading: {
                ...state.historyLoading,
                [discussionId]: isLoading,
            },
        })),

    setPrompt: (discussionId, prompt) =>
        set((state) => ({
            prompts: { ...state.prompts, [discussionId]: prompt },
        })),

    setSelectedDiscussion: async ({ discussion, teamId }) => {
        const state = get();
        if (teamId) {
            set({ selectedDiscussion: state.visibleDiscussions.find(c => c.teamId === teamId) });
            return;
        }

        const disc = discussion;
        set({ selectedDiscussion: disc });

        if (!disc) {
            return;
        }

        const discId = disc._id;

        console.log(discId)

        if (state.messages[discId] !== undefined) {
            console.log(`Messages for ${discId} already exist, skipping fetch.`);
            return;
        }

        console.log(`No messages for ${discId}, fetching page 1...`);
        try {
            const messageResponse = await ApiService.getMessages(discId, 1);
            console.log("MESSAGE RESPONSE", messageResponse)
            const initialMessages = messageResponse.data.reverse();
            const hasMore = messageResponse.page < messageResponse.totalPages;
            const page = messageResponse.page;

            set((currentState) => ({
                messages: {
                    ...currentState.messages,
                    [discId]: initialMessages,
                },
                messagePages: {
                    ...currentState.messagePages,
                    [discId]: page,
                },
                hasMoreMessages: {
                    ...currentState.hasMoreMessages,
                    [discId]: hasMore,
                },
            }));

        } catch (error) {
            console.error(`Failed to fetch initial messages for ${discId}:`, error);
            set((currentState) => ({
                messages: {
                    ...currentState.messages,
                    [discId]: [],
                },
                messagePages: {
                    ...currentState.messagePages,
                    [discId]: 1,
                },
                hasMoreMessages: {
                    ...currentState.hasMoreMessages,
                    [discId]: false,
                },
            }));
        }
    },

    appendMessage: (discId, message) =>
        set((state) => {
            const currentMessages = state.messages[discId] || [];
            const isTemp = message._id.startsWith("temp-");

            if (!isTemp) {
                const alreadyExists = currentMessages.some((m) => m._id === message._id);
                if (alreadyExists) {
                    console.log("Real message already exists, skipping:", message._id);
                    return {};
                }
            }

            let messageReplaced = false;

            const updatedMessages = currentMessages.map((m) => {
                if (m._id.startsWith("temp-") && m.createdAt === message.createdAt) {
                    messageReplaced = true;
                    return message;
                }
                return m;
            });

            console.log(updatedMessages)

            if (!messageReplaced) {
                const exists = updatedMessages.some(m => m._id === message._id);
                console.log(exists)
                if (!exists) {
                    updatedMessages.push(message);
                }
            }

            return {
                messages: {
                    ...state.messages,
                    [discId]: updatedMessages,
                },
            };
        }),

    prependMessages: (discussionId, messagesToPrepend) =>
        set((state) => {
            if (messagesToPrepend.length === 0) return {};
            const currentMessages = state.messages[discussionId] || [];
            const existingIds = new Set(currentMessages.map((m) => m._id));
            const uniqueNewMessages = messagesToPrepend.filter(
                (m) => !existingIds.has(m._id)
            );

            if (uniqueNewMessages.length === 0) return {};

            console.log(
                `Prepending ${uniqueNewMessages.length} older messages to ${discussionId}`
            );
            return {
                messages: {
                    ...state.messages,
                    [discussionId]: [...uniqueNewMessages, ...currentMessages],
                },
            };
        }),

    setMessagesForDiscussion: (discussionId, messages, page, hasMore) =>
        set((state) => ({
            messages: {
                ...state.messages,
                [discussionId]: messages,
            },
            messagePages: {
                ...state.messagePages,
                [discussionId]: page,
            },
            hasMoreMessages: {
                ...state.hasMoreMessages,
                [discussionId]: hasMore,
            },
        })),

    // Action set page
    setMessagePage: (discussionId, page) =>
        set((state) => ({
            messagePages: { ...state.messagePages, [discussionId]: page },
        })),

    setHasMoreMessages: (discussionId, hasMore) =>
        set((state) => ({
            hasMoreMessages: { ...state.hasMoreMessages, [discussionId]: hasMore },
        })),

    replaceTempMessage: (discussionId, tempId, finalMessageEvent) =>
        set((state) => {
            const finalMessage: MessageData = finalMessageEvent.message;

            const currentMessages = state.messages[discussionId] || [];
            const messageAlreadyExists = currentMessages.some(
                (m) => m._id === finalMessage._id
            );

            if (messageAlreadyExists) {
                const filteredMessages = currentMessages.filter(
                    (msg) => msg._id !== tempId
                );
                return {
                    messages: {
                        ...state.messages,
                        [discussionId]: filteredMessages,
                    },
                };
            }
            const updatedMessages = currentMessages.map((msg) =>
                msg._id === tempId ? finalMessage : msg
            );

            return {
                messages: { ...state.messages, [discussionId]: updatedMessages },
            };
        }),

    removeTempMessage: (discussionId, tempId) =>
        set((state) => {
            const currentMessages = state.messages[discussionId] || [];
            const filteredMessages = currentMessages.filter(
                (msg) => msg._id !== tempId
            );
            return {
                messages: { ...state.messages, [discussionId]: filteredMessages },
            };
        }),

    loadInitialDiscussions: async (chatMode: string = 'team') => {
        if (get().isLoadingDiscussions) return;
        console.log("Loading initial Discussions...");
        set({
            isLoadingDiscussions: true,
        });
        try {
            const nextPage = 1;
            let response;
            if (chatMode === 'ai') {
                console.log(chatMode)
                response = await ApiService.getAiChatHistory(nextPage);
            }
            else {
                response = await ApiService.getDiscussionsPage(nextPage);
            }
            console.log(response)
            const newMetaMap = response.data.reduce(
                (acc: { [discussionId: string]: Discussion }, curr: Discussion) => {
                    acc[curr._id] = { ...curr };
                    return acc;
                },
                {} as { [discussionId: string]: Discussion }
            );

            set({
                visibleDiscussions: response.data,
                metaMap: newMetaMap,
                currentPage: response.page,
                totalPages: response.totalPages,
                isLoadingDiscussions: false,
            });
            console.log("Initial Discussions loaded:", response.data.length);
        } catch (error) {
            console.error("Failed to load initial Discussions:", error);
            set({ isLoadingDiscussions: false });
        }
    },

    loadMoreDiscussions: async () => {
        const state = get();
        if (state.isLoadingDiscussions || state.currentPage >= state.totalPages) {
            return;
        }
        console.log("Loading more Discussions, page:", state.currentPage + 1);
        set({ isLoadingDiscussions: true });
        try {
            const nextPage = state.currentPage + 1;
            const response = await ApiService.getDiscussionsPage(nextPage) as { data: Discussion[], page: number, totalPages: number };

            const existingIds = new Set(state.visibleDiscussions.map((c) => c._id));
            const newDiscussions = response.data.filter(
                (c) => !existingIds.has(c._id)
            );

            const updatedMetaMap = { ...state.metaMap };
            response.data.forEach((c) => {
                updatedMetaMap[c._id] = { ...c };
            });

            console.log(
                "Loaded more:",
                newDiscussions.length,
                "new Discussions."
            );
            set({
                visibleDiscussions: [
                    ...state.visibleDiscussions,
                    ...newDiscussions,
                ],
                metaMap: updatedMetaMap,
                currentPage: response.page,
                totalPages: response.totalPages,
                isLoadingDiscussions: false,
            });
        } catch (error) {
            console.error("Failed to load more Discussions:", error);
            set({ isLoadingDiscussions: false });
        }
    },

    upsertDiscussionMeta: (meta) =>
        set((state) => {
            const { discussionId, message: newMessage } = meta;

            if (!newMessage) {
                console.log("Upsert ignored: No message provided.");
                return {};
            }

            const currentMeta = state.metaMap[discussionId];
            const currentSnapshot = currentMeta?.latestMessageSnapshot;

            const shouldUpdate =
                !currentSnapshot ||
                new Date(newMessage.createdAt) >= new Date(currentSnapshot.createdAt);

            if (!shouldUpdate) {
                console.log("Upsert ignored: Message is not newer.", new Date(newMessage.createdAt), new Date(currentSnapshot.createdAt));
                return {};
            }

            console.log("Proceeding with upsert for:", discussionId);

            const newMetaForMap = {
                ...(currentMeta || {}),
                ...meta,
                latestMessageSnapshot: newMessage,
            };
            const { message, ...metaToStore } = newMetaForMap;

            const newMetaMap = {
                ...state.metaMap,
                [discussionId]: metaToStore,
            };

            const index = state.visibleDiscussions.findIndex(
                (c) => c._id === discussionId
            );

            if (index === -1) {
                console.log(`Upsert: ${discussionId} not visible, updating metaMap only.`);
                return { metaMap: newMetaMap };
            }

            console.log(`Upsert: ${discussionId} is visible, moving to top.`);
            const {
                _id: metaMessageId,
                discussionId: metaDiscussionId,
                message: metaMessage,
                ...restOfMeta
            } = meta;
            const itemToMove = state.visibleDiscussions[index];
            const updatedItem = {
                ...itemToMove,
                ...restOfMeta,
                latestMessageSnapshot: newMessage,
            };

            const remaining = state.visibleDiscussions.filter(
                (c) => c._id !== discussionId
            );

            return {
                metaMap: newMetaMap,
                visibleDiscussions: [updatedItem, ...remaining],
            };
        }),

    ensureDiscussionVisible: async (discId, fetchIfMissing) => {
        const state = get();
        const isVisible = state.visibleDiscussions.some((c) => c._id === discId);
        console.log(isVisible)
        if (isVisible) return;

        console.log(`Discussion ${discId} not visible. Fetching...`);
        try {
            const fullDiscussion = await fetchIfMissing(discId);
            if (!fullDiscussion) {
                console.error(`Fetch function returned null for discId: ${discId}`);
                return;
            }
            set((currentState) => {
                if (
                    currentState.visibleDiscussions.some(
                        (c) => c._id === fullDiscussion._id
                    )
                ) {
                    console.log(
                        `Discussion ${discId} became visible during fetch, merging meta only.`
                    );

                    const meta = currentState.metaMap[fullDiscussion._id];
                    const metaTime = meta?.latestMessageSnapshot?.createdAt
                        ? new Date(meta.latestMessageSnapshot.createdAt).getTime()
                        : 0;
                    const fetchedTime = fullDiscussion.latestMessageSnapshot?.createdAt
                        ? new Date(fullDiscussion.latestMessageSnapshot.createdAt).getTime()
                        : 0;

                    if (fetchedTime > metaTime) {
                        return {
                            metaMap: {
                                ...currentState.metaMap,
                                [fullDiscussion._id]: {
                                    ...(meta || {}),
                                    ...fullDiscussion,
                                },
                            },
                        };
                    }

                    return {};

                } else {
                    console.log(`Discussion ${discId} fetched, adding to visible list.`);

                    const meta = currentState.metaMap[fullDiscussion._id];
                    const metaTime = meta?.latestMessageSnapshot?.createdAt
                        ? new Date(meta.latestMessageSnapshot.createdAt).getTime()
                        : 0;
                    const fetchedTime = fullDiscussion.latestMessageSnapshot?.createdAt
                        ? new Date(fullDiscussion.latestMessageSnapshot.createdAt).getTime()
                        : 0;

                    const finalDiscussion =
                        meta && metaTime > fetchedTime
                            ? { ...fullDiscussion, ...meta }
                            : fullDiscussion;

                    return {
                        visibleDiscussions: [
                            finalDiscussion,
                            ...currentState.visibleDiscussions,
                        ],
                        metaMap: {
                            ...currentState.metaMap,
                            [finalDiscussion._id]: {
                                ...(meta || {}),
                                ...finalDiscussion,
                            },
                        },
                    };
                }
            });
        } catch (err) {
            console.error(`Failed to fetch missing Discussion ${discId}:`, err);
        }
    },

    moveDiscussionToTop: ({ discussionId, teamId }) =>
        set((state) => {
            const discId = state.visibleDiscussions.find(c => c.teamId === teamId)?._id || discussionId || '';

            const index = state.visibleDiscussions.findIndex(
                (c) => c._id === discId
            );

            if (index <= 0) {
                return {};
            }

            const itemToMove = state.visibleDiscussions[index];
            const meta = state.metaMap[discId];

            const metaTime = meta?.latestMessageSnapshot?.createdAt
                ? new Date(meta.latestMessageSnapshot.createdAt).getTime()
                : 0;
            const itemTime = itemToMove.latestMessageSnapshot?.createdAt
                ? new Date(itemToMove.latestMessageSnapshot.createdAt).getTime()
                : 0;

            const updatedItem = (meta && metaTime > itemTime)
                ? { ...itemToMove, ...meta }
                : itemToMove;

            const remaining = state.visibleDiscussions.filter(
                (c) => c._id !== discId
            );

            return { visibleDiscussions: [updatedItem, ...remaining] };
        }),

    updateDiscussionInList: (updatedTeam) =>
        set((state) => {
            const discoToUpdate = state.visibleDiscussions.find(
                (c) => c.teamId === updatedTeam.id
            );

            if (!discoToUpdate) {
                console.warn("Không tìm thấy Discussion cho teamId:", updatedTeam.id);
                return state;
            }

            const discoIdToUpdate = discoToUpdate._id;
            const members = updatedTeam.members.map((m) => ({
                id: m._id,
                name: m.name,
                avatar: m.avatar,
                role: m.role,
            }))

            const newVisible = state.visibleDiscussions.map((c) =>
                c._id === discoIdToUpdate
                    ? {
                        ...c,
                        name: updatedTeam.name,
                        participants: members,
                    }
                    : c
            );

            const newSelected =
                state.selectedDiscussion?._id === discoIdToUpdate
                    ? newVisible.find(c => c._id === discoIdToUpdate)
                    : state.selectedDiscussion;

            const updateddiscoForMeta = newVisible.find(c => c._id === discoIdToUpdate);

            const newMeta = {
                ...state.metaMap,
                [discoIdToUpdate]: {
                    ...state.metaMap[discoIdToUpdate],
                    ...updateddiscoForMeta,
                },
            };

            return {
                visibleDiscussions: newVisible,
                selectedDiscussion: newSelected,
                metaMap: newMeta,
            };
        }),
}));