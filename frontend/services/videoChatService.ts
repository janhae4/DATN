// services/videoChatService.ts
import apiClient from './apiClient';
import { CreateCallPayload, KickUserPayload, CallResponse } from '@/types/video-chat';

export const videoChatService = {
  // 1. Tạo hoặc tham gia phòng họp
  createOrJoinCall: async (payload: CreateCallPayload) => {
    const response = await apiClient.post('/video-call/join', payload);
    return response.data;
  },

  // 2. Lấy lịch sử cuộc gọi của User (Toàn bộ các phòng đã tham gia)
  getHistory: async () => {
    const response = await apiClient.get('/video-call/call-history');
    return response.data;
  },

  // 3. Lấy lịch sử cuộc gọi của Team (Phân trang)
  getTeamHistory: async (teamId: string, page: number = 1, limit: number = 10) => {
    const response = await apiClient.get(`/video-call/team/${teamId}/history`, {
      params: { page, limit }
    });
    return response.data;
  },

  getActionItems: async (callId: string, page: number = 1, limit: number = 10) => {
    const response = await apiClient.get(`/video-call/${callId}/action-items`, {
      params: { page, limit }
    });
    return response.data;
  },

  getRecordings: async (callId: string, page: number = 1, limit: number = 10) => {
    const response = await apiClient.get(`/video-call/${callId}/recordings`, {
      params: { page, limit }
    });
    return response.data;
  },

  getTranscripts: async (callId: string, page: number = 1, limit: number = 20) => {
    const response = await apiClient.get(`/video-call/${callId}/transcripts`, {
      params: { page, limit }
    });
    return response.data;
  },

  // 4. Kick thành viên (Chỉ Host/Admin)
  kickUser: async (payload: KickUserPayload) => {
    const response = await apiClient.post('/video-call/kick', payload);
    return response.data;
  },

  getCallInfo: async (roomId: string) => {
    const response = await apiClient.get<any>(`/video-call/${roomId}`);
    return response.data;
  },

  updateActionItem: async (itemId: string, data: any) => {
    const response = await apiClient.post(`/video-call/action-item/${itemId}`, data);
    return response.data;
  },

  deleteActionItem: async (itemId: string) => {
    const response = await apiClient.get(`/video-call/action-item/delete/${itemId}`);
    return response.data;
  },

  bulkUpdateActionItems: async (callId: string, status: string) => {
    const response = await apiClient.post(`/video-call/action-items/bulk-update`, { callId, status });
    return response.data;
  },

  bulkDeleteActionItems: async (callId: string) => {
    const response = await apiClient.post(`/video-call/action-items/bulk-delete`, { callId });
    return response.data;
  }
};