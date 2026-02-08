import React, { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import { fileService } from "@/services/fileService";
import { MessageAttachment } from "./types";

interface ReplyAttachmentPreviewProps {
    attachment: MessageAttachment;
    serverId: string | null;
}

export const ReplyAttachmentPreview: React.FC<ReplyAttachmentPreviewProps> = ({ attachment, serverId }) => {
    const [previewUrl, setPreviewUrl] = useState<string>("");

    const extension = attachment.fileName?.toLowerCase().split('.').pop() || '';
    const isImage = attachment.type === 'image' || attachment.type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);

    useEffect(() => {
        if (!isImage) return;

        const fetchPreview = async () => {
            if (attachment.url.startsWith('http')) {
                setPreviewUrl(attachment.url);
            } else {
                try {
                    const { viewUrl } = await fileService.getPreviewUrl(attachment.url, undefined, serverId || undefined);
                    setPreviewUrl(viewUrl);
                } catch {
                    // Fallback or error handling
                }
            }
        };
        fetchPreview();
    }, [attachment, serverId, isImage]);

    if (isImage) {
        if (!previewUrl) return <div className="h-full w-full bg-zinc-700 animate-pulse" />;
        return <img src={previewUrl} alt="Reply attachment" className="h-full w-full object-cover" />;
    }

    return <div className="h-full w-full flex items-center justify-center bg-zinc-800">
        <Icon icon="lucide:file" width="20" className="text-zinc-400" />
    </div>;
};
