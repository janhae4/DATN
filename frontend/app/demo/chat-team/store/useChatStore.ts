import { create } from "zustand";
import { ApiService } from "../services/api-service";
import { ChatState, Conversation, MessageData } from "../types/type";


export const useChatStore = create<ChatState>((set, get) => ({
    selectedConversation: null,
    messages: {},
    messagePages: {},
    hasMoreMessages: {},
    visibleConversations: [],
    metaMap: {},
    currentPage: 0,
    totalPages: 1,
    isLoadingConversations: false,

    setSelectedConversation: async ({ conversation, teamId }) => {
        const state = get();
        if (teamId) {
            set({ selectedConversation: state.visibleConversations.find(c => c.teamId === teamId) });
            return;
        }

        const conv = conversation;
        set({ selectedConversation: conv });

        if (!conv) {
            return;
        }

        const convId = conv._id;

        console.log(convId)

        if (state.messages[convId] !== undefined) {
            console.log(`Messages for ${convId} already exist, skipping fetch.`);
            return;
        }

        console.log(`No messages for ${convId}, fetching page 1...`);
        try {
            const messageResponse = await ApiService.getMessages(convId, 1);
            console.log("MESSAGE RESPONSE", messageResponse)
            const initialMessages = messageResponse.data.reverse();
            const hasMore = messageResponse.page < messageResponse.totalPages;
            const page = messageResponse.page;

            set((currentState) => ({
                messages: {
                    ...currentState.messages,
                    [convId]: initialMessages,
                },
                messagePages: {
                    ...currentState.messagePages,
                    [convId]: page,
                },
                hasMoreMessages: {
                    ...currentState.hasMoreMessages,
                    [convId]: hasMore,
                },
            }));

        } catch (error) {
            console.error(`Failed to fetch initial messages for ${convId}:`, error);
            set((currentState) => ({
                messages: {
                    ...currentState.messages,
                    [convId]: [],
                },
                messagePages: {
                    ...currentState.messagePages,
                    [convId]: 1,
                },
                hasMoreMessages: {
                    ...currentState.hasMoreMessages,
                    [convId]: false,
                },
            }));
        }
    },

    appendMessage: (convId, message) =>
        set((state) => {
            const currentMessages = state.messages[convId] || [];
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
                    [convId]: updatedMessages,
                },
            };
        }),

    prependMessages: (conversationId, messagesToPrepend) =>
        set((state) => {
            if (messagesToPrepend.length === 0) return {};
            const currentMessages = state.messages[conversationId] || [];
            const existingIds = new Set(currentMessages.map((m) => m._id));
            const uniqueNewMessages = messagesToPrepend.filter(
                (m) => !existingIds.has(m._id)
            );

            if (uniqueNewMessages.length === 0) return {};

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

    replaceTempMessage: (conversationId, tempId, finalMessageEvent) =>
        set((state) => {
            const finalMessage: MessageData = finalMessageEvent.message;

            const currentMessages = state.messages[conversationId] || [];
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
                        [conversationId]: filteredMessages,
                    },
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
                (acc: { [conversationId: string]: Conversation }, curr: Conversation) => {
                    acc[curr._id] = { ...curr };
                    return acc;
                },
                {} as { [conversationId: string]: Conversation }
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
                updatedMetaMap[c._id] = { ...c };
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

            const index = state.visibleConversations.findIndex(
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
            const itemToMove = state.visibleConversations[index];
            const updatedItem = {
                ...itemToMove,
                ...restOfMeta,
                latestMessageSnapshot: newMessage,
            };

            const remaining = state.visibleConversations.filter(
                (c) => c._id !== discussionId
            );

            return {
                metaMap: newMetaMap,
                visibleConversations: [updatedItem, ...remaining],
            };
        }),

    ensureConversationVisible: async (convId, fetchIfMissing) => {
        const state = get();
        const isVisible = state.visibleConversations.some((c) => c._id === convId);
        console.log(isVisible)
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
                        `Conversation ${convId} became visible during fetch, merging meta only.`
                    );

                    const meta = currentState.metaMap[fullConversation._id];
                    const metaTime = meta?.latestMessageSnapshot?.createdAt
                        ? new Date(meta.latestMessageSnapshot.createdAt).getTime()
                        : 0;
                    const fetchedTime = fullConversation.latestMessageSnapshot?.createdAt
                        ? new Date(fullConversation.latestMessageSnapshot.createdAt).getTime()
                        : 0;

                    if (fetchedTime > metaTime) {
                        return {
                            metaMap: {
                                ...currentState.metaMap,
                                [fullConversation._id]: {
                                    ...(meta || {}),
                                    ...fullConversation,
                                },
                            },
                        };
                    }

                    return {};

                } else {
                    console.log(`Conversation ${convId} fetched, adding to visible list.`);

                    const meta = currentState.metaMap[fullConversation._id];
                    const metaTime = meta?.latestMessageSnapshot?.createdAt
                        ? new Date(meta.latestMessageSnapshot.createdAt).getTime()
                        : 0;
                    const fetchedTime = fullConversation.latestMessageSnapshot?.createdAt
                        ? new Date(fullConversation.latestMessageSnapshot.createdAt).getTime()
                        : 0;

                    const finalConversation =
                        meta && metaTime > fetchedTime
                            ? { ...fullConversation, ...meta }
                            : fullConversation;

                    return {
                        visibleConversations: [
                            finalConversation,
                            ...currentState.visibleConversations,
                        ],
                        metaMap: {
                            ...currentState.metaMap,
                            [finalConversation._id]: {
                                ...(meta || {}),
                                ...finalConversation,
                            },
                        },
                    };
                }
            });
        } catch (err) {
            console.error(`Failed to fetch missing conversation ${convId}:`, err);
        }
    },

    moveConversationToTop: ({ conversationId, teamId }) =>
        set((state) => {
            const convId = state.visibleConversations.find(c => c.teamId === teamId)?._id || conversationId || '';

            const index = state.visibleConversations.findIndex(
                (c) => c._id === convId
            );

            if (index <= 0) {
                return {};
            }

            const itemToMove = state.visibleConversations[index];
            const meta = state.metaMap[convId];

            const metaTime = meta?.latestMessageSnapshot?.createdAt
                ? new Date(meta.latestMessageSnapshot.createdAt).getTime()
                : 0;
            const itemTime = itemToMove.latestMessageSnapshot?.createdAt
                ? new Date(itemToMove.latestMessageSnapshot.createdAt).getTime()
                : 0;

            const updatedItem = (meta && metaTime > itemTime)
                ? { ...itemToMove, ...meta }
                : itemToMove;

            const remaining = state.visibleConversations.filter(
                (c) => c._id !== convId
            );

            return { visibleConversations: [updatedItem, ...remaining] };
        }),

    updateConversationInList: (updatedTeam) =>
        set((state) => {
            const convoToUpdate = state.visibleConversations.find(
                (c) => c.teamId === updatedTeam.id
            );

            if (!convoToUpdate) {
                console.warn("Không tìm thấy conversation cho teamId:", updatedTeam.id);
                return state;
            }

            const convoIdToUpdate = convoToUpdate._id;
            const members = updatedTeam.members.map((m) => ({
                id: m._id,
                name: m.name,
                avatar: m.avatar,
                role: m.role,
            }))

            const newVisible = state.visibleConversations.map((c) =>
                c._id === convoIdToUpdate
                    ? {
                        ...c,
                        name: updatedTeam.name,
                        participants: members,
                    }
                    : c
            );

            const newSelected =
                state.selectedConversation?._id === convoIdToUpdate
                    ? newVisible.find(c => c._id === convoIdToUpdate)
                    : state.selectedConversation;

            const updatedConvoForMeta = newVisible.find(c => c._id === convoIdToUpdate);

            const newMeta = {
                ...state.metaMap,
                [convoIdToUpdate]: {
                    ...state.metaMap[convoIdToUpdate],
                    ...updatedConvoForMeta,
                },
            };

            return {
                visibleConversations: newVisible,
                selectedConversation: newSelected,
                metaMap: newMeta,
            };
        }),
}));