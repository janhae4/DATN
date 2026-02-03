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
        <div className="flex-1 flex flex-col bg-zinc-950 relative overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-zinc-800 flex items-center px-6 bg-zinc-950/80 backdrop-blur-md z-10 justify-between">
                <div className="flex items-center gap-2">
                    <Icon icon="lucide:volume-2" className="text-zinc-400" width="20" />
                    <span className="font-semibold text-zinc-100">{selectedChannelName}</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleMembers}
                    className={showMembers ? "text-blue-400 bg-blue-400/10" : "text-zinc-400 hover:text-zinc-100"}
                >
                    <Icon icon="lucide:users" width="20" />
                </Button>
            </div>

            {/* Voice Area */}
            <div className="flex-1 p-6 relative flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl z-10">
                    {/* User Card */}
                    <div className="relative group aspect-video rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center shadow-2xl overflow-hidden hover:border-zinc-700 transition-all">
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Avatar className="h-20 w-20 ring-4 ring-zinc-950 mb-3 shadow-lg">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                                {user?.name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-zinc-100 flex items-center gap-2">
                            {user?.name || "You"}
                            <span className="flex h-2 w-2 rounded-full bg-green-500 box-content border border-zinc-900" />
                        </div>
                        <div className="absolute bottom-3 right-3 flex gap-1">
                            <div className="bg-zinc-950/80 p-1.5 rounded-md text-zinc-400 backdrop-blur-sm border border-zinc-800">
                                <Icon icon="lucide:mic" width="14" />
                            </div>
                        </div>
                    </div>

                    {/* Participants */}
                    {voiceParticipants
                        .filter((p) => p.userInfo?.id !== userId)
                        .map((p) => (
                            <div key={p.userInfo?.id} className="relative aspect-video rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center shadow-lg">
                                <Avatar className="h-16 w-16 mb-2">
                                    <AvatarImage src={p.userInfo?.avatar} />
                                    <AvatarFallback className="bg-zinc-700 text-zinc-300">
                                        {p.userInfo?.name?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-zinc-300 font-medium text-sm">{p.userInfo?.name}</span>
                            </div>
                        ))}
                </div>

                {/* Controls */}
                <div className="absolute bottom-8 flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 p-2 rounded-2xl shadow-2xl backdrop-blur-xl z-20">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800">
                                    <Icon icon="lucide:mic" width="24" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Mute Microphone</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800">
                                    <Icon icon="lucide:video-off" width="24" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Turn On Camera</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800">
                                    <Icon icon="lucide:monitor-up" width="24" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Share Screen</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Separator orientation="vertical" className="h-8 bg-zinc-700/50 mx-1" />

                    <Button
                        onClick={onLeaveVoice}
                        variant="destructive"
                        className="h-12 px-6 rounded-xl font-semibold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all"
                    >
                        <Icon icon="lucide:phone-off" className="mr-2" width="20" />
                        Disconnect
                    </Button>
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
        </div>
    );
};
