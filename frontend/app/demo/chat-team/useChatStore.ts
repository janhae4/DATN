import { create } from "zustand";
import { ApiService } from "../api-service";



export const useChatStore = create<ChatState>((set, get) => ({
    selectedConversation: null,
    messages: {},
    messagePages: {}, // Khởi tạo rỗng
    hasMoreMessages: {}, // Khởi tạo rỗng
    visibleConversations: [],
    metaMap: {},
    currentPage: 0,
    totalPages: 1,
    isLoadingConversations: false,

    // === Actions ===
    setSelectedConversation: (conv) =>
        set(() => ({ selectedConversation: conv })),

    appendMessage: (convId, message) =>
        set((state) => {
            console.log(message)
            const currentMessages = state.messages[convId] || [];
            const isTemp = message._id.startsWith("temp-");
            const messageExists =
                !isTemp &&
                currentMessages.some(
                    (m) => m._id === message._id || m.createdAt === message.createdAt
                );
            if (messageExists) {
                console.log("Message already exists, skipping append:", message._id);
                return {};
            }
            console.log("Appending message:", message._id, "to", convId);
            return {
                messages: {
                    ...state.messages,
                    [convId]: [...currentMessages, message],
                },
            };
        }),

    prependMessages: (conversationId, messagesToPrepend) =>
        set((state) => {
            if (messagesToPrepend.length === 0) return {}; // Không làm gì nếu không có tin nhắn mới
            const currentMessages = state.messages[conversationId] || [];
            const existingIds = new Set(currentMessages.map((m) => m._id));
            const uniqueNewMessages = messagesToPrepend.filter(
                (m) => !existingIds.has(m._id)
            );

            if (uniqueNewMessages.length === 0) return {}; // Không có tin nhắn thực sự mới

            console.log(
                `Prepending ${uniqueNewMessages.length} older messages to ${conversationId}`
            );
            return {
                messages: {
                    ...state.messages,
                    [conversationId]: [...uniqueNewMessages, ...currentMessages],
                },
            };
        }),

    setMessagesForConversation: (conversationId, messages, page, hasMore) =>
        set((state) => ({
            messages: {
                ...state.messages,
                [conversationId]: messages,
            },
            messagePages: {
                ...state.messagePages,
                [conversationId]: page,
            },
            hasMoreMessages: {
                ...state.hasMoreMessages,
                [conversationId]: hasMore,
            },
        })),

    // Action set page
    setMessagePage: (conversationId, page) =>
        set((state) => ({
            messagePages: { ...state.messagePages, [conversationId]: page },
        })),

    // Action set hasMore
    setHasMoreMessages: (conversationId, hasMore) =>
        set((state) => ({
            hasMoreMessages: { ...state.hasMoreMessages, [conversationId]: hasMore },
        })),

    replaceTempMessage: (conversationId, tempId, finalMessage) =>
        set((state) => {
            const currentMessages = state.messages[conversationId] || [];
            if (currentMessages.some((m) => m._id === finalMessage._id)) {
                const filteredMessages = currentMessages.filter(
                    (msg) => msg._id !== tempId
                );
                return {
                    messages: { ...state.messages, [conversationId]: filteredMessages },
                };
            }
            const updatedMessages = currentMessages.map((msg) =>
                msg._id === tempId ? finalMessage : msg
            );
            return {
                messages: { ...state.messages, [conversationId]: updatedMessages },
            };
        }),

    removeTempMessage: (conversationId, tempId) =>
        set((state) => {
            const currentMessages = state.messages[conversationId] || [];
            const filteredMessages = currentMessages.filter(
                (msg) => msg._id !== tempId
            );
            return {
                messages: { ...state.messages, [conversationId]: filteredMessages },
            };
        }),

    loadInitialConversations: async () => {
        if (get().isLoadingConversations) return;
        console.log("Loading initial conversations...");
        set({
            isLoadingConversations: true,
        });
        try {
            const nextPage = 1;
            const response = await ApiService.getConversationsPage(nextPage);
            const newMetaMap = response.data.reduce(
                (acc: { [conversationId: string]: ConversationMeta }, curr: Conversation) => {
                    acc[curr._id] = { _id: curr._id, latestMessage: curr.latestMessage };
                    return acc;
                },
                {} as { [conversationId: string]: ConversationMeta }
            );

            set({
                visibleConversations: response.data,
                metaMap: newMetaMap,
                currentPage: response.page,
                totalPages: response.totalPages,
                isLoadingConversations: false,
            });
            console.log("Initial conversations loaded:", response.data.length);
        } catch (error) {
            console.error("Failed to load initial conversations:", error);
            set({ isLoadingConversations: false });
        }
    },

    loadMoreConversations: async () => {
        const state = get();
        if (state.isLoadingConversations || state.currentPage >= state.totalPages) {
            return;
        }
        console.log("Loading more conversations, page:", state.currentPage + 1);
        set({ isLoadingConversations: true });
        try {
            const nextPage = state.currentPage + 1;
            const response = await ApiService.getConversationsPage(nextPage) as { data: Conversation[], page: number, totalPages: number };

            const existingIds = new Set(state.visibleConversations.map((c) => c._id));
            const newConversations = response.data.filter(
                (c) => !existingIds.has(c._id)
            );

            const updatedMetaMap = { ...state.metaMap };
            response.data.forEach((c) => {
                updatedMetaMap[c._id] = { _id: c._id, latestMessage: c.latestMessage };
            });

            console.log(
                "Loaded more:",
                newConversations.length,
                "new conversations."
            );
            set({
                visibleConversations: [
                    ...state.visibleConversations,
                    ...newConversations,
                ],
                metaMap: updatedMetaMap,
                currentPage: response.page,
                totalPages: response.totalPages,
                isLoadingConversations: false,
            });
        } catch (error) {
            console.error("Failed to load more conversations:", error);
            set({ isLoadingConversations: false });
        }
    },

    upsertConversationMeta: (meta) =>
        set((state) => {
            // ... (Giữ nguyên)
            const currentMeta = state.metaMap[meta._id];
            const shouldUpdate =
                !currentMeta?.latestMessage ||
                !meta.latestMessage ||
                new Date(meta.latestMessage.createdAt) >=
                new Date(currentMeta.latestMessage.createdAt);

            if (shouldUpdate) {
                return {
                    metaMap: {
                        ...state.metaMap,
                        [meta._id]: { ...(currentMeta || {}), ...meta },
                    },
                };
            }
            return {};
        }),

    ensureConversationVisible: async (convId, fetchIfMissing) => {
        // ... (Giữ nguyên)
        const state = get();
        const isVisible = state.visibleConversations.some((c) => c._id === convId);

        if (isVisible) return;

        console.log(`Conversation ${convId} not visible. Fetching...`);
        try {
            const fullConversation = await fetchIfMissing(convId);
            if (!fullConversation) {
                console.error(`Fetch function returned null for convId: ${convId}`);
                return;
            }
            set((currentState) => {
                if (
                    currentState.visibleConversations.some(
                        (c) => c._id === fullConversation._id
                    )
                ) {
                    console.log(
                        `Conversation ${convId} became visible during fetch, skipping add.`
                    );
                    const currentMeta = currentState.metaMap[fullConversation._id];
                    const fetchedTime = fullConversation.latestMessage
                        ? new Date(fullConversation.latestMessage.createdAt).getTime()
                        : 0;
                    const metaTime = currentMeta?.latestMessage
                        ? new Date(currentMeta.latestMessage.createdAt).getTime()
                        : 0;
                    if (fetchedTime > metaTime) {
                        return {
                            metaMap: {
                                ...currentState.metaMap,
                                [fullConversation._id]: {
                                    _id: fullConversation._id,
                                    latestMessage: fullConversation.latestMessage,
                                },
                            },
                        };
                    }
                    return {};
                }
                console.log(`Conversation ${convId} fetched, adding to visible list.`);
                return {
                    visibleConversations: [
                        fullConversation,
                        ...currentState.visibleConversations,
                    ],
                    metaMap: {
                        ...currentState.metaMap,
                        [fullConversation._id]: {
                            _id: fullConversation._id,
                            latestMessage: fullConversation.latestMessage,
                        },
                    },
                };
            });
        } catch (err) {
            console.error(`Failed to fetch missing conversation ${convId}:`, err);
        }
    },

    moveConversationToTop: (convId) =>
        set((state) => {
            // ... (Giữ nguyên)
            const index = state.visibleConversations.findIndex(
                (c) => c._id === convId
            );

            if (index === 0) {
                const currentConvo = state.visibleConversations[0];
                const meta = state.metaMap[convId];
                const metaTime = meta?.latestMessage
                    ? new Date(meta.latestMessage.createdAt).getTime()
                    : 0;
                const currentMsgTime = currentConvo.latestMessage
                    ? new Date(currentConvo.latestMessage.createdAt).getTime()
                    : 0;

                if (meta && meta.latestMessage && metaTime > currentMsgTime) {
                    const updatedVisible = [...state.visibleConversations];
                    updatedVisible[0] = {
                        ...currentConvo,
                        latestMessage: meta.latestMessage,
                    };
                    return { visibleConversations: updatedVisible };
                }
                return {};
            }

            if (index > 0) {
                const itemToMove = state.visibleConversations[index];
                const latestMessageFromMeta = state.metaMap[convId]?.latestMessage;
                const updatedItem = latestMessageFromMeta
                    ? { ...itemToMove, latestMessage: latestMessageFromMeta }
                    : itemToMove;
                const remaining = state.visibleConversations.filter(
                    (c) => c._id !== convId
                );
                return { visibleConversations: [updatedItem, ...remaining] };
            }

            console.warn(
                `Cannot move ${convId} to top, not found in visible list yet.`
            );
            return {};
        }),

    updateConversationInList: (updatedConversation) =>
        set((state) => {
            // ... (Giữ nguyên)
            console.log("Updating conversation in list:", updatedConversation._id);
            const newVisible = state.visibleConversations.map((c) =>
                c._id === updatedConversation._id ? updatedConversation : c
            );
            const newSelected =
                state.selectedConversation?._id === updatedConversation._id
                    ? updatedConversation
                    : state.selectedConversation;
            const newMeta = {
                ...state.metaMap,
                [updatedConversation._id]: {
                    _id: updatedConversation._id,
                    latestMessage: updatedConversation.latestMessage,
                },
            };

            return {
                visibleConversations: newVisible,
                selectedConversation: newSelected,
                metaMap: newMeta,
            };
        }),
}));