
export type UserRole = "USER" | "ADMIN";

export type TeamRole = "OWNER" | "ADMIN" | "MEMBER" | "AI" | "SYSTEM";
export const TeamRole = {
  OWNER: "OWNER" as TeamRole,
  ADMIN: "ADMIN" as TeamRole,
  MEMBER: "MEMBER" as TeamRole,
  AI: "AI" as TeamRole,
  SYSTEM: "SYSTEM" as TeamRole,
}
export type MemberStatus = "ACTIVE" | "LEFT" | "INVITED" | "BANNED";

export interface CurrentUser {
  id: string;
  name: string;
  avatar?: string;
  role: string; // Có thể dùng UserRole nếu muốn
}

export interface SearchUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  accounts: {
    providerId: string;
  }[]
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: Participant[]; // Dùng kiểu Participant chung
  createdAt: string;
  status: string;
}

/**
 * Đại diện cho một người tham gia/thành viên trong bất kỳ hệ thống nào.
 */
export interface Participant {
  _id?: string;
  id?: string;
  name: string;
  avatar?: string;
  role?: TeamRole;
  status?: MemberStatus;
}

export interface ParticipantTeam {
  id: string;
  userId: string;
  cachedUser: {
    name: string;
    email: string;
    avatar?: string
  };
  role: TeamRole;
  isActive: boolean;
  joinedAt: string;
}

/**
 * Kiểu trả về chung cho API có phân trang.
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit?: number;
  totalItems?: number;
  currentPage?: number;
}


export interface Attachment {
  url: string;
  type: string;
  fileName?: string;
}

export interface Reaction {
  userId: string;
  emoji: string;
}

export interface MessageData {
  _id: string;
  content: string;
  sender: Participant;
  createdAt: string;
  timestamp?: string;
  discussionId: string;
  teamId?: string;
  attachments?: Attachment[];
  reactions?: Reaction[];
  readBy?: { id: string, readAt: string }[];
  metadata?: any;
}

export interface TeamSnapshot {
  id: string;
  name: string;
  avatar?: string;
}

export interface Discussion {
  _id: string;
  latestMessage?: string;
  latestMessageSnapshot?: MessageData;
  participants: Participant[];
  isGroup?: boolean;
  name?: string;
  teamId?: string;
  isDeleted?: boolean;
  teamSnapshot?: TeamSnapshot;
  ownerId?: string;
  groupAdminIds?: string[];
}

interface SenderSnapshot {
  _id: string;
  name: string;
  avatar: string | null;
  status: string; // Hoặc một kiểu cụ thể hơn nếu bạn có, ví dụ: "ACTIVE" | "INACTIVE"
}

interface MessageSnapshot {
  _id: string;
  content: string;
  attachments: Attachment[]; // Hoặc 'any[]' / 'unknown[]' nếu bạn không chắc
  sender: SenderSnapshot;
  createdAt: string; // Kiểu string cho ISO Date
}

export interface MessageDocument {
  id: string;
  discussionId: string;
  team: TeamSnapshot;
  message: MessageSnapshot;
}

export interface SearchResponse<T> {
  hits: T[];
  totalHits: number;
  totalPages: number;
  currentPage: number;
}

export interface NewMessageEvent {
  _id: string;
  discussionId: string;
  message: MessageData;
  teamSnapshot?: TeamSnapshot;
  participants: Participant[];
  teamId?: string;
  latestMessageSnapshot?: MessageData
}

export interface AiNewMessageEvent {
  _id: string;
  message: MessageData;
  teamId: string;
}

export interface CreateTeam {
  id: string;
  name: string;
}


export enum FileStatus {
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCCESSED = 'processed',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELETED = 'deleted',
  PENDING = 'pending',
  UPDATING = 'updating',
}

export type KnowledgeFileResponse = {
  _id: string;
  originalName: string;
  type: string;
  status: FileStatus;
  createdAt: string;
}

export interface FileStatusEvent {
  id: string;
  status: FileStatus;
  name: string
}

// Định nghĩa tin nhắn AI
export type AiMessage = {
  _id: string;
  sender: Participant;
  role: TeamRole;
  content: string;
  discussionId?: string;
  teamId?: string;
  createdAt: string;
  metadata?: any;
};

export type KnowledgeFile = {
  id: string;
  name: string;
  type: "pdf" | "txt" | "other";
  status: FileStatus;
  createdAt: string;
  size: 0;
};

// Dùng Participant thay cho Member
export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: Participant[]; // Dùng kiểu Participant chung
  createdAt: string;
  status: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  avatar?: string;
  role: string; // Có thể dùng UserRole nếu muốn
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
  discussionId?: string;
  teamId?: string;
}

export interface SummarizeDocumentPayload {
  fileId: string;
  discussionId: string | null;
  teamId: string;
}

export interface ResponseStreamDto {
  socketId: string;
  content: string;
  type: "chunk" | "error" | "end";
  discussionId: string;
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
