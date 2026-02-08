"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import { Button } from "@/components/ui/button";
import { fileService } from "@/services/fileService";
import { MediaPreviewDialog } from "../dialogs/MediaPreviewDialog";
import { Attachment } from "@/types";
import { cn } from "@/lib/utils";
import { MessageAttachment } from "./types";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

interface MessageAttachmentsProps {
    attachments: MessageAttachment[];
    serverId?: string | null;
    isMe?: boolean;
    onRemove?: (index: number) => void;
    onReply?: () => void;
    onReact?: (emoji: string) => void;
}

export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
    attachments,
    serverId,
    isMe,
    onRemove,
    onReply,
    onReact
}) => {
    const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<Attachment | null>(null);

    useEffect(() => {
        const fetchPreviewUrls = async () => {
            if (!attachments || attachments.length === 0) return;

            const urls: Record<number, string> = {};
            for (let i = 0; i < attachments.length; i++) {
                const attachment = attachments[i];
                if (attachment.url.startsWith('http')) {
                    urls[i] = attachment.url;
                } else {
                    try {
                        console.log('Fetching preview for:', { fileId: attachment.url });
                        const { viewUrl } = await fileService.getPreviewUrl(attachment.url, undefined, serverId || undefined);
                        urls[i] = viewUrl;
                    } catch (error: any) {
                        console.error('Failed to fetch preview URL:', {
                            fileId: attachment.url,
                            serverId,
                            error: error.message,
                            response: error.response?.data,
                            status: error.response?.status
                        });
                        urls[i] = attachment.url;
                    }
                }
            }
            setPreviewUrls(urls);
        };

        fetchPreviewUrls();
    }, [attachments]);

    const handleOpenPreview = (attachment: MessageAttachment, index: number) => {
        const previewUrl = previewUrls[index];
        const ext = attachment.fileName?.toLowerCase().split('.').pop() || '';

        const mimeMap: Record<string, string> = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc': 'application/msword',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls': 'application/vnd.ms-excel',
            'csv': 'text/csv',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
            'mp4': 'video/mp4',
            'webm': 'video/webm'
        };

        setSelectedFile({
            id: attachment.url,
            fileName: attachment.fileName,
            fileUrl: previewUrl || attachment.url,
            fileType: (attachment.type?.toUpperCase() || 'FILE') as any,
            mimeType: mimeMap[ext] || attachment.type,
            fileSize: 0,
            name: attachment.fileName,
            taskId: '',
            uploadedById: '',
            uploadedAt: '',
            visibility: 'TEAM' as any
        });
        setPreviewDialogOpen(true);
    };

    if (!attachments || attachments.length === 0) return null;

    return (
        <>
            <div className="mt-2 space-y-2">
                {attachments.map((attachment, index) => {
                    const extension = attachment.fileName?.toLowerCase().split('.').pop() || '';
                    const isImage = attachment.type === 'image' || attachment.type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
                    const isVideo = attachment.type === 'video' || attachment.type?.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(extension);
                    const isPdf = extension === 'pdf' || attachment.type?.includes('pdf');
                    const isWord = ['docx', 'doc'].includes(extension);
                    const isExcel = ['xlsx', 'xls', 'csv'].includes(extension);
                    const previewUrl = previewUrls[index];

                    return (
                        <div key={index} className="max-w-md relative group/attachment">
                            {isImage ? (
                                <div className="relative group/img rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt={attachment.fileName}
                                            className="w-full h-auto max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => handleOpenPreview(attachment, index)}
                                        />
                                    ) : (
                                        <div className="w-full h-48 flex items-center justify-center">
                                            <Icon icon="lucide:loader-2" className="animate-spin text-zinc-400 dark:text-zinc-500" width="24" />
                                        </div>
                                    )}

                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800/50 transition-colors group/file cursor-pointer"
                                    onClick={() => handleOpenPreview(attachment, index)}
                                >
                                    <div className="flex-shrink-0 w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center">
                                        <Icon
                                            icon={
                                                isVideo ? 'lucide:video' :
                                                    isPdf ? 'lucide:file-text' :
                                                        isWord ? 'lucide:file-text' :
                                                            isExcel ? 'lucide:table' :
                                                                'lucide:file'
                                            }
                                            width="20"
                                            className={cn(
                                                "text-zinc-500 dark:text-zinc-400",
                                                isPdf && "text-red-400",
                                                isWord && "text-blue-400",
                                                isExcel && "text-green-400"
                                            )}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-zinc-900 dark:text-zinc-200 truncate font-medium">{attachment.fileName}</p>
                                        <p className="text-xs text-zinc-500 uppercase">{extension || attachment.type}</p>
                                    </div>

                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <MediaPreviewDialog
                open={previewDialogOpen}
                onOpenChange={setPreviewDialogOpen}
                attachment={selectedFile || {}}
                previewUrl={selectedFile ? previewUrls[attachments.findIndex(a => a.url === selectedFile.id)] || selectedFile.fileUrl : ""}
                onDelete={selectedFile && isMe && onRemove ? async () => {
                    const currentFileId = selectedFile.id;
                    const index = attachments.findIndex(a => a.url === currentFileId);
                    if (index !== -1) {
                        await onRemove(index);
                    }
                } : undefined}
            />
        </>
    );
};
