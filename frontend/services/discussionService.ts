import apiClient from './apiClient';
import {
  CreateDirectDiscussionDto as CreateDirectDto,
  CreateMessageDto,
  CreateChannelDto,
  CreateCategoryDto,
  ReorderChannelsDto,
  CreateServerDto,
  ServerDto,
  DiscussionDto,
  ResponseMessageDto,
  MessageSnapshot,
  ServerMemberDto,
  PaginatedResponse,
  AttachmentDto
} from '@/types/discussion';

export const discussionService = {

  getMessages: async (discussionId: string, params: { page?: number; limit?: number }): Promise<ResponseMessageDto> => {
    const { data } = await apiClient.get<ResponseMessageDto>(`/discussions/${discussionId}/messages`, { params });
    return data;
  },

  getDiscussionAttachments: async (discussionId: string, params: { page?: number; limit?: number }): Promise<PaginatedResponse<AttachmentDto>> => {
    const { data } = await apiClient.get<PaginatedResponse<AttachmentDto>>(`/discussions/${discussionId}/attachments`, { params });
    return data;
  },

  sendMessage: async (discussionId: string, payload: CreateMessageDto) => {
    const { data } = await apiClient.post(`/discussions/${discussionId}/messages`, payload);
    return data;
  },

  updateMessage: async (discussionId: string, messageId: string, content: string, attachments?: AttachmentDto[]): Promise<MessageSnapshot> => {
    const payload: Partial<CreateMessageDto> = { content };
    if (attachments) payload.attachments = attachments;
    const { data } = await apiClient.put<MessageSnapshot>(`/discussions/${discussionId}/messages/${messageId}`, payload);
    return data;
  },

  deleteMessage: async (discussionId: string, messageId: string) => {
    const { data } = await apiClient.delete(`/discussions/${discussionId}/messages/${messageId}`);
    return data;
  },

  createDirectDiscussion: async (payload: CreateDirectDto) => {
    const { data } = await apiClient.post('/discussions/direct', payload);
    return data;
  },

  markAsRead: async (discussionId: string) => {
    return true;
  },

  toggleReaction: async (discussionId: string, messageId: string, emoji: string) => {
    const { data } = await apiClient.put(`/discussions/${discussionId}/messages/${messageId}/reactions`, { emoji });
    return data;
  },

  getDiscussionsForUser: async (page = 1, limit = 20): Promise<PaginatedResponse<DiscussionDto>> => {
    const { data } = await apiClient.get<PaginatedResponse<DiscussionDto>>('/discussions', {
      params: { page, limit }
    });
    return data;
  },

  getUserServers: async (userId: string, teamId?: string) => {
    const { data } = await apiClient.get(`/discussions/servers/user/${userId}`, {
      params: { teamId }
    });
    return data;
  },

  getServerChannels: async (teamId: string): Promise<DiscussionDto[]> => {
    const { data } = await apiClient.get<DiscussionDto[]>(`/discussions/teams/${teamId}/channels`);
    return data;
  },

  getServerChannelsByServer: async (serverId: string): Promise<DiscussionDto[]> => {
    const { data } = await apiClient.get<DiscussionDto[]>(`/discussions/servers/${serverId}/channels`);
    return data;
  },

  createServer: async (payload: CreateServerDto) => {
    console.log('Creating server with payload in service:', payload);
    const { data } = await apiClient.post('/discussions/servers', payload);
    return data;
  },

  createChannel: async (payload: CreateChannelDto) => {
    console.log('Creating channel with payload:', payload);
    const { data } = await apiClient.post('/discussions/channels', payload);
    console.log('Channel created:', data);
    return data;
  },

  createCategory: async (payload: CreateCategoryDto) => {
    const { data } = await apiClient.post('/discussions/categories', payload);
    return data;
  },

  updateChannel: async (id: string, payload: { name: string }) => {
    const { data } = await apiClient.put(`/discussions/channels/${id}`, payload);
    return data;
  },

  deleteChannel: async (id: string) => {
    const { data } = await apiClient.delete(`/discussions/channels/${id}`);
    return data;
  },

  reorderChannels: async (payload: ReorderChannelsDto) => {
    const { data } = await apiClient.put('/discussions/channels/reorder', payload);
    return data;
  },

  generateInvite: async (payload: { teamId: string; discussionId: string; maxUses?: number }) => {
    const { data } = await apiClient.post('/discussions/invites', payload);
    return data;
  },

  joinServer: async (code: string) => {
    const { data } = await apiClient.post('/discussions/invites/join', { code });
    return data;
  },

  getInvite: async (code: string) => {
    const { data } = await apiClient.get(`/discussions/invites/${code}`);
    return data;
  },

  updateServer: async (serverId: string, payload: { name?: string; avatar?: string }) => {
    const { data } = await apiClient.put(`/discussions/servers/${serverId}`, payload);
    return data;
  },

  deleteServer: async (serverId: string) => {
    const { data } = await apiClient.delete(`/discussions/servers/${serverId}`);
    return data;
  },

  permanentDeleteServer: async (serverId: string) => {
    const { data } = await apiClient.delete(`/discussions/servers/${serverId}/permanent`);
    return data;
  },

  getDeletedServers: async () => {
    const { data } = await apiClient.get('/discussions/servers/deleted/user');
    return data;
  },

  restoreServer: async (serverId: string) => {
    const { data } = await apiClient.put(`/discussions/servers/${serverId}/restore`);
    return data;
  },

  getServerMembers: async (serverId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<ServerMemberDto>> => {
    const { data } = await apiClient.get<PaginatedResponse<ServerMemberDto>>(`/discussions/servers/${serverId}/members`, {
      params: { page, limit }
    });
    return data;
  },

  getTeamMembers: async (teamId: string, page: number = 1, limit: number = 50): Promise<PaginatedResponse<ServerMemberDto>> => {
    const { data } = await apiClient.get<PaginatedResponse<ServerMemberDto>>(`/discussions/teams/${teamId}/members`, {
      params: { page, limit }
    });
    return data;
  },

  summarizeDiscussion: async (discussionId: string, limit: number = 50): Promise<{ summary: string }> => {
    const { data } = await apiClient.post<{ summary: string }>(`/discussions/${discussionId}/summarize`, {}, {
      params: { limit }
    });
    return data;
  },

};
