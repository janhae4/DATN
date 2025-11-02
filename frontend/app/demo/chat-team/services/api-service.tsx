import {
  Conversation,
  CreateTeam,
  CurrentUser,
  MessageData,
  PaginatedResponse,
  SearchResponse,
  UserRole,
  Team,
  NewMessageEvent,
  SearchUser,
  Participant,
  ParticipantTeam,
  TeamRole,
  MessageDocument
} from "../types/type";

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

  getInfo: (): Promise<CurrentUser> => ApiService.request("/auth/me"),

  logout: () => ApiService.request("/auth/logout", { method: "POST" }),

  getConversationsPage: (
    page = 1,
    limit = 8
  ): Promise<PaginatedResponse<Conversation>> =>
    ApiService.request(`/discussions?page=${page}&limit=${limit}`),

  getConversationById: (id: string): Promise<Conversation | null> =>
    ApiService.request(`/discussions/${id}`),

  getConversationByTeamId: (id: string): Promise<Conversation> =>
    ApiService.request(`/discussions/teams/${id}`),

  getMessages: (
    conversationId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<MessageData>> =>
    ApiService.request(
      `/discussions/${conversationId}/messages?page=${page}&limit=${limit}`
    ),

  sendMessage: (
    conversationId: string,
    content: string,
  ): Promise<NewMessageEvent> =>
    ApiService.request(`/discussions/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  createDirectChat: (partnerId: string): Promise<Conversation> =>
    ApiService.request("/discussions/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ partnerId }),
    }),

  createTeam: (
    name: string,
    participantIds: string[]
  ): Promise<CreateTeam> =>
    ApiService.request("/teams", {
      method: "POST",
      body: JSON.stringify({ name, memberIds: participantIds }),
    }),

  getMembers: (teamId: string): Promise<ParticipantTeam[]> => ApiService.request(`/teams/${teamId}/members`),

  addMembers: (teamId: string, participantIds: string[]): Promise<Team> =>
    ApiService.request(`/teams/${teamId}/member`, {
      method: "POST",
      body: JSON.stringify({ memberIds: participantIds }),
    }),

  removeMember: (teamId: string, memberId: string): Promise<Team> =>
    ApiService.request(`/teams/${teamId}/member`, {
      method: "DELETE",
      body: JSON.stringify({ memberIds: [memberId] }),
    }),

  deleteTeam: (teamId: string) =>
    ApiService.request(`/teams/${teamId}`, {
      method: "DELETE",
    }),

  leaveConversation: (conversationId: string): Promise<void> =>
    ApiService.request(`teams/${conversationId}/leave`, {
      method: "POST",
    }),

  changeMemberRole: (
    conversationId: string,
    memberId: string,
    role: TeamRole = "MEMBER"
  ): Promise<Team> =>
    ApiService.request(`/teams/${conversationId}/member/${memberId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  transferOwnership: (
    conversationId: string,
    newOwnerId: string
  ): Promise<Team> =>
    ApiService.request(`/team/${conversationId}/member/transfer-ownership`, {
      method: "POST",
      body: JSON.stringify({ newOwnerId }),
    }),

  findByName: (
    query: string,
    page: number = 1,
    limit: number = 5,
    teamId?: string,
  ): Promise<{ data: SearchUser[]; hasNextPage: boolean }> =>
    ApiService.request(
      `/user/search?query=${query}${teamId ? `&teamId=${teamId}` : ""}&page=${page}&limit=${limit}`
    ),

  searchMessages: (
    query: string,
    conversationId: string,
    page: number = 1,
    limit: number = 5
  ): Promise<SearchResponse<MessageDocument>> =>
    ApiService.request(
      `/discussions/${conversationId}/messages/search?query=${query}&page=${page}&limit=${limit}`
    ),

  getFilePreview: (
    fileId: string,
    teamId?: string
  ): Promise<{ viewUrl: string }> =>
    ApiService.request(
      `/files/${fileId}/preview${teamId ? `?teamId=${teamId}` : ""}`
    ),

  getFileDownload: (
    fileId: string,
    teamId?: string
  ): Promise<{ downloadUrl: string }> =>
    ApiService.request(
      `/files/${fileId}/download/${teamId ? `?teamId=${teamId}` : ""}`
    ),

  renameFile: (fileId: string, newName: string, teamId?: string) =>
    ApiService.request(
      `/discussionsbot/files/${fileId}/rename${teamId ? `?teamId=${teamId}` : ""}`,
      {
        method: "PATCH",
        body: JSON.stringify({ newName }),
      }
    ),

  updateFileContent: (file: File, fileId: string) => {
    return ApiService.upload(`/discussionsbot/files/${fileId}/content`, file, {
      method: "PATCH",
    });
  },

  initiateUpload: (
    fileName: string,
    teamId?: string
  ): Promise<{ uploadUrl: string; fileId: string }> => {
    return ApiService.request(
      `/files/initiate-upload${teamId ? `?teamId=${teamId}` : ""}`,
      {
        method: "POST",
        body: JSON.stringify({ fileName }),
      }
    );
  },

  getAiChatHistory: (page: number, limit: number, teamId?: string) => {
    return ApiService.request(
      `/discussionsbot/conversations/${
        teamId ? `teams/${teamId}` : ""
      }?page=${page}&limit=${limit}`
    );
  },

  getKnowledgeFiles(teamId?: string, page?: number, limit?: number) {
    console.log(teamId);
    return ApiService.request(
      `/files?${teamId ? `teamId=${teamId}&` : ""}page=${page}&limit=${limit}`
    );
  },

  uploadKnowledgeFile(file: File, teamId?: string) {
    return ApiService.upload(
      `/files${teamId ? `?teamId=${teamId}` : ""}`,
      file
    );
  },

  deleteKnowledgeFile(fileId: string, teamId?: string) {
    return ApiService.request(
      `/files/${fileId}${teamId ? `?teamId=${teamId}` : ""}`,
      {
        method: "DELETE",
      }
    );
  },

  sendTeamAiChatMessage: (message: string, teamId?: string) => {
    return ApiService.request(
      `/discussionsbot/conversations/${teamId ? `teams/${teamId}` : ""}`,
      {
        method: "POST",
        body: JSON.stringify({ message }),
      }
    );
  },
};
