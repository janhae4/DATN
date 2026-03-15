// app/teams/[teamId]/meeting/[roomId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { videoChatService } from "@/services/videoChatService";
import { ActiveMeetingRoom } from "@/components/features/meeting/ActiveMeetingRoom";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();

  const roomId = params.roomId as string;
  const [teamId, setTeamId] = useState<string>(params.teamId as string);

  const [status, setStatus] = useState<"checking" | "valid" | "invalid">(
    "checking",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [roomInfo, setRoomInfo] = useState<any>(null);

  useEffect(() => {
    const verifyRoom = async () => {
      if (!roomId) return;

      try {
        const info = await videoChatService.getCallInfo(roomId);
        if (info) {
          if (info.endedAt) {
            setStatus("invalid");
            setErrorMessage("This meeting has already ended.");
            return;
          }
          setRoomInfo(info);
          if (info.teamId) setTeamId(info.teamId);
          setStatus("valid");
        } else {
          setStatus("invalid");
          setErrorMessage("This meeting room does not exist or has already ended.");
        }
      } catch (error) {
        console.error("Check room error:", error);
        setStatus("invalid");
        setErrorMessage("Unable to connect to this meeting room.");
      }
    };

    verifyRoom();
  }, [roomId]);

  if (status === "checking") {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-950 text-white relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl opacity-20 animate-pulse" />

        <div className="z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 relative z-10" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-500/30 animate-ping" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-medium tracking-wide">Connecting...</h3>
            <p className="text-sm text-neutral-400">Verifying room details</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-950 p-4 relative">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />

        <div className="z-10 w-full max-w-md animate-in fade-in zoom-in duration-300">
          <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>

            <h2 className="text-2xl font-semibold text-white mb-2">
              Unable to Join
            </h2>
            <p className="text-neutral-400 mb-8 leading-relaxed">
              {errorMessage ||
                "The meeting ID is invalid, or the session has already ended."}
            </p>

            <Button
              onClick={() => router.back()}
              className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 
                         bg-white text-neutral-950 font-semibold rounded-xl 
                         hover:bg-neutral-200 transition-all duration-200 active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Return to Team Dashboard
            </Button>
          </div>

          {/* Footer Help Text */}
          <p className="mt-8 text-center text-xs text-neutral-600 uppercase tracking-widest">
            Video Meeting Service
          </p>
        </div>
      </div>
    );
  }

  return <ActiveMeetingRoom roomId={roomId} teamId={teamId || roomInfo?.teamId} initialRoomInfo={roomInfo} />;
}
