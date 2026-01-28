import React from "react";
import { Icon } from "@iconify-icon/react";

interface MemberListProps {
    showMembers: boolean;
    selectedServerId: string | null;
    members: any[];
    loadingMembers: boolean;
    hasNextMembersPage: boolean;
    isFetchingNextMembersPage: boolean;
    onLoadMore: () => void;
}

export const MemberList: React.FC<MemberListProps> = ({
    showMembers,
    selectedServerId,
    members,
    loadingMembers,
    hasNextMembersPage,
    isFetchingNextMembersPage,
    onLoadMore
}) => {
    if (!showMembers || !selectedServerId) return null;

    return (
        <div className="w-60 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="h-12 border-b border-gray-800 flex items-center px-4 font-bold text-gray-400 text-sm uppercase tracking-wider">
                Members — {members.length}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {loadingMembers && <div className="text-gray-500 text-xs">Loading members...</div>}

                <div className="space-y-1">
                    {members.map((member: any) => (
                        <div
                            key={member.userId}
                            className="flex items-center space-x-3 p-1 rounded hover:bg-gray-800 transition-colors group cursor-pointer"
                        >
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold overflow-hidden">
                                    {member.avatar ? (
                                        <img src={member.avatar} alt={member.name} />
                                    ) : (
                                        <span>{member.name?.substring(0, 1).toUpperCase() || "?"}</span>
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300 group-hover:text-white truncate text-sm font-medium">
                                        {member.name}
                                    </span>
                                    {member.isAdmin && (
                                        <Icon icon="lucide:shield-check" className="text-indigo-400" width="12" />
                                    )}
                                </div>
                                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">
                                    {member.role}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {hasNextMembersPage && (
                    <button
                        onClick={onLoadMore}
                        disabled={isFetchingNextMembersPage}
                        className="w-full py-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        {isFetchingNextMembersPage ? "Loading..." : "Load more members"}
                    </button>
                )}
            </div>
        </div>
    );
};
