import React from "react";
import { VideoItem } from "./VideoItem";

interface VideoGridProps {
  localStream: MediaStream | null;
  localScreenStream?: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  remoteScreenStreams?: Map<string, MediaStream>;
  peerNames: Map<string, string>;
  isMicOn: boolean;
  isCamOn: boolean;
  isScreenSharing?: boolean;
  peerCamStates?: Map<string, boolean>;
  activeSpeakerId?: string | null;
  currentUserId?: string;
  peerMuteStates?: Map<string, boolean>;
  remoteTracks?: Map<string, any[]>;
  remoteScreenTracks?: Map<string, any[]>;
  myRole?: 'HOST' | 'ADMIN' | 'MEMBER' | 'BANNED';
  onKick?: (userId: string) => void;
  onMuteAudio?: (userId: string) => void;
  onMuteVideo?: (userId: string) => void;
}

export const VideoGrid = ({
  localStream,
  localScreenStream,
  remoteStreams,
  remoteScreenStreams = new Map(),
  peerNames,
  isMicOn,
  isCamOn,
  peerCamStates = new Map(),
  isScreenSharing = false,
  peerMuteStates = new Map(),
  remoteTracks = new Map(),
  remoteScreenTracks = new Map(),
  activeSpeakerId = null,
  myRole,
  onKick,
  onMuteAudio,
  onMuteVideo,
  currentUserId,
}: VideoGridProps) => {
  const totalParticipants =
    (localStream ? 1 : 0) +
    (localScreenStream ? 1 : 0) +
    (remoteStreams?.size || 0) +
    (remoteScreenStreams?.size || 0);

  const getGridClassName = () => {
    if (totalParticipants <= 1) return "grid-cols-1";
    if (totalParticipants === 2) return "grid-cols-1 md:grid-cols-2";
    if (totalParticipants <= 4) return "grid-cols-1 md:grid-cols-2";
    if (totalParticipants <= 9) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  return (
    <div
      className={`flex-1 grid gap-4 p-4 auto-rows-fr h-full ${getGridClassName()}`}
    >
      {localStream && (
        <VideoItem
          stream={localStream}
          isLocal={true}
          label={`You ${isMicOn ? "" : "(Muted)"} ${isScreenSharing ? "(Presenting)" : ""}`}
          isCamOn={isCamOn}
          isScreenSharing={isScreenSharing}
          isActiveSpeaker={activeSpeakerId === currentUserId}
          isMuted={!isMicOn}
        />
      )}

      {localScreenStream && (
        <VideoItem
          stream={localScreenStream}
          isLocal={true}
          label="Your Screen Share"
          isCamOn={true}
          isScreenSharing={true}
        />
      )}

      {Array.from(remoteStreams.entries()).map(([userId, stream]) => {
        const displayName =
          peerNames.get(userId) || `User ${userId.slice(0, 4)}`;

        return (
          <VideoItem
            key={userId}
            stream={stream}
            tracks={remoteTracks.get(userId)}
            label={displayName}
            isCamOn={peerCamStates.get(userId) ?? true}
            isLocal={false}
            isActiveSpeaker={activeSpeakerId === userId}
            isMuted={peerMuteStates.get(userId) ?? false}
            myRole={myRole}
            onKick={() => onKick?.(userId)}
            onMuteAudio={() => onMuteAudio?.(userId)}
            onMuteVideo={() => onMuteVideo?.(userId)}
          />
        );
      })}

      {Array.from(remoteScreenStreams.entries()).map(([userId, stream]) => {
        const displayName = peerNames.get(userId) || `User ${userId.slice(0, 4)}`;
        return (
          <VideoItem
            key={`${userId}-screen`}
            stream={stream}
            tracks={remoteScreenTracks.get(userId)}
            label={`${displayName}'s Screen`}
            isCamOn={true}
            isLocal={false}
            isScreenSharing={true}
            isMuted={true} // Screen shares usually muted
          />
        );
      })}
    </div>
  );
};
