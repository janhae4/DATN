import { RefType } from "@/app/video-call/page";
import {
  Discussion,
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
  MessageDocument,
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

  getDiscussionsPage: (
    chatMode: "team" | "ai" = "team",
    page = 1,
    limit = 8
  ): Promise<PaginatedResponse<Discussion>> =>
    ApiService.request(
      `/${
        chatMode === "team" ? "discussions" : "ai-discussions"
      }?page=${page}&limit=${limit}`
    ),

  getDiscussionById: (id: string): Promise<Discussion | null> =>
    ApiService.request(`/discussions/${id}`),

  getDiscussionByTeamId: (id: string): Promise<Discussion> =>
    ApiService.request(`/discussions/teams/${id}`),

  getMessages: (
    discussionId: string,
    page = 1,
    limit = 10,
    chatMode: "team" | "ai" = "team"
  ): Promise<PaginatedResponse<MessageData>> =>
    ApiService.request(
      `/${
        chatMode === "team" ? "discussions" : "ai-discussions"
      }/${discussionId}/messages?page=${page}&limit=${limit}`
    ),

  getTeamAiMessages: (
    teamId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<MessageData>> =>
    ApiService.request(
      `/ai-discussions/teams/${teamId}/messages?page=${page}&limit=${limit}`
    ),

  sendMessage: (
    discussionId: string,
    content: string
  ): Promise<NewMessageEvent> =>
    ApiService.request(`/discussions/${discussionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  createDirectChat: (partnerId: string): Promise<Discussion> =>
    ApiService.request("/discussions/direct", {
      method: "POST",
      body: JSON.stringify({ partnerId }),
    }),

  createTeam: (name: string, participantIds: string[]): Promise<CreateTeam> =>
    ApiService.request("/teams", {
      method: "POST",
      body: JSON.stringify({ name, memberIds: participantIds }),
    }),

  getMembers: (teamId: string): Promise<ParticipantTeam[]> =>
    ApiService.request(`/teams/${teamId}/members`),

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

  leaveDiscussion: (DiscussionId: string): Promise<void> =>
    ApiService.request(`teams/${DiscussionId}/leave`, {
      method: "POST",
    }),

  changeMemberRole: (
    DiscussionId: string,
    memberId: string,
    role: TeamRole = "MEMBER"
  ): Promise<Team> =>
    ApiService.request(`/teams/${DiscussionId}/member/${memberId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  transferOwnership: (
    DiscussionId: string,
    newOwnerId: string
  ): Promise<Team> =>
    ApiService.request(`/team/${DiscussionId}/member/transfer-ownership`, {
      method: "POST",
      body: JSON.stringify({ newOwnerId }),
    }),

  findByName: (
    query: string,
    page: number = 1,
    limit: number = 5,
    teamId?: string
  ): Promise<{ data: SearchUser[]; hasNextPage: boolean }> =>
    ApiService.request(
      `/user/search?query=${query}${
        teamId ? `&teamId=${teamId}` : ""
      }&page=${page}&limit=${limit}`
    ),

  searchMessages: (
    query: string,
    DiscussionId: string,
    page: number = 1,
    limit: number = 5
  ): Promise<SearchResponse<MessageDocument>> =>
    ApiService.request(
      `/discussions/${DiscussionId}/messages/search?query=${query}&page=${page}&limit=${limit}`
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
      `/files/${fileId}/rename${teamId ? `?teamId=${teamId}` : ""}`,
      {
        method: "PATCH",
        body: JSON.stringify({ newName }),
      }
    ),

  updateFileContent: (file: File, fileId: string) => {
    return ApiService.upload(`/files/${fileId}/content`, file, {
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

  getAiChatHistory: (page: number, limit: number = 8, teamId?: string) => {
    return ApiService.request(
      `/ai-discussions${
        teamId ? `/teams/${teamId}` : ""
      }?page=${page}&limit=${limit}`
    );
  },

  getKnowledgeFiles(teamId?: string, page?: number, limit?: number) {
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
      `/Discussions/${teamId ? `teams/${teamId}` : ""}`,
      {
        method: "POST",
        body: JSON.stringify({ message }),
      }
    );
  },

  joinVideoCall: (teamId: string, refId?: string, refType?: RefType) => {
    return ApiService.request(`/video-call/join`, {
      method: "POST",
      body: JSON.stringify({ teamId, refId, refType }),
    });
  },

  kickUserFromVideoCall: (targetUserId: string, roomId: string) => {
    return ApiService.request(`/video-call/kick`, {
      method: "POST",
      body: JSON.stringify({ targetUserId, roomId }),
    });
  },

  unKickUserFromVideoCall: (targetUserId: string, roomId: string) => {
    return ApiService.request(`/video-call/unkick`, {
      method: "POST",
      body: JSON.stringify({ targetUserId, roomId }),
    });
  },
};
