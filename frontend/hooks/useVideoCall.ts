// hooks/useVideoCall.ts
import { useState } from 'react';
import { videoChatService } from '@/services/videoChatService';
import { CreateCallPayload, KickUserPayload } from '@/types/video-chat';
import { toast } from 'sonner'; // Giả sử dùng sonner để thông báo

export const useVideoCall = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  // Hàm Join/Create Room
  const joinRoom = async (payload: CreateCallPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await videoChatService.createOrJoinCall(payload);
      
      setRoomId(data.roomId);
      
      if (data.action === 'CREATED') {
        toast.success(`Đã tạo phòng họp mới: ${data.roomId}`);
      } else {
        toast.info(`Đã tham gia phòng: ${data.roomId}`);
      }

      return data; // Trả về data để component xử lý tiếp (vd: redirect)
    } catch (err: any) {
      // Backend ném lỗi 403 Forbidden nếu user bị BANNED
      const message = err.response?.data?.message || 'Không thể tham gia cuộc gọi';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm Kick User
  const kickMember = async (payload: KickUserPayload) => {
    try {
      await videoChatService.kickUser(payload);
      toast.success('Đã đuổi thành viên khỏi phòng');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Lỗi khi kick thành viên';
      toast.error(message);
    }
  };

  return {
    joinRoom,
    kickMember,
    isLoading,
    error,
    roomId,
  };
};