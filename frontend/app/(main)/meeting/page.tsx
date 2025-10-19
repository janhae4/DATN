'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Chỉ cần Input
import Image from 'next/image';
import { toast } from "sonner";
import { Loader2, Video, Link, ArrowRight } from 'lucide-react';

import meetingImage from '@/public/assets/meeting_resource/meeting.jpg';

export default function CreateVideoCallPage() {
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // --- TOÀN BỘ LOGIC HÀM (handleCreateRoom, handleJoinRoom, generateRoomId) ---
  // --- GIỮ NGUYÊN, KHÔNG THAY ĐỔI ---

  const generateRoomId = () => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

  const handleCreateRoom = async () => {
    setIsCreating(true);
    const newRoomId = generateRoomId();

    try {
      const response = await fetch(
        'http://localhost:3000/video-chat/create-call',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomId: newRoomId,
            participantIds: [],
          }),
        }
      );

      if (response.ok) {
        localStorage.setItem('createdRoomId', newRoomId);
        toast.success('Phòng đã được tạo!', {
          description: `Bạn đang được chuyển hướng đến: ${newRoomId}`,
        });
        router.push(`/meeting/${newRoomId}`);
      } else {
        toast.error('Lỗi', {
          description: 'Không thể tạo phòng. Vui lòng thử lại.',
        });
      }
    } catch (error) {
      console.error('Lỗi khi tạo phòng:', error);
      toast.error('Lỗi kết nối', {
        description: 'Vui lòng thử lại.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      toast.warning('Thông tin trống', {
        description: 'Vui lòng nhập ID hoặc link phòng.',
      });
      return;
    }

    let finalRoomId = roomId.trim();
    if (finalRoomId.startsWith('http://') || finalRoomId.startsWith('https://')) {
      try {
        const url = new URL(finalRoomId);
        finalRoomId = url.pathname.split('/').pop() || '';
        if (!finalRoomId) {
          toast.error('Link không hợp lệ', {
            description: 'Không thể trích xuất Room ID từ link.',
          });
          return;
        }
      } catch (e) {
        toast.error('Link không hợp lệ', {
          description: 'Vui lòng kiểm tra lại định dạng link.',
        });
        return;
      }
    }


    setIsCreating(true);
    try {
      const response = await fetch(
        `http://localhost:3000/video-chat/call-history?roomId=${finalRoomId}`,
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        const callHistory = await response.json();
        if (callHistory && callHistory.length > 0) {
          toast.info('Đang tham gia phòng...', {
            description: `Đang chuyển hướng đến: ${finalRoomId}`,
          });
          router.push(`/meeting/${finalRoomId}`);
        } else {
          toast.error('Không tìm thấy phòng', {
            description:
              'Phòng không tồn tại. Vui lòng kiểm tra ID hoặc link phòng.',
          });
        }
      } else {
        toast.error('Lỗi', {
          description: 'Không thể kiểm tra phòng. Vui lòng thử lại.',
        });
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra phòng:', error);
      toast.error('Lỗi kết nối', {
        description: 'Vui lòng thử lại.',
      });
    } finally {
      setIsCreating(false);
    }
  };


  return (
    <div className="flex items-center justify-center  bg-background">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl">

        <div className="w-full max-w-md">
          <Image
            src={meetingImage}
            alt="Meeting"
            width={400}
            height={400}
            className="w-full h-auto object-contain rounded-lg"
            priority
          />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Video Meeting
          </h1>
          <p className="text-muted-foreground max-w-md">
            Now available for everyone. Connect, collaborate, and celebrate
            from anywhere.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <Button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="px-6 py-3 text-base h-12 flex-grow sm:flex-grow-0"
          >
            {isCreating ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Video className="mr-2 h-5 w-5" />
            )}
            {isCreating ? 'Đang tạo...' : 'Bắt đầu cuộc họp'}
          </Button>

          <div className="relative flex-grow w-full">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />

            <Input
              type="text"
              placeholder="Nhập mã hoặc liên kết"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              disabled={isCreating}
              className="h-12 pl-10 pr-12 text-base"
            />

            {roomId.trim() && (
              <Button
                onClick={handleJoinRoom}
                disabled={isCreating}
                variant="ghost"
                size="icon"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}