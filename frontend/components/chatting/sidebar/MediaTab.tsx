"use client";

import React from "react";
import { Icon } from "@iconify-icon/react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { MediaItem } from "./MediaItem";

interface MediaTabProps {
    attachments: any[];
    selectedServerId: string | null;
    isFetchingAttachments: boolean;
    hasNextAttachmentPage: boolean;
    onLoadMore: () => void;
    teamId?: string;
    currentProjectId?: string;
    currentProjectName?: string;
    projects?: Array<{ id: string; name: string }>;
}

export const MediaTab: React.FC<MediaTabProps> = ({
    attachments,
    selectedServerId,
    isFetchingAttachments,
    hasNextAttachmentPage,
    onLoadMore,
    teamId,
    currentProjectId,
    currentProjectName,
    projects = []
}) => {
    return (
        <TabsContent value="media" className="flex-1 data-[state=active]:flex flex-col mt-0 w-full h-full">
            {/* Header */}
            <div className="h-12 flex items-center px-4 shrink-0 border-b border-zinc-100 dark:border-zinc-800/50">
                <Icon icon="lucide:image" width="14" className="text-zinc-400 mr-2" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                    Media & Files
                </span>
            </div>

            {/* Content Grid */}
            <div className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar">
                
                {/* Empty State */}
                {attachments.length === 0 && !isFetchingAttachments && (
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl">
                        <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-3 text-zinc-400">
                            <Icon icon="lucide:folder-open" width="20"  />
                        </div>
                        <p className="text-xs text-zinc-500 font-medium">No files shared yet</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    {attachments.map((att: any, idx: number) => (
                        <MediaItem
                            key={`${att.url}-${idx}`}
                            attachment={att}
                            serverId={selectedServerId}
                            teamId={teamId}
                            currentProjectId={currentProjectId}
                            currentProjectName={currentProjectName}
                            projects={projects}
                        />
                    ))}
                </div>

                {hasNextAttachmentPage && (
                    <div className="pt-4 pb-2">
                         <Button
                            variant="ghost"
                            size="sm"
                            onClick={onLoadMore}
                            disabled={isFetchingAttachments}
                            className="w-full text-xs font-medium h-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                        >
                            {isFetchingAttachments ? (
                                <Icon icon="lucide:loader-2" className="animate-spin mr-2" width="14" />
                            ) : "Load more files"}
                        </Button>
                    </div>
                )}
            </div>
        </TabsContent>
    );
};