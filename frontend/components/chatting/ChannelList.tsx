import React from "react";
import { Icon } from "@iconify-icon/react";

interface ChannelListProps {
    selectedServerName: string;
    selectedServerId: string | null;
    channels: any[];
    selectedChannelId: string | null;
    expandedCategories: Set<string>;
    loadingChannels: boolean;
    isCreatingChannel: boolean;
    onUpdateServer: () => void;
    onDeleteServer: () => void;
    onPermanentDeleteServer: () => void;
    onInvite: () => void;
    onSelectChannel: (id: string) => void;
    onToggleCategory: (id: string) => void;
    onCreateChannel: (parentId?: string) => void;
    onCreateCategory: () => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({
    selectedServerName,
    selectedServerId,
    channels,
    selectedChannelId,
    expandedCategories,
    loadingChannels,
    isCreatingChannel,
    onUpdateServer,
    onDeleteServer,
    onPermanentDeleteServer,
    onInvite,
    onSelectChannel,
    onToggleCategory,
    onCreateChannel,
    onCreateCategory,
}) => {
    const categories = channels
        .filter((c: any) => c.type === "CATEGORY")
        .sort((a: any, b: any) => a.position - b.position);
    const orphans = channels.filter(
        (c: any) => c.type !== "CATEGORY" && !c.parentId
    );

    const renderChannel = (channel: any, isNested = false) => (
        <button
            key={channel._id}
            onClick={() => onSelectChannel(channel._id)}
            className={`w-full text-left px-2 py-1 rounded flex items-center space-x-2 transition-colors ${isNested ? "ml-2 w-[calc(100%-8px)]" : ""
                } ${selectedChannelId === channel._id
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
        >
            <Icon
                icon={channel.type === "VOICE" ? "lucide:volume-2" : "lucide:hash"}
                width="16"
                className="text-gray-500"
            />
            <span className="truncate text-sm">{channel.name}</span>
        </button>
    );

    return (
        <div className="w-60 bg-gray-900 flex flex-col border-r border-gray-800">
            <div className="h-12 border-b border-gray-800 flex items-center justify-between px-4 font-bold overflow-hidden">
                <span className="truncate">{selectedServerName}</span>
                <div className="flex items-center space-x-1">
                    {selectedServerId && (
                        <>
                            <button
                                onClick={onUpdateServer}
                                className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-gray-200"
                                title="Server Settings"
                            >
                                <Icon icon="lucide:settings" width="16" height="16" />
                            </button>
                            <button
                                onClick={onDeleteServer}
                                className="p-1 hover:bg-gray-800 rounded transition-colors text-yellow-500 hover:text-yellow-400"
                                title="Delete Server (Soft)"
                            >
                                <Icon icon="lucide:trash-2" width="16" height="16" />
                            </button>
                            <button
                                onClick={onPermanentDeleteServer}
                                className="p-1 hover:bg-gray-800 rounded transition-colors text-red-500 hover:text-red-400"
                                title="Permanent Delete Server"
                            >
                                <Icon icon="lucide:x-circle" width="16" height="16" />
                            </button>
                            <button
                                onClick={onInvite}
                                className="px-2 py-1 flex items-center gap-1 hover:bg-gray-800 rounded transition-colors text-indigo-400 hover:text-indigo-300 text-xs"
                                title="Invite to Server"
                            >
                                <Icon icon="lucide:user-plus" width="16" height="16" />
                                <span>Invite</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {!selectedServerId ? (
                    <p className="text-gray-500 text-sm text-center mt-10">
                        Choose a server
                    </p>
                ) : (
                    <div className="space-y-4">
                        {loadingChannels && (
                            <p className="text-xs text-gray-500 px-2">Loading channels...</p>
                        )}

                        <div className="space-y-0.5">
                            {orphans.map((c: any) => renderChannel(c))}
                        </div>

                        {categories.map((cat: any) => {
                            const isExpanded = expandedCategories.has(cat._id);
                            const children = channels.filter(
                                (c: any) => c.parentId === cat._id
                            );
                            return (
                                <div key={cat._id} className="space-y-0.5">
                                    <div className="w-full flex items-center justify-between px-1 py-1 group hover:bg-gray-800/50 rounded cursor-pointer">
                                        <button
                                            onClick={() => onToggleCategory(cat._id)}
                                            className="flex-1 flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors bg-transparent border-none outline-none"
                                        >
                                            <Icon
                                                icon={
                                                    isExpanded
                                                        ? "lucide:chevron-down"
                                                        : "lucide:chevron-right"
                                                }
                                                width="12"
                                                className="mr-1 opacity-50"
                                            />
                                            <span className="truncate">{cat.name}</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCreateChannel(cat._id);
                                            }}
                                            className="text-gray-500 hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                            title="Create Channel in Category"
                                        >
                                            <Icon icon="lucide:plus" width="12" />
                                        </button>
                                    </div>
                                    {isExpanded && (
                                        <div className="space-y-0.5">
                                            {children.map((child: any) =>
                                                renderChannel(child, true)
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div className="mt-4 flex flex-col space-y-1">
                            <button
                                onClick={onCreateCategory}
                                className="w-full flex items-center space-x-2 px-2 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
                            >
                                <Icon icon="lucide:folder-plus" width="16" />
                                <span>Create Category</span>
                            </button>
                            <button
                                onClick={() => onCreateChannel(undefined)}
                                disabled={isCreatingChannel}
                                className="w-full flex items-center space-x-2 px-2 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreatingChannel ? (
                                    <Icon
                                        icon="lucide:loader-2"
                                        width="16"
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Icon icon="lucide:plus" width="16" />
                                )}
                                <span>
                                    {isCreatingChannel ? "Creating..." : "Create Channel"}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
