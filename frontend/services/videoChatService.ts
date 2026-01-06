// services/videoChatService.ts
import apiClient from './apiClient';
import { CreateCallPayload, KickUserPayload, CallResponse } from '@/types/video-chat';

export const videoChatService = {
  // 1. Tạo hoặc tham gia phòng họp
  createOrJoinCall: async (payload: CreateCallPayload) => {
    const response = await apiClient.post('/video-call/join', payload);
    return response.data;
  },

  // 2. Lấy lịch sử cuộc gọi của User
  getHistory: async (userId: string) => {
    const response = await apiClient.get(`/video-call/history/user/${userId}`);
    return response.data;
  },

  // 3. Kick thành viên (Chỉ Host/Admin)
  kickUser: async (payload: KickUserPayload) => {
    const response = await apiClient.post('/video-call/kick', payload);
    return response.data;
  },

  sendTranscript: async (roomId: string, userId: string, content: string) => {
    const response = await apiClient.post('/video-call/transcript', {
      roomId, userId, content
    });
    return response.data;
  }
  ,
  getCallInfo: async (roomId: string) => {
    // API endpoint này trả về danh sách lịch sử cuộc gọi theo roomId
    const response = await apiClient.get<any[]>(`/video-call/call-history`);
    return response.data;
  }
};