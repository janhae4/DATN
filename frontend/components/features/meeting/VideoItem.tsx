import { Card } from "@/components/ui/card";
import { useRef, useEffect, useState } from "react";
import { VideoOff, MicOff, UserX, Mic } from "lucide-react";

interface VideoItemProps {
  stream: MediaStream;
  tracks?: any[];
  isLocal?: boolean;
  label: string;
  isCamOn?: boolean;
  isScreenSharing?: boolean;
  isActiveSpeaker?: boolean;
  isMuted?: boolean;
  myRole?: 'HOST' | 'ADMIN' | 'MEMBER' | 'BANNED';
  onKick?: () => void;
  onMuteAudio?: () => void;
  onMuteVideo?: () => void;
}

const EMPTY_TRACKS: any[] = [];

export const VideoItem = ({
  stream,
  tracks = EMPTY_TRACKS,
  isLocal = false,
  label,
  isCamOn = true,
  isScreenSharing = false,
  isActiveSpeaker = false,
  isMuted = false,
  myRole,
  onKick,
  onMuteAudio,
  onMuteVideo,
}: VideoItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLocalMuted, setIsLocalMuted] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !stream) return;

    if (isLocal) {
      if (videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
        videoElement.play().catch((e) => console.error("Local play failed:", e));
      }
    } else if (tracks && tracks.length > 0) {
      // Prioritize LiveKit attach for remote tracks to enable Adaptive Stream (Quality Switching)
      // Note: LiveKit's attach is idempotent if the track is already attached
      tracks.forEach(track => {
        if (track && (track.kind === 'video' || track.kind === 'audio')) {
          track.attach(videoElement);
        }
      });
      return () => {
        tracks.forEach(track => track && track.detach(videoElement));
      };
    } else {
      // Fallback to srcObject if no tracks provided
      if (videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
        videoElement.play().catch((e) => console.error("Remote playback fallback failed:", e));
      }
    }
  }, [stream, tracks, isLocal]);

  const shouldMirror = isLocal && !isScreenSharing;
  const shouldShowVideo = isCamOn || isScreenSharing;

  return (
    <div className={`relative overflow-hidden bg-neutral-800 rounded-xl group w-full h-full min-h-[200px] transition-all duration-300 ${isActiveSpeaker ? "ring-4 ring-green-500 ring-offset-2 ring-offset-black" : ""
      }`}>
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal || isLocalMuted}
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-300
            ${shouldMirror ? "transform scale-x-[-1]" : ""} 
            ${!shouldShowVideo ? "opacity-0" : "opacity-100"}
          `}
        />

        {!shouldShowVideo && (
          <div className="absolute inset-0 z-10 bg-black flex items-center justify-center">
            <div className="text-center p-4 rounded-full bg-black/50">
              <VideoOff className="w-12 h-12 text-white/70 mx-auto mb-2" />
            </div>
          </div>
        )}

        {/* Label Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-black/50 px-2 py-1 rounded text-sm font-medium text-white backdrop-blur-sm flex items-center gap-2">
          <span>{label}</span>
          {isMuted && <MicOff className="w-4 h-4 text-red-500" />}
          {isLocalMuted && <span className="text-[10px] bg-red-500 px-1 rounded text-white font-bold ml-1">LOCAL MUTE</span>}
        </div>

        {/* Actions Overlay (visible on group hover) */}
        {!isLocal && (
          <div className="absolute top-4 right-4 z-50 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-[-10px] group-hover:translate-y-0" style={{ pointerEvents: 'auto' }}>

            {/* Common Action: Local Mute (For everyone) */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsLocalMuted(!isLocalMuted); }}
              className={`p-2 rounded-full border shadow-xl transition-all backdrop-blur-md ${isLocalMuted ? 'bg-red-500 text-white border-red-400' : 'bg-black/60 hover:bg-neutral-800 text-white border-white/10'}`}
              title={isLocalMuted ? "Unmute for me" : "Mute for me"}
            >
              {isLocalMuted ? <Mic size={16} /> : <MicOff size={16} />}
            </button>

            {/* Admin Actions (Remote) */}
            {(myRole === 'HOST' || myRole === 'ADMIN') && (
              <>
                <div className="w-px h-8 bg-white/10 mx-1" /> {/* Divider */}
                <button
                  onClick={(e) => { e.stopPropagation(); onMuteAudio?.(); }}
                  className="p-2 rounded-full bg-black/60 hover:bg-neutral-800 text-white backdrop-blur-md border border-white/10 shadow-xl transition-all"
                  title="Mute for everyone (Admin)"
                >
                  <MicOff size={16} className="text-red-400" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMuteVideo?.(); }}
                  className="p-2 rounded-full bg-black/60 hover:bg-neutral-800 text-white backdrop-blur-md border border-white/10 shadow-xl transition-all"
                  title="Turn off camera for everyone (Admin)"
                >
                  <VideoOff size={16} className="text-red-400" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onKick?.(); }}
                  className="p-2 rounded-full bg-red-500/80 hover:bg-red-600 text-white backdrop-blur-md border border-white/10 shadow-xl transition-all"
                  title="Kick from meeting (Admin)"
                >
                  <UserX size={16} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
