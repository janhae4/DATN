import { create } from "zustand";
import { ApiService } from "../services/api-service";
import { AiMessage, Discussion, CurrentUser, MessageData, NewMessageEvent, Team, TeamRole, AskQuestionPayload, SummarizeDocumentPayload, FileStatusEvent } from "../types/type";
import { Socket } from "socket.io-client";
import { CHATBOT_PATTERN } from "@/app/SocketContext";

function transformAiMessage(aiMsg: AiMessage): MessageData {
    console.log(aiMsg)
    return {
        _id: aiMsg._id,
        content: aiMsg.content,
        sender: {
            _id: aiMsg.sender._id,
            name: aiMsg.sender.name,
            avatar: aiMsg.sender.avatar,
            role: aiMsg.role || "MEMBER",
        },
        createdAt: aiMsg.createdAt,
        discussionId: aiMsg.discussionId || "personal_ai",
        teamId: aiMsg.teamId,
        metadata: aiMsg.metadata,
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
    chatMode: "team" | "ai";
    selectedDiscussion: Discussion | null;
    personalAiDiscussionId: string | null;

    messages: MessageData[];
    messagePage: number;
    hasMoreMessages: boolean;
    isStreamingResponse: boolean;
    isHistoryLoading: boolean;
    currentPrompt: string;

    visibleDiscussions: Discussion[];
    metaMap: { [discussionId: string]: Discussion };
    currentPage: number;
    totalPages: number;
    isLoadingDiscussions: boolean;

    setChatMode: (mode: "team" | "ai") => void;
    setPersonalAiDiscussionId: (id: string | null) => void;
    setMessagePage: (page: number) => void;
    setHasMoreMessages: (hasMore: boolean) => void;
    setStreaming: (isStreaming: boolean) => void;
    setHistoryLoading: (isLoading: boolean) => void;
    setPrompt: (prompt: string) => void;
    setSelectedDiscussion: (payload: { discussion?: Discussion, teamId?: string, chatMode?: 'team' | 'ai' }) => void;
    setMessagesForDiscussion: (messages: MessageData[], page: number, hasMore: boolean) => void;

    appendStreamingPlaceholder: () => void;
    appendMessage: (message: MessageData) => void;
    updateStreamingMessage: (contentChunk: string) => void;
    replaceTempMessage: (tempId: string, finalMessage: NewMessageEvent) => void;

    handleStreamingError: (errorContent: string) => void;
    finalizeStreamingMessage: (finalAiMessage: AiMessage) => void;
    summarizeAiDocument: (currentUser: CurrentUser, socket: Socket, file: FileStatusEvent, teamId?: string) => void;
    prependMessages: (messages: MessageData[]) => void;
    removeTempMessage: (tempId: string) => void;
    loadMessages: (page: number, limit: number, mode?: 'team' | 'ai') => Promise<number>;
    sendAiMessage: (currentUser: CurrentUser, socket: Socket, teamId?: string) => void;

    loadInitialDiscussions: (chatMode: 'team' | 'ai') => Promise<void>;
    loadMoreDiscussions: (chatMode: 'team' | 'ai') => Promise<void>;
    upsertDiscussionMeta: (meta: NewMessageEvent) => void;
    ensureDiscussionVisible: (
        discussionId: string,
        fetchIfMissing: (id: string) => Promise<Discussion | null>
    ) => Promise<void>;
    moveDiscussionToTop: (payload: { discussionId?: string, teamId?: string }) => void;
    updateDiscussionInList: (updatedDiscussion: Team) => void;
}

const initialState = {
    chatMode: "team" as "team" | "ai",
    selectedDiscussion: null,
    personalAiDiscussionId: null,

    messages: [],
    messagePage: 1,
    hasMoreMessages: true,
    isStreamingResponse: false,
    isHistoryLoading: false,
    currentPrompt: "",

    visibleDiscussions: [],
    metaMap: {},
    currentPage: 0,
    totalPages: 1,
    isLoadingDiscussions: false,
};

export const useChatStore = create<ChatState>((set, get) => ({
    ...initialState,

    setMessagePage: (page) => set({ messagePage: page }),

    setHasMoreMessages: (hasMore) => set({ hasMoreMessages: hasMore }),

    setChatMode: (mode) => set({ chatMode: mode }),
    setPersonalAiDiscussionId: (id) => set({ personalAiDiscussionId: id }),

    setStreaming: (isStreaming) => set({ isStreamingResponse: isStreaming }),
    setHistoryLoading: (isLoading) => set({ isHistoryLoading: isLoading }),
    setPrompt: (prompt) => set({ currentPrompt: prompt }),

    setMessagesForDiscussion: (messages, page, hasMore) =>
        set({
            messages: messages,
            messagePage: page,
            hasMoreMessages: hasMore,
        }),

    updateStreamingMessage: (contentChunk) =>
        set((state) => {
            const currentMessages = state.messages || [];
            if (currentMessages.length === 0) return {};

            const lastMessage = currentMessages[currentMessages.length - 1];

            if (lastMessage?._id.startsWith("temp-streaming-")) {
                const updatedMessage = {
                    ...lastMessage,
                    content: lastMessage.content + contentChunk,
                };
                return {
                    messages: [
                        ...currentMessages.slice(0, -1),
                        updatedMessage,
                    ],
                };
            }
            return {};
        }),

    finalizeStreamingMessage: (finalAiMessage: AiMessage) => {
        set((state) => {
            const currentMessages = state.messages || [];

            const finalMessage: MessageData = {
                _id: finalAiMessage._id,
                content: finalAiMessage.content,
                createdAt: finalAiMessage.createdAt,
                discussionId: finalAiMessage.discussionId || state.selectedDiscussion?._id || "",
                teamId: finalAiMessage.teamId,
                metadata: finalAiMessage.metadata,
                sender: {
                    _id: finalAiMessage.sender._id,
                    name: finalAiMessage.sender.name,
                    avatar: finalAiMessage.sender.avatar,
                    role: finalAiMessage.role || "MEMBER",
                }
            };

            const updatedMessages = currentMessages.map((msg) =>
                msg._id.startsWith("temp-streaming-") ? finalMessage : msg
            );

            return { messages: updatedMessages };
        });
    },

    handleStreamingError: (errorContent) => {
        const discussionId = get().selectedDiscussion?._id;
        if (!discussionId) return;

        const errorMsg: MessageData = {
            _id: `err-${Date.now()}`,
            content: `Lỗi AI: ${errorContent}`,
            createdAt: new Date().toISOString(),
            discussionId,
            sender: { _id: "system", name: "System", role: TeamRole.SYSTEM },
        };
        set((state) => ({
            messages: [
                ...(state.messages || []).filter(
                    (m) => !m._id.startsWith("temp-streaming-")
                ),
                errorMsg,
            ],
            isStreamingResponse: false,
        }));
    },

    summarizeAiDocument: (currentUser, socket, file, teamId) => {
        const state = get();
        const discussion = state.selectedDiscussion;
        if (state.isStreamingResponse || !socket || !discussion) {
            return;
        }
        const discussionId = discussion._id;

        const prompt = `Vui lòng tóm tắt tài liệu: ${file.name}`;
        const userMessage = createOptimisticMessage(prompt, currentUser, discussionId);
        state.appendMessage(userMessage);

        const payload: SummarizeDocumentPayload = {
            fileId: file.id,
            discussionId: state.personalAiDiscussionId,
            teamId: teamId || "",
        };

        socket.emit(CHATBOT_PATTERN.SUMMARIZE_DOCUMENT, payload);
    },

    loadMessages: async (page, limit, mode?: "team" | "ai") => {
        const { setHistoryLoading, prependMessages, setMessagePage, setHasMoreMessages, setMessagesForDiscussion, selectedDiscussion, chatMode } = get();

        if (!selectedDiscussion) return 0;
        setHistoryLoading(true);

        try {
            let response;
            const actualMode = mode || chatMode;
            console.log("Actual mode:", actualMode);
            if (actualMode === "ai" && selectedDiscussion.teamId) {
                response = await ApiService.getTeamAiMessages(selectedDiscussion.teamId, page, limit);
            } else {
                response = await ApiService.getMessages(selectedDiscussion._id, page, limit);
            }

            console.log(response)

            const reversedMessages = response.data.reverse();
            const hasMore = response.totalPages > page;

            if (page === 1) {
                setMessagesForDiscussion(reversedMessages, page, hasMore);
            } else {
                prependMessages(reversedMessages);
            }
            setMessagePage(page);
            setHasMoreMessages(hasMore);

            return reversedMessages.length;

        } catch (error) {
            console.error(`Failed to load more messages for ${selectedDiscussion._id}:`, error);
            setHasMoreMessages(false);
            return 0;
        } finally {
            setHistoryLoading(false);
        }
    },


    sendAiMessage: (currentUser, socket, teamId) => {
        const state = get();
        const { setPrompt, appendMessage, setStreaming, personalAiDiscussionId } = state;
        const discussion = state.selectedDiscussion;
        const prompt = state.currentPrompt;

        if (!prompt?.trim() || state.isStreamingResponse || !socket || !discussion) {
            console.warn("Gửi tin nhắn AI bị chặn:", { prompt, streaming: state.isStreamingResponse, socket: !!socket, discussion: !!discussion });
            return;
        }

        const discussionId = discussion._id;
        const userMessage = createOptimisticMessage(prompt, currentUser, discussionId);
        appendMessage(userMessage);

        const aiPlaceholder = createStreamingPlaceholder(discussionId);
        appendMessage(aiPlaceholder);

        setPrompt("");
        setStreaming(true);

        let payload: AskQuestionPayload;

        if (teamId) {
            payload = { question: prompt, teamId: teamId };
        } else {
            payload = { question: prompt, discussionId: discussionId };
        }

        console.log("Emitting socket 'ask_question':", payload);
        socket.emit(CHATBOT_PATTERN.ASK_QUESTION, payload);
    },

    appendStreamingPlaceholder: () => {
        set((state) => {
            const discussion = state.selectedDiscussion;
            if (!discussion) return {};

            const currentMessages = state.messages || [];
            const lastMessage = currentMessages[currentMessages.length - 1];

            if (lastMessage?._id.startsWith("temp-streaming-")) {
                return {};
            }

            const placeholder = createStreamingPlaceholder(discussion._id);
            return { messages: [...currentMessages, placeholder] };
        });
    },

    setSelectedDiscussion: async (payload) => {
        const { discussion, teamId, chatMode } = payload;
        console.log("setSelectedDiscussion", { discussion, teamId, chatMode });
        const state = get();
        let discussionToSelect = discussion;

        if (teamId) {
            discussionToSelect = state.visibleDiscussions.find(c => c.teamId === teamId);
        }

        if (!discussionToSelect) {
            set({
                selectedDiscussion: null,
                messages: [],
                messagePage: 1,
                hasMoreMessages: false,
                isHistoryLoading: false,
                isStreamingResponse: false,
                currentPrompt: ""
            });
            return;
        }

        if (state.selectedDiscussion?._id === discussionToSelect._id) {
            console.log(`Discussion ${discussionToSelect._id} đã được chọn.`);
            return;
        }

        const discussionId = discussionToSelect._id;

        set({
            selectedDiscussion: discussionToSelect,
            messages: [],
            messagePage: 1,
            hasMoreMessages: true,
            isHistoryLoading: true,
            isStreamingResponse: false,
            currentPrompt: "",
        });

        console.log(`Đang tải tin nhắn cho ${discussionId}, trang 1...`);
        try {
            const messageResponse = await ApiService.getMessages(discussionId, 1, 30, chatMode);
            if (chatMode === 'ai') {
                messageResponse.data.map(m => ({ ...m, createdAt: m.timestamp }))
            }
            const initialMessages = messageResponse.data.reverse();
            const hasMore = messageResponse.page < messageResponse.totalPages;
            const page = messageResponse.page;

            get().setMessagesForDiscussion(initialMessages, page, hasMore);

        } catch (error) {
            console.error(`Failed to fetch initial messages for ${discussionId}:`, error);
            get().setMessagesForDiscussion([], 1, false);
        } finally {
            set({ isHistoryLoading: false });
        }
    },

    appendMessage: (message) =>
        set((state) => {
            const currentMessages = state.messages || [];
            const isTemp = message._id.startsWith("temp-");

            console.log("========== APPEND MESSAGE ==========");
            console.log("Incoming message:", message);
            console.log("Current messages count:", currentMessages.length);
            console.log("Is temporary message?:", isTemp);

            if (!isTemp) {
                const alreadyExists = currentMessages.some((m) => m._id === message._id);
                console.log("Already exists in currentMessages?:", alreadyExists);

                if (alreadyExists) {
                    console.log("❌ Skip append because message already exists");
                    return {}; // no update
                }
            }

            let messageReplaced = false;
            const updatedMessages = currentMessages.map((m) => {
                const shouldReplace =
                    m._id.startsWith("temp-") && m.createdAt === message.createdAt;

                if (shouldReplace) {
                    console.log("🔄 Replacing temp message:", m._id, "→", message._id);
                    messageReplaced = true;
                    return message;
                }

                return m;
            });

            if (!messageReplaced) {
                const existsAfterReplace = updatedMessages.some((m) => m._id === message._id);
                console.log("Exists after replace:", existsAfterReplace);

                if (!existsAfterReplace) {
                    console.log("➕ Pushing new message:", message._id);
                    updatedMessages.push(message);
                } else {
                    console.log("❌ Skip push because already exists after replace");
                }
            }

            console.log("✅ Final messages count:", updatedMessages.length);
            console.log("====================================");

            return { messages: updatedMessages };
        }),


    prependMessages: (messagesToPrepend) =>
        set((state) => {
            if (messagesToPrepend.length === 0) return {};
            const currentMessages = state.messages || [];
            const existingIds = new Set(currentMessages.map((m) => m._id));
            const uniqueNewMessages = messagesToPrepend.filter(
                (m) => !existingIds.has(m._id)
            );

            if (uniqueNewMessages.length === 0) return {};

            return { messages: [...uniqueNewMessages, ...currentMessages] };
        }),

    replaceTempMessage: (tempId, finalMessageEvent) =>
        set((state) => {
            const finalMessage: MessageData = finalMessageEvent.message;
            const currentMessages = state.messages || [];
            const messageAlreadyExists = currentMessages.some(
                (m) => m._id === finalMessage._id
            );

            if (messageAlreadyExists) {
                const filteredMessages = currentMessages.filter(
                    (msg) => msg._id !== tempId
                );
                return { messages: filteredMessages };
            }

            const updatedMessages = currentMessages.map((msg) =>
                msg._id === tempId ? finalMessage : msg
            );
            return { messages: updatedMessages };
        }),

    removeTempMessage: (tempId) =>
        set((state) => {
            const currentMessages = state.messages || [];
            const filteredMessages = currentMessages.filter(
                (msg) => msg._id !== tempId
            );
            return { messages: filteredMessages };
        }),

    loadInitialDiscussions: async (chatMode = 'team') => {
        if (get().isLoadingDiscussions) return;
        console.log(`Loading initial Discussions for mode: ${chatMode}`);
        set({
            isLoadingDiscussions: true,
        });
        try {
            const nextPage = 1;
            const response = await ApiService.getDiscussionsPage(chatMode, nextPage);

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
        set({ isLoadingDiscussions: true });
        try {
            const nextPage = state.currentPage + 1;

            const response = await ApiService.getDiscussionsPage(state.chatMode, nextPage);

            const existingIds = new Set(state.visibleDiscussions.map((c) => c._id));
            const newDiscussions = response.data.filter(
                (c: Discussion) => !existingIds.has(c._id)
            );

            const updatedMetaMap = { ...state.metaMap };
            response.data.forEach((c: Discussion) => {
                updatedMetaMap[c._id] = { ...c };
            });

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
            console.log("🟦 [upsertDiscussionMeta] TRIGGERED with meta:", meta);

            const effectiveMessage: MessageData | null = meta.message || meta.latestMessageSnapshot || null;
            const effectiveDiscussionId: string | null = meta.discussionId || meta._id || null;

            console.log("➡️ EffectiveDiscussionId:", effectiveDiscussionId);
            console.log("➡️ EffectiveMessage:", effectiveMessage);

            if (!effectiveMessage || !effectiveDiscussionId) {
                console.warn("⚠️ upsertDiscussionMeta SKIPPED: thiếu message hoặc discussionId", {
                    effectiveMessage,
                    effectiveDiscussionId,
                });
                return {};
            }

            const currentMeta = state.metaMap[effectiveDiscussionId];
            const currentSnapshot = currentMeta?.latestMessageSnapshot;

            console.log("🟨 Current meta snapshot:", currentSnapshot?.createdAt);

            const shouldUpdate =
                !currentSnapshot ||
                new Date(effectiveMessage.createdAt) >= new Date(currentSnapshot.createdAt);

            console.log("🔍 Should update meta?", shouldUpdate);

            if (!shouldUpdate) {
                console.log("⛔ SKIPPED: Snapshot mới nhỏ hơn snapshot hiện tại");
                return {};
            }

            const { message, latestMessageSnapshot, ...restOfMeta } = meta;

            const newMetaForMap = {
                ...(currentMeta || {}),
                ...restOfMeta,
                _id: effectiveDiscussionId,
                latestMessageSnapshot: effectiveMessage,
            };

            console.log("✅ Updating metaMap entry:", newMetaForMap);

            const newMetaMap = {
                ...state.metaMap,
                [effectiveDiscussionId]: newMetaForMap,
            };

            // Tìm trong visibleDiscussions và đưa lên đầu nếu đang trong list
            const index = state.visibleDiscussions.findIndex(
                (c) => c._id === effectiveDiscussionId
            );

            console.log("📌 Found discussion in visibleDiscussions index:", index);

            if (index === -1) {
                console.log("ℹ️ Discussion không nằm trong visibleDiscussions → chỉ update metaMap");
                return { metaMap: newMetaMap };
            }

            const itemToMove = state.visibleDiscussions[index];

            console.log("♻️ Reordering visibleDiscussions");

            const updatedItem = {
                ...itemToMove,
                ...newMetaForMap,
            };

            const remaining = state.visibleDiscussions.filter(
                (c) => c._id !== effectiveDiscussionId
            );

            return {
                metaMap: newMetaMap,
                visibleDiscussions: [updatedItem, ...remaining],
            };
        }),


    ensureDiscussionVisible: async (discId, fetchIfMissing) => {
        const state = get();
        const isVisible = state.visibleDiscussions.some((c) => c._id === discId);
        if (isVisible) return;

        try {
            const fullDiscussion = await fetchIfMissing(discId);
            if (!fullDiscussion) return;

            set((currentState) => {
                if (
                    currentState.visibleDiscussions.some(
                        (c) => c._id === fullDiscussion._id
                    )
                ) {
                    // Đã tồn tại, chỉ cập nhật meta
                    const meta = currentState.metaMap[fullDiscussion._id];
                    const metaTime = meta?.latestMessageSnapshot?.createdAt ? new Date(meta.latestMessageSnapshot.createdAt).getTime() : 0;
                    const fetchedTime = fullDiscussion.latestMessageSnapshot?.createdAt ? new Date(fullDiscussion.latestMessageSnapshot.createdAt).getTime() : 0;
                    if (fetchedTime > metaTime) {
                        return { metaMap: { ...currentState.metaMap, [fullDiscussion._id]: { ...(meta || {}), ...fullDiscussion } } };
                    }
                    return {};
                } else {
                    // Thêm mới vào danh sách
                    const meta = currentState.metaMap[fullDiscussion._id];
                    const metaTime = meta?.latestMessageSnapshot?.createdAt ? new Date(meta.latestMessageSnapshot.createdAt).getTime() : 0;
                    const fetchedTime = fullDiscussion.latestMessageSnapshot?.createdAt ? new Date(fullDiscussion.latestMessageSnapshot.createdAt).getTime() : 0;
                    const finalDiscussion = meta && metaTime > fetchedTime ? { ...fullDiscussion, ...meta } : fullDiscussion;

                    return {
                        visibleDiscussions: [finalDiscussion, ...currentState.visibleDiscussions],
                        metaMap: { ...currentState.metaMap, [finalDiscussion._id]: { ...(meta || {}), ...finalDiscussion } },
                    };
                }
            });
        } catch (err) {
            console.error(`Failed to fetch missing Discussion ${discId}:`, err);
        }
    },

    moveDiscussionToTop: ({ discussionId, teamId }) =>
        set((state) => {
            // Logic này giữ nguyên
            const discId = state.visibleDiscussions.find(c => c.teamId === teamId)?._id || discussionId || '';
            const index = state.visibleDiscussions.findIndex((c) => c._id === discId);
            if (index <= 0) return {};

            const itemToMove = state.visibleDiscussions[index];
            const meta = state.metaMap[discId];
            const metaTime = meta?.latestMessageSnapshot?.createdAt ? new Date(meta.latestMessageSnapshot.createdAt).getTime() : 0;
            const itemTime = itemToMove.latestMessageSnapshot?.createdAt ? new Date(itemToMove.latestMessageSnapshot.createdAt).getTime() : 0;
            const updatedItem = (meta && metaTime > itemTime) ? { ...itemToMove, ...meta } : itemToMove;
            const remaining = state.visibleDiscussions.filter((c) => c._id !== discId);

            return { visibleDiscussions: [updatedItem, ...remaining] };
        }),

    updateDiscussionInList: (updatedTeam) =>
        set((state) => {
            // Logic này giữ nguyên
            const discoToUpdate = state.visibleDiscussions.find((c) => c.teamId === updatedTeam.id);
            if (!discoToUpdate) return state;

            const discoIdToUpdate = discoToUpdate._id;
            const members = updatedTeam.members.map((m) => ({
                id: m._id,
                name: m.name,
                avatar: m.avatar,
                role: m.role,
            }));

            const newVisible = state.visibleDiscussions.map((c) =>
                c._id === discoIdToUpdate ? { ...c, name: updatedTeam.name, participants: members } : c
            );

            const newSelected = state.selectedDiscussion?._id === discoIdToUpdate
                ? newVisible.find(c => c._id === discoIdToUpdate)
                : state.selectedDiscussion;

            const updateddiscoForMeta = newVisible.find(c => c._id === discoIdToUpdate);

            const newMeta = {
                ...state.metaMap,
                [discoIdToUpdate]: { ...state.metaMap[discoIdToUpdate], ...updateddiscoForMeta },
            };

            return {
                visibleDiscussions: newVisible,
                selectedDiscussion: newSelected,
                metaMap: newMeta,
            };
        }),
}));