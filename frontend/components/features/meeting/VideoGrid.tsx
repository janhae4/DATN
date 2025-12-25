import React from 'react';
import { VideoItem } from './VideoItem';

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  peerNames: Map<string, string>;
  isMicOn: boolean;
  isCamOn: boolean;
  peerCamStates?: Map<string, boolean>; // Track camera states for remote participants
}

export const VideoGrid = ({ 
  localStream, 
  remoteStreams, 
  peerNames, 
  isMicOn, 
  isCamOn,
  peerCamStates = new Map() // Default to empty map if not provided
}: VideoGridProps) => {
  const totalParticipants = (localStream ? 1 : 0) + (remoteStreams?.size || 0);

  // 2. Logic chia cột động (Dynamic Grid Layout)
  const getGridClassName = () => {
    if (totalParticipants <= 1) return 'grid-cols-1'; // 1 người: Full màn hình
    if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2'; // 2 người: Chia đôi
    if (totalParticipants <= 4) return 'grid-cols-1 md:grid-cols-2'; // 3-4 người: 2x2
    if (totalParticipants <= 9) return 'grid-cols-2 md:grid-cols-3'; // 5-9 người: 3x3
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'; // >9 người: 4x4
  };

  return (
    <div className={`flex-1 grid gap-4 p-4 auto-rows-fr h-full ${getGridClassName()}`}>
      
      {/* Local Video */}
      {localStream && (
        <VideoItem 
          stream={localStream} 
          isLocal={true} 
          label={`You ${isMicOn ? '' : '(Muted)'}`}
          isCamOn={isCamOn}
        />
      )}

      {/* Remote Videos */}
      {/* Sử dụng Array.from để convert Map -> Array an toàn */}
      {Array.from(remoteStreams.entries()).map(([userId, stream]) => {
        const displayName = peerNames.get(userId) || `User ${userId.slice(0, 4)}`;
        
        return (
          <VideoItem 
            key={userId} 
            stream={stream} 
            label={displayName}
            isCamOn={peerCamStates.get(userId) ?? true} // Default to true if state not found
          />
        );
      })}
    </div>
  );
};