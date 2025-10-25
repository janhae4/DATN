const API_BASE_URL = "http://localhost:3000";

export const ApiService = {
  request: async (endpoint: string, options: RequestInit = {}) => {
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || "Something went wrong");
    }
    if (response.status === 204) return null;
    return response.json();
  },

  login: (username: string, password: string) =>
    ApiService.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getInfo: (): Promise<User> => ApiService.request("/auth/info"),

  logout: () => ApiService.request("/auth/logout", { method: "POST" }),

  getConversationsPage: (
    page = 1,
    limit = 8
  ): Promise<PaginatedResponse<Conversation>> =>
    ApiService.request(`/chat/conversations?page=${page}&limit=${limit}`),

  getConversationById: (
    id: string
  ): Promise<Conversation | null> => // Cho phép trả về null
    ApiService.request(`/chat/conversations/${id}`),

  // --- API Get Messages đã hỗ trợ page và limit ---
  getMessages: (
    conversationId: string,
    page = 1,
    limit = 20
  ): Promise<MessageData[]> => // Giảm limit xuống 20
    ApiService.request(
      `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    ),

  sendMessage: (
    conversationId: string,
    content: string
  ): Promise<MessageData> =>
    ApiService.request(`/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  createDirectChat: (partnerId: string): Promise<Conversation> =>
    ApiService.request("/chat/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ partnerId }),
    }),

  createTeam: (name: string, participantIds: string[]): Promise<Conversation> =>
    ApiService.request("/team", {
      method: "POST",
      body: JSON.stringify({ name, memberIds: participantIds }),
    }),

  addMembers: (
    conversationId: string,
    participantIds: string[]
  ): Promise<Conversation> =>
    ApiService.request(`/chat/conversations/${conversationId}/members`, {
      method: "POST",
      body: JSON.stringify({ memberIds: participantIds }),
    }),

  removeMember: (
    conversationId: string,
    memberId: string
  ): Promise<Conversation> =>
    ApiService.request(`/team/${conversationId}/member`, {
      // Giả sử endpoint team service
      method: "DELETE",
      body: JSON.stringify({ memberIds: [memberId] }),
    }),

  leaveConversation: (conversationId: string): Promise<void> =>
    ApiService.request(`/chat/conversations/${conversationId}/leave`, {
      method: "POST",
    }),

  changeMemberRole: (
    conversationId: string,
    memberId: string,
    role: UserRole // Đảm bảo UserRole được định nghĩa
  ): Promise<Conversation> =>
    ApiService.request(
      `/chat/conversations/${conversationId}/members/${memberId}/role`,
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }
    ),

  transferOwnership: (
    conversationId: string,
    newOwnerId: string
  ): Promise<Conversation> =>
    ApiService.request(`/team/${conversationId}/member/transfer-ownership`, {
      // Giả sử endpoint team service
      method: "POST",
      body: JSON.stringify({ newOwnerId }),
    }),

  findByName: (
    query: string,
    page: number = 1,
    limit: number = 5
  ): Promise<{ data: User[]; hasNextPage: boolean }> =>
    ApiService.request(`/user/find?query=${query}&page=${page}&limit=${limit}`),

  searchMessages: (
    query: string,
    conversationId: string,
    page: number = 1,
    limit: number = 5
  ): Promise<SearchResponse> =>
    ApiService.request(
      `/chat/conversations/${conversationId}/messages/search?query=${query}&page=${page}&limit=${limit}`
    ),
};
