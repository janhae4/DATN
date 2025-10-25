type UserRole = "OWNER" | "ADMIN" | "MEMBER";

interface User {
  id: string;
  name: string;
  avatar: string;
  providerId?: string;
  email?: string;
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

interface SearchResponse {
  hits: MessageData[];
  totalHits: number;
  totalPages: number;
  currentPage: number;
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
}

interface ChatState {
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
  updateConversationInList: (updatedConversation: Conversation) => void;
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
