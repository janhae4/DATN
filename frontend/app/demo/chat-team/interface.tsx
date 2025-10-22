type UserRole = "OWNER" | "ADMIN" | "MEMBER";

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface Participant {
  _id: string;
  name: string;
  avatar?: string;
  role?: UserRole;
}

interface MessageData {
  _id: string;
  content: string;
  sender: Participant;
  createdAt: string;
  conversationId: string;
}
interface ConversationMeta {
  _id: string;
  latestMessage?: MessageData;
}

interface Conversation extends ConversationMeta {
  participants?: Participant[];
  isGroupChat: boolean;
  name?: string;
  avatar?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  // Hoặc bạn có thể dùng hasMore: boolean
}

interface ChatState {
  // === Trạng thái chung ===
  selectedConversation: Conversation | null;
  messages: { [conversationId: string]: MessageData[] }; // Map tin nhắn theo conversationId
  messagePages: { [conversationId: string]: number }; // Trang hiện tại của tin nhắn cho mỗi convo
  hasMoreMessages: { [conversationId: string]: boolean }; // Còn tin nhắn cũ hơn không

  // === Trạng thái cho Infinite Scroll ===
  visibleConversations: Conversation[]; // Danh sách conversation đã load đầy đủ
  metaMap: { [conversationId: string]: ConversationMeta }; // Lưu metadata, kể cả convo chưa load
  currentPage: number;
  totalPages: number;
  isLoadingConversations: boolean;

  // === Actions ===
  setSelectedConversation: (conv: Conversation | null) => void;
  appendMessage: (conversationId: string, message: MessageData) => void;
  prependMessages: (conversationId: string, messages: MessageData[]) => void; // Action thêm tin nhắn cũ
  loadInitialConversations: () => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  upsertConversationMeta: (meta: ConversationMeta) => void;
  ensureConversationVisible: (
    conversationId: string,
    fetchIfMissing: (id: string) => Promise<Conversation | null>
  ) => Promise<void>;
  moveConversationToTop: (conversationId: string) => void;
  updateConversationInList: (updatedConversation: Conversation) => void;
  setMessagesForConversation: (
    conversationId: string,
    messages: MessageData[],
    page: number,
    hasMore: boolean
  ) => void; // Cập nhật action này
  replaceTempMessage: (
    conversationId: string,
    tempId: string,
    finalMessage: MessageData
  ) => void;
  removeTempMessage: (conversationId: string, tempId: string) => void;
  setMessagePage: (conversationId: string, page: number) => void; // Action set page
  setHasMoreMessages: (conversationId: string, hasMore: boolean) => void; // Action set hasMore
}
