import React, { useState } from "react";
import {
  X,
  Search,
  Mic,
  MicOff,
  Video,
  VideoOff,
  UserX,
  Shield,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Participant {
  id: string;
  name: string;
  isLocal: boolean;
  isMicOn?: boolean;
  isCamOn?: boolean;
}

interface ParticipantsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  peerNames: Map<string, string>;
  remoteStreams: Map<string, MediaStream>;
  peerCamStates: Map<string, boolean>;
  peerMuteStates: Map<string, boolean>;
  localState: {
    isMicOn: boolean;
    isCamOn: boolean;
  };
  myRole?: 'HOST' | 'ADMIN' | 'MEMBER' | 'BANNED';
  onKick?: (userId: string) => void;
  onMuteAudio?: (userId: string) => void;
  onMuteVideo?: (userId: string) => void;
}

export const ParticipantsPanel = ({
  isOpen,
  onClose,
  peerNames,
  remoteStreams,
  peerCamStates,
  localState,
  peerMuteStates,
  myRole,
  onKick,
  onMuteAudio,
  onMuteVideo,
}: ParticipantsPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const participants: Participant[] = [
    {
      id: "local",
      name: "You",
      isLocal: true,
      isMicOn: localState.isMicOn,
      isCamOn: localState.isCamOn,
    },
    ...Array.from(remoteStreams.keys()).map((id) => ({
      id,
      name: peerNames.get(id) || `User ${id.substr(0, 4)}`,
      isLocal: false,
      isMicOn: !(peerMuteStates.get(id) ?? false),
      isCamOn: peerCamStates.get(id) ?? true,
    })),
  ];

  const filteredParticipants = participants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full flex-shrink-0 bg-neutral-900/95 backdrop-blur-md border-l border-white/10 flex flex-col z-10 animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <h2 className="text-md font-semibold text-white">Participants</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full"
        >
          <X size={18} />
        </Button>
      </div>

      <div className="p-4 pb-2">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
            size={14}
          />
          <input
            type="text"
            placeholder="Search people..."
            className="w-full bg-neutral-800/50 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredParticipants.map((participant) => (
          <div
            key={participant.id}
            className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                {participant.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">
                  {participant.name}{" "}
                  {participant.isLocal && (
                    <span className="text-neutral-500 font-normal">(You)</span>
                  )}
                </span>
                {participant.isLocal && (
                  <span className="text-[10px] text-blue-400">Host</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={participant.isLocal || !(myRole === 'HOST' || myRole === 'ADMIN')}
                onClick={() => !participant.isLocal && onMuteAudio?.(participant.id)}
                className={`p-1.5 rounded-full transition-colors ${participant.isMicOn ? "text-neutral-400 hover:bg-white/10" : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  } ${participant.isLocal ? "opacity-50 cursor-not-allowed" : ""}`}
                title={participant.isMicOn ? "Mute participant" : "Already muted"}
              >
                {participant.isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
              </button>
              <button
                disabled={participant.isLocal || !(myRole === 'HOST' || myRole === 'ADMIN')}
                onClick={() => !participant.isLocal && onMuteVideo?.(participant.id)}
                className={`p-1.5 rounded-full transition-colors ${participant.isCamOn ? "text-neutral-400 hover:bg-white/10" : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  } ${participant.isLocal ? "opacity-50 cursor-not-allowed" : ""}`}
                title={participant.isCamOn ? "Turn off camera" : "Camera already off"}
              >
                {participant.isCamOn ? <Video size={14} /> : <VideoOff size={14} />}
              </button>
            </div>

            {/* Actions (Kick) */}
            {!participant.isLocal && (myRole === 'HOST' || myRole === 'ADMIN') && (
              <button
                onClick={() => onKick?.(participant.id)}
                className="p-1.5 rounded-full text-neutral-500 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                title="Kick participant"
              >
                <UserX size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="p-4">
        <Button className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 rounded-xl transition-all shadow-lg shadow-blue-900/20">
          Invite Someone
        </Button>
      </div>
    </div >
  );
};
