import React, { useRef, useState, useCallback, useMemo } from "react";
import { UserCard } from "./voice-channel/UserCard";
import { VoiceHeader } from "./voice-channel/VoiceHeader";
import { VoiceControlDock } from "./voice-channel/VoiceControlDock";
import { CaptionsOverlay } from "./voice-channel/CaptionsOverlay";
import { useLocalCC } from "./voice-channel/useLocalCC";
import { CaptionEntry } from "@/hooks/chat/useVoiceSocket";

// --- Types ---
interface VoiceParticipant {
    userInfo: {
        id: string;
        name: string;
        avatar?: string;
    };
    isSpeaking?: boolean;
    isMuted?: boolean;
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
    speakingUsers: Set<string>;
    onToggleMute: () => void;
    ccCaptions?: Map<string, CaptionEntry>;
    onEmitCCTranscript?: (text: string, isFinal: boolean) => void;
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
    speakingUsers,
    onToggleMute,
    ccCaptions,
    onEmitCCTranscript,
}) => {
    const [isCCOn, setIsCCOn] = useState(false);

    // Local caption preview + broadcast
    const [localCaption, setLocalCaption] = useState<CaptionEntry | null>(null);
    const localTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleLocalTranscript = useCallback((text: string, isFinal: boolean) => {
        setLocalCaption({
            userId: userId || "me",
            name: user?.name || "Me",
            text,
            isFinal,
            timestamp: Date.now(),
        });
        if (isFinal) {
            if (localTimeoutRef.current) clearTimeout(localTimeoutRef.current);
            localTimeoutRef.current = setTimeout(() => setLocalCaption(null), 5000);
        }
        onEmitCCTranscript?.(text, isFinal);
    }, [onEmitCCTranscript, userId, user]);

    useLocalCC(isCCOn, handleLocalTranscript);

    const allCaptions = useMemo(() => {
        const merged = new Map(ccCaptions ?? []);
        if (localCaption) merged.set(localCaption.userId, localCaption);
        return merged;
    }, [ccCaptions, localCaption]);

    return (
        <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#09090b] relative overflow-hidden font-sans">

            <div className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.03]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            <VoiceHeader
                channelName={selectedChannelName}
                isCCOn={isCCOn}
                participantCount={voiceParticipants.length + 1}
                showMembers={showMembers}
                onToggleMembers={onToggleMembers}
            />

            {/* Participant grid */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar relative z-20">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full max-w-[1800px] mx-auto pb-32">
                    <div className="aspect-[4/3] w-full">
                        <UserCard
                            name={user?.name || "Me"}
                            avatar={user?.avatar}
                            isMe={true}
                            isSpeaking={speakingUsers.has(userId || "")}
                            isMuted={isMuted}
                        />
                    </div>
                    {voiceParticipants
                        .filter((p) => p.userInfo?.id !== userId)
                        .map((p) => (
                            <div key={p.userInfo.id} className="aspect-[4/3] w-full">
                                <UserCard
                                    name={p.userInfo.name}
                                    avatar={p.userInfo.avatar}
                                    isSpeaking={speakingUsers.has(p.userInfo.id)}
                                    isMuted={p.isMuted}
                                />
                            </div>
                        ))}
                </div>
            </main>

            <CaptionsOverlay captions={allCaptions} visible={isCCOn} />

            <VoiceControlDock
                isMuted={isMuted}
                isCCOn={isCCOn}
                onToggleMute={onToggleMute}
                onToggleCC={() => setIsCCOn((p) => !p)}
                onLeaveVoice={onLeaveVoice}
            />

            {Array.from(remoteStreams.entries()).map(([socketId, stream]) => (
                <audio
                    key={socketId}
                    ref={(audio) => {
                        if (audio) {
                            audio.srcObject = stream;
                            audio.play().catch((e) => console.error("Error playing audio:", e));
                        }
                    }}
                    autoPlay
                    playsInline
                />
            ))}
        </div>
    );
};