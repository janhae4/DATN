import React from "react";
import { Icon } from "@iconify-icon/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Member {
    userId: string;
    name: string;
    avatar?: string;
    role?: string;
    isAdmin?: boolean;
}

interface MemberListProps {
    showMembers: boolean;
    selectedServerId: string | null;
    members: Member[];
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

    const MemberItem = ({ member }: { member: Member }) => (
        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800/50 cursor-pointer transition-colors group">
            <div className="relative">
                <Avatar className="h-8 w-8 border border-zinc-800">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-[10px] bg-zinc-800 text-zinc-400 font-medium">
                        {member.name?.substring(0, 1).toUpperCase() || "?"}
                    </AvatarFallback>
                </Avatar>
            </div>

            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 truncate transition-colors">
                        {member.name}
                    </span>
                    {member.isAdmin && (
                        <Icon
                            icon="lucide:crown"
                            width="12"
                            className="text-amber-500 shrink-0"
                            title="Admin"
                        />
                    )}
                </div>
                {member.role && (
                    <span className="text-[10px] text-zinc-500 font-medium truncate group-hover:text-zinc-400 transition-colors">
                        {member.role}
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div className="w-60 bg-zinc-950 border-l border-zinc-900 flex flex-col h-full">
            <div className="h-12 flex items-center px-4 shrink-0">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Members — {members.length}
                </span>
            </div>

            <ScrollArea className="flex-1 px-2 pb-2">
                <div className="space-y-1 mt-1">
                    {loadingMembers && (
                        <div className="flex justify-center p-2">
                            <Icon icon="lucide:loader-2" className="animate-spin text-zinc-600" width="16" />
                        </div>
                    )}

                    {members.map((member: Member) => (
                        <MemberItem key={member.userId} member={member} />
                    ))}

                    {hasNextMembersPage && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onLoadMore}
                            disabled={isFetchingNextMembersPage}
                            className="w-full text-xs text-zinc-500 h-8 mt-2 hover:text-zinc-300"
                        >
                            {isFetchingNextMembersPage ? (
                                <Icon icon="lucide:loader-2" className="animate-spin mr-2" width="14" />
                            ) : "Load More"}
                        </Button>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
