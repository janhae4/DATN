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

    return response.json();
  },

  requestFile: async (endpoint: string, options: RequestInit = {}) => {
    const config: RequestInit = {
      ...options,
      headers: {
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

    return response;
  },

  upload: async (endpoint: string, file: File, options: RequestInit = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    const config: RequestInit = {
      ...options,
      method: options.method || "POST",
      body: formData,
      headers: {
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
    ApiService.request("/auth/session", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getInfo: (): Promise<User> => ApiService.request("/auth/me"),

  logout: () => ApiService.request("/auth/logout", { method: "POST" }),

  getConversationsPage: (
    page = 1,
    limit = 8
  ): Promise<PaginatedResponse<Conversation>> =>
    ApiService.request(`/chat/conversations?page=${page}&limit=${limit}`),

  getConversationById: (id: string): Promise<Conversation | null> =>
    ApiService.request(`/chat/conversations/${id}`),

  getConversationByTeamId: (id: string): Promise<Conversation> =>
    ApiService.request(`/chat/conversations/teams/${id}`),

  getMessages: (
    conversationId: string,
    page = 1,
    limit = 20
  ): Promise<MessageData[]> =>
    ApiService.request(
      `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    ),

  sendMessage: (
    conversationId: string,
    content: string,
    teamId?: string
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

  createTeam: (
    name: string,
    participantIds: string[]
  ): Promise<CreateTeam & Conversation> =>
    ApiService.request("/team", {
      method: "POST",
      body: JSON.stringify({ name, memberIds: participantIds }),
    }),

  addMembers: (
    teamId: string,
    participantIds: string[]
  ): Promise<Conversation> =>
    ApiService.request(`/team/${teamId}/member`, {
      method: "POST",
      body: JSON.stringify({ memberIds: participantIds }),
    }),

  removeMember: (teamId: string, memberId: string): Promise<Conversation> =>
    ApiService.request(`/team/${teamId}/member`, {
      method: "DELETE",
      body: JSON.stringify({ memberIds: [memberId] }),
    }),

  deleteTeam: (teamId: string) =>
    ApiService.request(`/team/${teamId}`, {
      method: "DELETE",
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
    ApiService.request(
      `/user/search?query=${query}&page=${page}&limit=${limit}`
    ),

  searchMessages: (
    query: string,
    conversationId: string,
    page: number = 1,
    limit: number = 5
  ): Promise<SearchResponse> =>
    ApiService.request(
      `/chat/conversations/${conversationId}/messages/search?query=${query}&page=${page}&limit=${limit}`
    ),

  getFile: (fileId: string, teamId?: string) =>
    ApiService.requestFile(`/chatbot/files/${fileId}${teamId && `?teamId=${teamId}`}`),

  renameFile: (fileId: string, newName: string, teamId?: string) =>
    ApiService.request(`/chatbot/files/${fileId}/rename${teamId && `?teamId=${teamId}`}`, {
      method: "PATCH",
      body: JSON.stringify({ newName }),
    }),

  updateFileContent: (file: File, fileId: string) => {
    return ApiService.upload(`/chatbot/files/${fileId}/content`, file, {
      method: "PATCH",
    });
  },

  uploadNewFile: (file: File) => {
    return ApiService.upload("/chatbot/files", file);
  },

  getAiChatHistory: (teamId: string, page: number, limit: number) => {
    return ApiService.request(
      `/chatbot/conversations/teams/${teamId}?page=${page}&limit=${limit}`
    );
  },

  getKnowledgeFiles(teamId: string) {
    return ApiService.request(`/chatbot/files?teamId=${teamId}`);
  },

  uploadKnowledgeFile(teamId: string, file: File) {
    return ApiService.upload(`/chatbot/files?teamId=${teamId}`, file);
  },

  deleteKnowledgeFile(teamId: string, fileId: string) {
    return ApiService.request(`/chatbot/files/${fileId}?teamId=${teamId}`, {
      method: "DELETE",
    });
  },

  sendTeamAiChatMessage: (teamId: string, message: string) => {
    return ApiService.request(`/chatbot/conversations/teams/${teamId}`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },
};
