// --- TYPE DEFINITIONS ---

// Định nghĩa tin nhắn AI
export type AiMessage = {
    _id: string; // Hoặc 'id'
    sender: Participant;
    role: "user" | "ai" | "error" | "system";
    content: string;
    conversationId?: string;
    timestamp: string; // Từ backend
    metadata?: any; // Cho RAG context/errors
};

// Định nghĩa file trong Knowledge Base
export type KnowledgeFile = {
    fileId: string;
    fileName: string;
    fileType: "pdf" | "txt" | "other";
};

type Member = {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
}

export interface Team {
    id: string;
    name: string;
    ownerId: string;
    members: Member[]
    createdAt: string;
    status: string;
}

export interface CurrentUser {
    id: string;
    name: string;
    avatar?: string;
    role: string;
}

// --- API Response Types ---
export interface AiHistoryResponse {
    data: {
        _id: string;
        title?: string;
        team_id?: string;
        user_id?: string;
        messages: AiMessage[];
    };
    page: number;
    limit: number;
    totalPages: number;
    totalMessage: number;
}

export interface FileListResponse extends Array<KnowledgeFile> { }

// --- SOCKET PAYLOADS ---
export interface AskQuestionPayload {
    question: string;
    conversationId: string | null;
    teamId: string;
}

export interface SummarizeDocumentPayload {
    fileName: string;
    conversationId: string | null;
    teamId: string;
}

export interface ResponseStreamDto {
    socketId: string;
    content: string;
    type: "chunk" | "error" | "end";
    conversationId: string;
    teamId: string;
    metadata?: any;
}

// --- CONSTANTS ---
export const NESTJS_GATEWAY_URL = "http://localhost:4001";
export const NESTJS_HTTP_URL = "http://localhost:3000";

export const CHATBOT_PATTERN = {
    ASK_QUESTION: "ask_question",
    SUMMARIZE_DOCUMENT: "summarize_document",
    CONVERSATION_STARTED: "conversation_started",
    RESPONSE_CHUNK: "chatbot.response_chunk",
    RESPONSE_ERROR: "chatbot.response_error",
    RESPONSE_END: "chatbot.response_end",
};

export interface User {
  id: string;
  name: string;
  avatar: string;
  providerId?: string;
  email?: string;
}

export type UserRole = "MEMBER" | "ADMIN" | "OWNER";

export interface Participant {
  _id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface MessageData {
  _id: string;
  content: string;
  sender: Participant;
  createdAt: string;
  conversationId: string;
  teamId?: string
}

export interface SearchResponse {
  hits: MessageData[];
  totalHits: number;
  totalPages: number;
  currentPage: number;
}

export interface ConversationMeta {
  _id: string;
  latestMessage?: MessageData;
}

export interface Conversation extends ConversationMeta {
  participants?: Participant[];
  isGroupChat: boolean;
  name?: string;
  teamId?: string
  avatar?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ChatState {
  selectedConversation: Conversation | null;
  messages: { [conversationId: string]: MessageData[] };
  messagePages: { [conversationId: string]: number };
  hasMoreMessages: { [conversationId: string]: boolean };

  visibleConversations: Conversation[];
  metaMap: { [conversationId: string]: ConversationMeta };
  currentPage: number;
  totalPages: number;
  isLoadingConversations: boolean;

  setSelectedConversation: (conv: Conversation | null) => void;
  appendMessage: (conversationId: string, message: MessageData) => void;
  prependMessages: (conversationId: string, messages: MessageData[]) => void;
  loadInitialConversations: () => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  upsertConversationMeta: (meta: ConversationMeta) => void;
  ensureConversationVisible: (
    conversationId: string,
    fetchIfMissing: (id: string) => Promise<Conversation | null>
  ) => Promise<void>;
  moveConversationToTop: (conversationId: string) => void;
  updateConversationInList: (updatedConversation: Team) => void;
  setMessagesForConversation: (
    conversationId: string,
    messages: MessageData[],
    page: number,
    hasMore: boolean
  ) => void;
  replaceTempMessage: (
    conversationId: string,
    tempId: string,
    finalMessage: MessageData
  ) => void;
  removeTempMessage: (conversationId: string, tempId: string) => void;
  setMessagePage: (conversationId: string, page: number) => void;
  setHasMoreMessages: (conversationId: string, hasMore: boolean) => void;
}

export interface CreateTeam {
  id: string;
  name: string;
}