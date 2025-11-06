'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useVideoCall } from '@/hooks/useVideoCall';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Loader2,
  AlertTriangle,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users, // --- THÊM MỚI ---
  MessageSquare, // --- THÊM MỚI ---
  ScreenShare, // --- THÊM MỚI ---
} from 'lucide-react';
import { VideoTile } from '@/components/features/meeting/VideoTile'; 

export default function VideoCallPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const [roomExists, setRoomExists] = useState<boolean | null>(null);

  const {
    localStream,
    peers,
    isVideoMuted,
    toggleVideoMute,
    isAudioMuted,
    toggleAudioMute,
    isLoading,
  } = useVideoCall(roomId || '');

  // --- PHẦN LOGIC (useEffect, checkRoomExists) ---
  // (Giữ nguyên, không thay đổi)
  useEffect(() => {
    const checkRoomExists = async () => {
      if (!roomId) return;
      try {
        const response = await fetch(
          `http://localhost:3000/video-chat/call-history?roomId=${roomId}`
        );
        const callHistory = await response.json();
        setRoomExists(response.ok && callHistory && callHistory.length > 0);
      } catch (error) {
        console.error('Lỗi khi kiểm tra phòng:', error);
        setRoomExists(false);
      }
    };
    checkRoomExists();
  }, [roomId]);


  // --- UI Trạng thái Đang Tải (Loading) ---
  if (roomExists === null) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="mt-4 text-xl font-medium">Đang Kiểm Tra Phòng...</h1>
        <p className="text-muted-foreground">Vui lòng đợi trong giây lát.</p>
      </div>
    );
  }

  // --- UI Trạng thái Lỗi (Error) ---
  if (roomExists === false) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          {/* ... (Nội dung Card lỗi giữ nguyên) ... */}
        </Card>
      </div>
    );
  }

  // --- UI Trang Gọi Video Chính (Đã cập nhật) ---
  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative flex h-screen flex-col overflow-hidden bg-zinc-900 text-white">

        {/* Lưới video (Đã thay đổi) */}
        {/*
          Thay đổi 1: Thêm `overflow-y-auto` để cuộn khi có nhiều người
          Thay đổi 2: Thay `flex-wrap` bằng `grid` và `grid-cols-[repeat(auto-fit,minmax(350px,1fr))]`
          - `auto-fit`: Tự động vừa vặn số cột
          - `minmax(350px, 1fr)`: Mỗi cột rộng tối thiểu 350px, và
             có thể giãn ra (1fr) để lấp đầy không gian.
        */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(350px,1fr))]">
            {/* Video của bạn */}
            <VideoTile
              stream={localStream}
              name="You (Bạn)"
              isLocal={true}
              isVideoMuted={isVideoMuted || isLoading} 
              isAudioMuted={isAudioMuted}
            />

            {/* Video của Peers */}
            {Object.entries(peers).map(([peerId, stream]) => (
              <VideoTile
                key={peerId}
                stream={stream}
                name={`Peer ${peerId.substring(0, 6)}`}
              />
            ))}
          </div>
        </div>

        {/* Thanh điều khiển (Đã thay đổi) */}
        {/*
          Thay đổi 3: Bọc các nhóm nút bằng một `div` cha
          để căn chỉnh `justify-between`
        */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-between items-center">
          
          {/* Phần 1: Thông tin phòng (Bên trái) */}
          <div className="rounded-full bg-black/70 p-3 px-4 backdrop-blur-sm">
            <p className="text-sm font-medium">{roomId}</p>
          </div>

          {/* Phần 2: Nút điều khiển chính (Giữa) */}
          <div className="flex items-center gap-4 rounded-full bg-black/70 p-3 backdrop-blur-sm">
            {/* Nút Mic */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggleAudioMute}
                  disabled={isLoading}
                  variant={isAudioMuted ? 'destructive' : 'secondary'}
                  size="icon"
                  className="h-14 w-14 rounded-full"
                >
                  {isAudioMuted ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isAudioMuted ? 'Bật Mic' : 'Tắt Mic'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Nút Camera */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggleVideoMute}
                  disabled={isLoading}
                  variant={isVideoMuted ? 'destructive' : 'secondary'}
                  size="icon"
                  className="h-14 w-14 rounded-full"
                >
                  {isVideoMuted ? (
                    <VideoOff className="h-6 w-6" />
                  ) : (
                    <Video className="h-6 w-6" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isVideoMuted ? 'Bật Camera' : 'Tắt Camera'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Nút Kết thúc Cuộc gọi */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => router.push('/meeting')}
                  variant="destructive"
                  size="icon"
                  className="h-14 w-14 rounded-full"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Kết thúc cuộc gọi</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Phần 3: Nút chức năng phụ (Bên phải) */}
          <div className="flex items-center gap-2 rounded-full bg-black/70 p-3 backdrop-blur-sm">
            {/* Nút Người tham gia (Placeholder) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Users className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Người tham gia</p>
              </TooltipContent>
            </Tooltip>

            {/* Nút Chat (Placeholder) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Trò chuyện</p>
              </TooltipContent>
            </Tooltip>

            {/* Nút Chia sẻ (Placeholder) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <ScreenShare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Chia sẻ màn hình</p>
              </TooltipContent>
            </Tooltip>
          </div>

        </div>
      </div>
    </TooltipProvider>
  );
}