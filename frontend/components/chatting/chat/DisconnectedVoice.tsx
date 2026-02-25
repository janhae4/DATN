import React from "react";
import { Icon } from "@iconify-icon/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatHeader } from "./ChatHeader";

interface VoiceParticipant {
    userInfo: {
        id: string;
        name: string;
        avatar?: string;
    };
}

interface DisconnectedVoiceProps {
    selectedChannelName?: string;
    showMembers: boolean;
    onToggleMembers: () => void;
    onOpenMobileMenu?: () => void;
    voiceParticipants: VoiceParticipant[];
    selectedChannelId: string;
    onJoinVoice?: (channelId: string) => void;
}

export const DisconnectedVoice: React.FC<DisconnectedVoiceProps> = ({
    selectedChannelName,
    showMembers,
    onToggleMembers,
    onOpenMobileMenu,
    voiceParticipants,
    selectedChannelId,
    onJoinVoice
}) => {
    return (
        <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#09090b] relative overflow-hidden font-sans">
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.03]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            <ChatHeader
                selectedChannelName={selectedChannelName}
                showMembers={showMembers}
                onToggleMembers={onToggleMembers}
                onOpenMobileMenu={onOpenMobileMenu}
            />

            <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 relative z-20">
                <div className="w-full max-w-md bg-white dark:bg-[#18181b] rounded-2xl border border-zinc-200 dark:border-[#27272a] shadow-xl dark:shadow-black/20 p-8 flex flex-col items-center gap-6">

                    {/* Status Icon - Monochrome */}
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-2">
                            <Icon icon="lucide:mic-off" width="32" className="text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div className="absolute bottom-2 right-0 w-6 h-6 bg-white dark:bg-[#18181b] rounded-full flex items-center justify-center border border-zinc-100 dark:border-[#27272a]">
                            <div className="w-3 h-3 bg-zinc-400/50 dark:bg-zinc-600 rounded-full" />
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Disconnected</h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
                            You've left <span className="font-semibold text-zinc-700 dark:text-zinc-300">{selectedChannelName}</span>.
                            {voiceParticipants.length > 0 ? (
                                <span> Join back to talk with <span className="font-semibold text-zinc-900 dark:text-zinc-100">{voiceParticipants[0].userInfo.name}</span> {voiceParticipants.length > 1 && `and ${voiceParticipants.length - 1} others`}.</span>
                            ) : "The room is empty right now."}
                        </p>
                    </div>

                    {/* Active Participants Preview */}
                    {voiceParticipants.length > 0 && (
                        <div className="mt-2 text-center w-full">
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <div className="flex -space-x-3 hover:space-x-1 transition-all duration-300 p-2">
                                    {voiceParticipants.slice(0, 5).map((p, i) => (
                                        <div
                                            key={i}
                                            className="w-10 h-10 rounded-full border-2 border-white dark:border-[#18181b] bg-zinc-100 dark:bg-zinc-800 relative z-10 transition-transform hover:scale-110 hover:z-20 shadow-sm"
                                            title={p.userInfo.name}
                                        >
                                            <img
                                                src={p.userInfo.avatar || `https://avatar.vercel.sh/${p.userInfo.name}`}
                                                alt={p.userInfo.name}
                                                className="w-full h-full object-cover rounded-full"
                                            />
                                        </div>
                                    ))}
                                    {voiceParticipants.length > 5 && (
                                        <div className="w-10 h-10 rounded-full border-2 border-white dark:border-[#18181b] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 z-0">
                                            +{voiceParticipants.length - 5}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Live Indicator - Monochrome */}
                            <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/50 w-fit mx-auto border border-zinc-200 dark:border-zinc-700/50">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 dark:bg-zinc-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-900 dark:bg-zinc-100"></span>
                                </span>
                                <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">Live Now</span>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={() => selectedChannelId && onJoinVoice?.(selectedChannelId)}
                        className={cn(
                            "w-full h-11 mt-2 rounded-xl font-semibold tracking-wide transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                            "bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200",
                            "shadow-zinc-500/20 dark:shadow-black/40"
                        )}
                    >
                        <Icon icon="lucide:mic" width="18" className="mr-2" />
                        Rejoin Channel
                    </Button>
                </div>
            </main>
        </div>
    );
};
