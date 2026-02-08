import React from "react";
import { Icon } from "@iconify-icon/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface VoiceParticipant {
    userInfo: {
        id: string;
        name: string;
        avatar?: string;
    };
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
}

export const VoiceChannelArea: React.FC<VoiceChannelAreaProps> = ({
    selectedChannelName,
    onToggleMembers,
    showMembers,
    user,
    userId,
    voiceParticipants,
    remoteStreams,
    onLeaveVoice
}) => {
    return (
        <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
            {/* Header */}
            <div className="h-16 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-20 justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50">
                        <Icon icon="lucide:volume-2" className="text-emerald-500 dark:text-emerald-400" width="20" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">{selectedChannelName}</span>
                        <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Connected
                        </span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleMembers}
                    className={showMembers ? "text-blue-500 bg-blue-100 hover:bg-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"}
                >
                    <Icon icon="lucide:users" width="20" />
                </Button>
            </div>

            {/* Voice Area Grid */}
            <div className="flex-1 p-6 overflow-y-auto relative bg-zinc-50 dark:bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] dark:from-zinc-900/50 dark:via-zinc-950 dark:to-zinc-950 no-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-7xl mx-auto h-full content-center z-10 pb-24">
                    {/* User Card */}
                    <div className="relative group aspect-video rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 flex flex-col items-center justify-center shadow-2xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-all duration-300">

                        <Avatar className="h-24 w-24 ring-4 ring-white dark:ring-zinc-900/50 mb-4 shadow-xl group-hover:scale-105 transition-transform duration-300">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-bold">
                                {user?.name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                            <div className="bg-white/80 dark:bg-zinc-950/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-2">
                                <span className="text-zinc-900 dark:text-zinc-200 font-medium text-sm truncate max-w-[120px]">
                                    {user?.name || "You"}
                                </span>
                            </div>
                            <div className={`p-2 rounded-full backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500`}>
                                <Icon icon="lucide:mic" width="14" />
                            </div>
                        </div>

                        {/* Active Speaker Ring Aura */}
                        <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>

                    {/* Participants */}
                    {voiceParticipants
                        .filter((p) => p.userInfo?.id !== userId)
                        .map((p) => (
                            <div key={p.userInfo?.id} className="relative group aspect-video rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 flex flex-col items-center justify-center shadow-xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700/80 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-all duration-300">
                                <Avatar className="h-20 w-20 ring-4 ring-white dark:ring-zinc-900/50 mb-4 shadow-lg">
                                    <AvatarImage src={p.userInfo?.avatar} />
                                    <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium text-xl">
                                        {p.userInfo?.name?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                    <div className="bg-white/80 dark:bg-zinc-950/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-2">
                                        <span className="text-zinc-900 dark:text-zinc-200 font-medium text-sm truncate max-w-[120px]">
                                            {p.userInfo?.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-fit">
                <div className="flex items-center gap-2 bg-white/80 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/80 p-2.5 rounded-2xl shadow-2xl backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 mx-4">
                    <TooltipProvider delayDuration={0}>
                        <div className="flex items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all">
                                        <Icon icon="lucide:mic" width="22" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200">Mute Microphone</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all">
                                        <Icon icon="lucide:video-off" width="22" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200">Turn On Camera</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all">
                                        <Icon icon="lucide:monitor-up" width="22" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200">Share Screen</TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="w-[1px] h-8 bg-zinc-200 dark:bg-zinc-800 mx-1" />

                        <Button
                            onClick={onLeaveVoice}
                            variant="destructive"
                            className="h-12 px-6 rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all active:scale-95"
                        >
                            <Icon icon="lucide:phone-off" className="mr-2" width="20" />
                            Disconnect
                        </Button>
                    </TooltipProvider>
                </div>
            </div>

            {/* Audio Streams */}
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
