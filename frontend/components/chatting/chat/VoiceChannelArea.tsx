import React, { useEffect, useState } from "react";
import { Icon } from "@iconify-icon/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserCard } from "./voice-channel/UserCard";
import { ControlBtn } from "./voice-channel/ControlBtn";

// --- Types ---
interface VoiceParticipant {
    userInfo: {
        id: string;
        name: string;
        avatar?: string;
    };
    isSpeaking?: boolean;
}

interface CurrentUser {
    id: string;
    name: string;
    avatar?: string;
}

interface VoiceChannelAreaProps {
    selectedChannelName?: string;
    onToggleMembers: () => void;
    showMembers: boolean;
    user: CurrentUser | null | undefined;
    userId?: string;
    voiceParticipants: VoiceParticipant[];
    remoteStreams: Map<string, MediaStream>;
    onLeaveVoice: () => void;
    isMuted: boolean;
    isVideoOn: boolean;
    speakingUsers: Set<string>;
    onToggleMute: () => void;
    onToggleVideo: () => void;
}

// --- Main Component ---

export const VoiceChannelArea: React.FC<VoiceChannelAreaProps> = ({
    selectedChannelName,
    onToggleMembers,
    showMembers,
    user,
    userId, 
    voiceParticipants,
    remoteStreams,
    onLeaveVoice,
    isMuted,
    isVideoOn,
    speakingUsers,
    onToggleMute,
    onToggleVideo
}) => {
    return (
        <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#09090b] relative overflow-hidden font-sans">

            <div className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.03]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            <header className="h-16 flex items-center justify-between px-6 z-30 shrink-0 border-b border-zinc-200 dark:border-[#27272a] bg-white/95 dark:bg-[#09090b]/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#09090b]/60">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700/50">
                        <Icon icon="lucide:mic" width="16" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                            {selectedChannelName || "General Voice"}
                        </h2>
                        <div className="flex items-center gap-1.5 -mt-0.5">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Live Session</span>
                        </div>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    onClick={onToggleMembers}
                    className={cn(
                        "h-8 px-3 text-xs font-medium tracking-wide transition-colors rounded-lg border",
                        showMembers
                            ? "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                            : "bg-transparent text-zinc-500 border-transparent hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                    )}
                >
                    <Icon icon="lucide:users" width="14" className="mr-2" />
                    Participants <span className="ml-1.5 text-zinc-400 dark:text-zinc-500">{voiceParticipants.length + 1}</span>
                </Button>
            </header>

            {/* Grid Layout */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar relative z-20">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full max-w-[1800px] mx-auto pb-32">
                    {/* Me Card */}
                    <div className="aspect-[4/3] w-full">
                        <UserCard
                            name={user?.name || "Me"}
                            avatar={user?.avatar}
                            isMe={true}
                            isSpeaking={speakingUsers.has(userId || "")}
                        />
                    </div>

                    {/* Other Participants */}
                    {voiceParticipants
                        .filter((p) => p.userInfo?.id !== userId)
                        .map((p) => (
                            <div key={p.userInfo.id} className="aspect-[4/3] w-full">
                                <UserCard
                                    name={p.userInfo.name}
                                    avatar={p.userInfo.avatar}
                                    isSpeaking={speakingUsers.has(p.userInfo.id)}
                                />
                            </div>
                        ))}
                </div>
            </main>

            {/* Floating Control Dock */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-auto max-w-full px-4">
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a]  dark:shadow-black/50">
                    <div onClick={onToggleMute}>
                        <ControlBtn
                            icon={isMuted ? "lucide:mic-off" : "lucide:mic"}
                            tooltip={isMuted ? "Unmute" : "Mute"}
                            active={!isMuted}
                        />
                    </div>
                    <div onClick={onToggleVideo}>
                        <ControlBtn
                            icon={isVideoOn ? "lucide:video" : "lucide:video-off"}
                            tooltip={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
                            active={isVideoOn}
                        />
                    </div>
                    <ControlBtn icon="lucide:monitor-up" tooltip="Share Screen" active={false} />

                    <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-2" />

                    <Button
                        onClick={onLeaveVoice}
                        className="h-11 px-6 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 dark:border-red-500/20 transition-all font-semibold text-xs tracking-wide uppercase"
                    >
                        Disconnect
                    </Button>
                </div>
            </div>

            {/* Hidden Audio Elements */}
            {Array.from(remoteStreams.entries()).map(([socketId, stream]) => (
                <audio
                    key={socketId}
                    ref={(audio) => {
                        if (audio) {
                            audio.srcObject = stream;
                            audio.play().catch(e => console.error("Error playing audio:", e));
                        }
                    }}
                    autoPlay
                    playsInline
                />
            ))}
        </div>
    );
};