import React from "react";
import { Button } from "@/components/ui/button";
import { ControlBtn } from "./ControlBtn";
import { getSpeechRecognition } from "./useLocalCC";

interface VoiceControlDockProps {
    isMuted: boolean;
    isCCOn: boolean;
    onToggleMute: () => void;
    onToggleCC: () => void;
    onLeaveVoice: () => void;
}

export const VoiceControlDock: React.FC<VoiceControlDockProps> = ({
    isMuted,
    isCCOn,
    onToggleMute,
    onToggleCC,
    onLeaveVoice,
}) => {
    const isCCSupported = !!getSpeechRecognition();

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-auto max-w-full px-4">
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] dark:shadow-black/50">
                {/* Mute */}
                <div onClick={onToggleMute}>
                    <ControlBtn
                        icon={isMuted ? "lucide:mic-off" : "lucide:mic"}
                        tooltip={isMuted ? "Unmute" : "Mute"}
                        active={!isMuted}
                    />
                </div>

                {/* Closed Captions */}
                <div
                    onClick={() => { if (isCCSupported) onToggleCC(); }}
                    title={!isCCSupported ? "Captions not supported in this browser" : undefined}
                >
                    <ControlBtn
                        icon={isCCOn ? "lucide:captions" : "lucide:captions-off"}
                        tooltip={
                            !isCCSupported
                                ? "Captions not supported"
                                : isCCOn
                                    ? "Turn Captions Off"
                                    : "Turn Captions On"
                        }
                        active={isCCOn}
                    />
                </div>

                <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-2" />

                {/* Disconnect */}
                <Button
                    onClick={onLeaveVoice}
                    className="h-11 px-6 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 dark:border-red-500/20 transition-all font-semibold text-xs tracking-wide uppercase"
                >
                    Disconnect
                </Button>
            </div>
        </div>
    );
};
