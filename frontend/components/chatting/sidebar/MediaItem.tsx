"use client";

import React, { useState } from "react";
import { Icon } from "@iconify-icon/react";
import { fileService } from "@/services/fileService";
import { MediaPreviewDialog } from "../dialogs/MediaPreviewDialog";
import { cn } from "@/lib/utils";

interface MediaItemProps {
    attachment: any;
    serverId: string | null;
    teamId?: string;
    currentProjectId?: string;
    currentProjectName?: string;
    projects?: Array<{ id: string; name: string }>;
}

export const MediaItem = React.memo(({ attachment, serverId, teamId, currentProjectId, currentProjectName, projects }: MediaItemProps) => {
    const [previewUrl, setPreviewUrl] = React.useState<string>("");
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const isImage = attachment.type === 'image' || attachment.type?.startsWith('image/');
    const extension = attachment.fileName?.split('.').pop()?.toUpperCase() || "FILE";

    React.useEffect(() => {
        const fetchPreview = async () => {
            if (attachment.url.startsWith('http')) {
                setPreviewUrl(attachment.url);
            } else {
                try {
                    const { viewUrl } = await fileService.getPreviewUrl(attachment.url, undefined, serverId || undefined);
                    setPreviewUrl(viewUrl);
                } catch {
                    // ignore
                }
            }
        };
        fetchPreview();
    }, [attachment, serverId]);

    // Render Content based on type
    const renderContent = () => {
        if (!isImage) {
            // File Card Style
            return (
                <div
                    className="group relative aspect-square flex flex-col justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer transition-all duration-300 hover:shadow-md hover:shadow-zinc-200/50 dark:hover:shadow-black/20"
                    onClick={() => setIsPreviewOpen(true)}
                >
                    <div className="flex justify-between items-start">
                         <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">
                            <Icon icon="lucide:file" width="16" />
                         </div>
                         <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 tracking-wider">
                            {extension}
                         </span>
                    </div>
                    
                    <div className="space-y-1">
                         <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate leading-tight w-full" title={attachment.fileName}>
                            {attachment.fileName}
                         </p>
                         <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            {attachment.size ? `${(attachment.size / 1024).toFixed(0)} KB` : 'Unknown'}
                         </p>
                    </div>

                    {/* Hover Overlay Light */}
                    <div className="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/[0.02] dark:group-hover:bg-white/[0.02] rounded-xl transition-colors pointer-events-none" />
                </div>
            );
        }

        if (!previewUrl) return <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-xl animate-pulse" />;

        // Image Card Style
        return (
            <div
                className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                onClick={() => setIsPreviewOpen(true)}
            >
                <img 
                    src={previewUrl} 
                    alt={attachment.fileName} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <Icon icon="lucide:eye" width="16" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {renderContent()}

            <MediaPreviewDialog
                open={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                attachment={attachment}
                previewUrl={previewUrl}
                teamId={teamId}
                currentProjectId={currentProjectId}
                currentProjectName={currentProjectName}
                projects={projects}
            />
        </>
    );
});
MediaItem.displayName = 'MediaItem';