import { Card } from "@/components/ui/card";
import { useRef, useEffect } from "react";
import { Video, VideoOff } from "lucide-react";

interface VideoItemProps {
  stream: MediaStream;
  isLocal?: boolean;
  label: string;
  isCamOn?: boolean;
}

export const VideoItem = ({ stream, isLocal = false, label, isCamOn = true }: VideoItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Card className="relative overflow-hidden bg-neutral-800 border-0 group w-full h-full min-h-[200px]">
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          className={`w-full h-full object-cover ${isLocal ? 'transform scale-x-[-1]' : ''} ${!isCamOn ? 'opacity-0' : ''}`}
        />
        {!isCamOn && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="text-center p-4 rounded-full bg-black/50">
              <VideoOff className="w-12 h-12 text-white/70 mx-auto mb-2" />
            </div>
          </div>
        )}
      </div>
      <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-sm font-medium text-white backdrop-blur-sm">
        {label}
      </div>
    </Card>
  );
};
