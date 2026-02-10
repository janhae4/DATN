"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { fileService } from "@/services/fileService";
import { cn } from "@/lib/utils";
import FilePreview from "@/components/features/documentation/filePreview";

interface MediaPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attachment: any;
    previewUrl: string;
    serverId?: string;
    destinationTeamId?: string;
    currentProjectId?: string;
    currentProjectName?: string;
    projects?: Array<{ id: string; name: string }>;
    onDelete?: () => void | Promise<void>;
    simple?: boolean;
}

export const MediaPreviewDialog: React.FC<MediaPreviewDialogProps> = ({
    open,
    onOpenChange,
    attachment,
    previewUrl,
    destinationTeamId,
    currentProjectId,
    currentProjectName,
    projects = [],
    simple = false
}) => {
    const [selectedDestination, setSelectedDestination] = useState<string>(
        currentProjectId || "personal"
    );
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setSelectedDestination(currentProjectId || "personal");
        }
    }, [open, currentProjectId]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const isPersonal = selectedDestination === "personal";
            const projectId = isPersonal ? undefined : selectedDestination;

            await fileService.saveFromChat({
                storageKey: attachment.url,
                fileName: attachment.fileName,
                teamId: destinationTeamId,
                projectId
            });

            const destName = isPersonal
                ? "Personal Files"
                : projects.find(p => p.id === selectedDestination)?.name || currentProjectName || "Project Files";

            toast.success(`File saved to ${destName}`);
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to save file");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = previewUrl;
        link.download = attachment.fileName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download started");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl sm:rounded-xl",
                simple ? "max-w-4xl h-[75vh]" : "max-w-6xl h-[85vh]"
            )}>
                <div className="sr-only">
                    <DialogTitle>{attachment?.fileName}</DialogTitle>
                    <DialogDescription>Media preview and actions</DialogDescription>
                </div>

                <div className="flex h-full flex-col md:flex-row">
                    {/* LEFT: Preview Area */}
                    <div className="relative flex-1 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                        <FilePreview url={previewUrl} />

                        {/* Top Left Filename Overlay */}
                        <div className="absolute top-4 left-4 z-20">
                            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm font-medium">
                                {attachment?.fileName}
                            </div>
                        </div>

                        {/* Simple Mode Download Button Overlay */}
                        {simple && (
                            <div className="absolute bottom-4 right-4 z-20">
                                <Button size="sm" onClick={handleDownload} className="shadow-lg">
                                    <Icon icon="lucide:download" className="mr-2" />
                                    Download
                                </Button>
                            </div>
                        )}
                    </div>

                    {!simple && (
                        <div className="w-full md:w-[320px] flex flex-col bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
                            {/* Simple Header */}
                            <div className="p-6 pb-2">
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Save to Storage</h3>
                                <p className="text-xs text-zinc-500 mt-1">Copy this file to your permanent storage.</p>
                            </div>

                            <div className="flex-1 px-6 pt-4 space-y-8 overflow-y-auto">
                                {/* Destination Control */}
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-400 tracking-tight">Location</Label>
                                    <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                                        <SelectTrigger className="w-full h-10 bg-transparent border-zinc-200 dark:border-zinc-800 shadow-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="personal">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Icon icon="lucide:user" className="text-zinc-400" width="14" />
                                                    <span>Personal Cloud</span>
                                                </div>
                                            </SelectItem>

                                            {(currentProjectId || projects.length > 0) && <Separator className="my-1.5 opacity-50" />}

                                            {currentProjectId && (
                                                <SelectItem value={currentProjectId}>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Icon icon="lucide:folder" className="text-blue-500" width="14" />
                                                        <span className="font-medium">{currentProjectName}</span>
                                                    </div>
                                                </SelectItem>
                                            )}

                                            {projects.filter(p => p.id !== currentProjectId).map((project) => (
                                                <SelectItem key={project.id} value={project.id}>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Icon icon="lucide:folder" className="text-zinc-400" width="14" />
                                                        <span>{project.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Metadata List */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-400 tracking-tight">File Info</Label>
                                    <div className="space-y-3 px-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-zinc-500">Extension</span>
                                            <span className="text-zinc-900 dark:text-zinc-300 font-medium uppercase">{attachment?.type || 'File'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-zinc-500">Total Size</span>
                                            <span className="text-zinc-900 dark:text-zinc-300 font-medium">
                                                {typeof attachment?.size === 'number'
                                                    ? attachment.size > 1024 * 1024
                                                        ? `${(attachment.size / (1024 * 1024)).toFixed(2)} MB`
                                                        : `${(attachment.size / 1024).toFixed(2)} KB`
                                                    : '---'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-6 space-y-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full h-10 bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity rounded-lg font-semibold text-xs"
                                >
                                    {isSaving ? "Saving..." : "Save to Storage"}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleDownload}
                                    className="w-full h-10 border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-none text-zinc-600 dark:text-zinc-400 text-xs"
                                >
                                    Download
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};