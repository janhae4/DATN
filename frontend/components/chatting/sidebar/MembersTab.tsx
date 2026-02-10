"use client";

import React from "react";
import { Icon } from "@iconify-icon/react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { MemberItem } from "./MemberItem";
import { ServerMemberDto } from "@/types";

interface MembersTabProps {
    members: ServerMemberDto[];
    loadingMembers: boolean;
    hasNextMembersPage: boolean;
    isFetchingNextMembersPage: boolean;
    onLoadMore: () => void;
}

export const MembersTab: React.FC<MembersTabProps> = ({
    members,
    loadingMembers,
    hasNextMembersPage,
    isFetchingNextMembersPage,
    onLoadMore
}) => {
    return (
        <TabsContent value="members" className="flex-1 data-[state=active]:flex flex-col mt-0 w-full h-full">
            {/* Header */}
            <div className="h-12 flex items-center px-4 shrink-0 border-b border-zinc-100 dark:border-zinc-800/50">
                <Icon icon="lucide:users" width="14" className="text-zinc-400 mr-2" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                    Members <span className="text-zinc-900 dark:text-zinc-100 ml-1 opacity-50">{members.length}</span>
                </span>
            </div>

            {/* List */}
            <div className="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                    {loadingMembers && members.length === 0 && (
                        <div className="flex justify-center p-8">
                            <Icon icon="lucide:loader-2" className="animate-spin text-zinc-400" width="20" />
                        </div>
                    )}

                    {members.map((member: ServerMemberDto) => (
                        <MemberItem key={member.userId} member={member} />
                    ))}

                    {hasNextMembersPage && (
                        <div className="pt-2 px-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onLoadMore}
                                disabled={isFetchingNextMembersPage}
                                className="w-full text-xs font-medium h-9 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                            >
                                {isFetchingNextMembersPage ? (
                                    <Icon icon="lucide:loader-2" className="animate-spin mr-2" width="14" />
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <span>Load more members</span>
                                        <Icon icon="lucide:chevron-down" width="12" />
                                    </div>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </TabsContent>
    );
};