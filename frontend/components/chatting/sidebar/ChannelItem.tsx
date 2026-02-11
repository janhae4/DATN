import React from "react";
import { Icon } from "@iconify-icon/react";
import { cn } from "@/lib/utils";
import { DiscussionDto, ServerMemberDto, VoiceParticipant } from "@/types";
import { VoiceUserItem } from "../chat/voice-channel/VoiceUserItem";

interface ChannelItemProps {
    channel: DiscussionDto;
    isNested?: boolean;
    selectedChannelId: string | null;
    onSelectChannel: (id: string) => void;
    onOpenSettings: (e: React.MouseEvent, channel: DiscussionDto) => void;
    voiceParticipants?: VoiceParticipant[];
    speakingUsers?: Set<string>;
}

export const ChannelItem = React.memo(({
    channel,
    isNested = false,
    selectedChannelId,
    onSelectChannel,
    onOpenSettings,
    voiceParticipants = [],
    speakingUsers = new Set()
}: ChannelItemProps) => {
    const isSelected = selectedChannelId === channel.id;
    const iconName = channel.type === "VOICE" ? "lucide:volume-2" : "lucide:hash";

    return (
        <div className={cn("group relative flex flex-col mb-0.5", isNested ? "ml-4 w-[calc(100%-16px)]" : "w-full")}>
            <div className="flex items-center relative">
                <button
                    onClick={() => onSelectChannel(channel.id)}
                    className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all duration-200 text-sm",
                        isSelected
                            ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                            : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium"
                    )}
                >
                    <Icon
                        icon={iconName}
                        width="16"
                        className={cn(
                            "shrink-0",
                            isSelected
                                ? "text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                        )}
                    />
                    <span className="truncate flex-1 text-left">{channel.name}</span>
                </button>

                <button
                    onClick={(e) => onOpenSettings(e, channel)}
                    className={cn(
                        "absolute right-1.5 p-1 rounded-sm transition-all",
                        "opacity-0 group-hover:opacity-100",
                        "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                    )}
                    title="Channel Settings"
                >
                    <Icon icon="lucide:settings-2" width="14" />
                </button>
            </div>

            {channel.type === "VOICE" && voiceParticipants && voiceParticipants.length > 0 && (
                <div className="pl-8 pr-2 py-1 space-y-1">
                    {voiceParticipants.map((p) => {
                        const isSpeaking = speakingUsers.has(p.userInfo.id);
                        return (
                            <div key={p.userInfo.id} onClick={(e) => e.stopPropagation()}>
                                <VoiceUserItem
                                    userInfo={p.userInfo}
                                    isSpeaking={isSpeaking}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});
ChannelItem.displayName = 'ChannelItem';
