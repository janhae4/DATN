import React, { useEffect, useState } from "react";
import { Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MeetingHeaderProps {
  roomId: string;
  participantCount: number;
  startTime?: Date;
  isRoomRecording?: boolean; // shows red dot next to participant count
  onToggleParticipants: () => void;
}

export const MeetingHeader = ({
  roomId,
  participantCount,
  isRoomRecording,
  startTime: initialStartTime,
  onToggleParticipants,
}: MeetingHeaderProps) => {
  const [startTime] = useState(initialStartTime || new Date());
  const [duration, setDuration] = useState("00:00:00");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const h = Math.floor(diff / 3600000).toString().padStart(2, "0");
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
      setDuration(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <div className="w-full flex justify-between items-center px-6 py-4 bg-neutral-900/20 backdrop-blur-sm border-b border-white/5">
      {/* Left: room info */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-white/90 tracking-tight drop-shadow-sm flex items-center gap-2">
            Taskora Meeting <span className="text-white/60 font-normal">|</span>{" "}
            <span className="text-white/80 font-mono text-base">{roomId}</span>
          </h1>
          <div className="flex items-center gap-1.5 text-white/70 text-[15px] font-medium pl-0.5 mt-0.5">
            <Clock size={10} />
            <span>{duration}</span>
          </div>
        </div>
      </div>

      {/* Right: participant count + recording dot */}
      <Button
        className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/40 backdrop-blur-md rounded-full border border-white/5 shadow-sm hover:bg-neutral-900/60 transition-colors cursor-pointer group"
        onClick={onToggleParticipants}
      >
        <div className="p-1 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
          <Users size={14} className="text-white/80" />
        </div>
        <span className="text-xs font-medium text-white/80 pr-1">
          {participantCount}
        </span>

        {/* Red dot — shown when room is being recorded */}
        {isRoomRecording && (
          <span
            className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0"
            title="This meeting is being recorded"
          />
        )}
      </Button>
    </div>
  );
};
