import apiClient from './apiClient';
import {
  CreateDirectDiscussionDto as CreateDirectDto,
  CreateMessageDto,
  CreateChannelDto,
  CreateCategoryDto,
  ReorderChannelsDto,
  CreateServerDto
} from '@/types/discussion';

export const discussionService = {

  getMessages: async (discussionId: string, params: { page?: number; limit?: number }) => {
    const { data } = await apiClient.get(`/discussions/${discussionId}/messages`, { params });
    return data;
  },

  sendMessage: async (discussionId: string, payload: CreateMessageDto) => {
    if (payload.attachments && payload.attachments.length > 0) {
      const formData = new FormData();
      if (payload.content) formData.append('content', payload.content);
      if (payload.replyToId) formData.append('replyToId', payload.replyToId);
      if (payload.discussionId) formData.append('discussionId', payload.discussionId);
      if (payload.userId) formData.append('userId', payload.userId);
      if (payload.teamId) formData.append('teamId', payload.teamId);

      const { data } = await apiClient.post(`/discussions/${discussionId}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    }

    const { data } = await apiClient.post(`/discussions/${discussionId}/messages`, payload);
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

  getUserServers: async (userId: string) => {
    const { data } = await apiClient.get(`/discussions/servers/user/${userId}`);
    return data;
  },

  getServerChannels: async (teamId: string) => {
    const { data } = await apiClient.get(`/discussions/teams/${teamId}/channels`);
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

  updateServer: async (teamId: string, payload: { name?: string; avatar?: string }) => {
    const { data } = await apiClient.put(`/discussions/servers/${teamId}`, payload);
    return data;
  },

  deleteServer: async (teamId: string) => {
    const { data } = await apiClient.delete(`/discussions/servers/${teamId}`);
    return data;
  },

  permanentDeleteServer: async (teamId: string) => {
    const { data } = await apiClient.delete(`/discussions/servers/${teamId}/permanent`);
    return data;
  },

  getDeletedServers: async () => {
    const { data } = await apiClient.get('/discussions/servers/deleted/user');
    return data;
  },

  restoreServer: async (teamId: string) => {
    const { data } = await apiClient.put(`/discussions/servers/${teamId}/restore`);
    return data;
  },

  getServerMembers: async (teamId: string, page: number = 1, limit: number = 20) => {
    const { data } = await apiClient.get(`/discussions/servers/${teamId}/members`, {
      params: { page, limit }
    });
    return data;
  }
};