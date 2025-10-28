// --- TYPE DEFINITIONS ---

// Interface cho Participant (matching your backend schema)
export interface Participant {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
}

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

// Định nghĩa prop User hiện tại
export interface CurrentUser {
    id: string;
    name: string;
    avatar?: string;
    // (Thêm các trường khác nếu cần)
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
