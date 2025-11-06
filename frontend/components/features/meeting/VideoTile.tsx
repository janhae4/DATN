'use client';

import { useRef, useEffect } from 'react';
import { VideoOff, MicOff } from 'lucide-react';

interface VideoTileProps {
  stream: MediaStream | null;
  name: string;
  isLocal?: boolean;
  isVideoMuted?: boolean;
  isAudioMuted?: boolean;
}

export function VideoTile({
  stream,
  name,
  isLocal = false,
  isVideoMuted = false,
  isAudioMuted = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Video play failed", e));
    }
  }, [stream]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-800">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Chỉ tắt tiếng video của chính mình
        className="h-full w-full object-cover"
      />
      {/* Hiển thị video bị tắt */}
      {isVideoMuted && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <VideoOff className="h-16 w-16 text-muted-foreground" />
        </div>
      )}

      {/* Tên người dùng */}
      <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-sm font-medium">
        {name}
      </div>

      {/* Biểu tượng tắt mic */}
      {isAudioMuted && (
        <div className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5">
          <MicOff className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}