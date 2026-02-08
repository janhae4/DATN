"use client";

import React, { useState } from "react";
import { Icon } from "@iconify-icon/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
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

interface MediaPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attachment: any;
    previewUrl: string;
    teamId?: string;
    currentProjectId?: string;
    currentProjectName?: string;
    projects?: Array<{ id: string; name: string }>;
    onDelete?: () => void | Promise<void>;
}

export const MediaPreviewDialog: React.FC<MediaPreviewDialogProps> = ({
    open,
    onOpenChange,
    attachment,
    previewUrl,
    teamId,
    currentProjectId,
    currentProjectName,
    projects = []
}) => {
    const [selectedDestination, setSelectedDestination] = useState<string>(
        currentProjectId || "personal"
    );
    const [isSaving, setIsSaving] = useState(false);

    const isImage = attachment?.type === 'image' || attachment?.type?.startsWith('image/');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const isPersonal = selectedDestination === "personal";
            const projectId = isPersonal ? undefined : selectedDestination;

            await fileService.saveFromChat({
                storageKey: attachment.url,
                fileName: attachment.fileName,
                teamId,
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

    // Reset selection when dialog opens
    React.useEffect(() => {
        if (open) {
            setSelectedDestination(currentProjectId || "personal");
        }
    }, [open, currentProjectId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800">
                    <DialogTitle className="text-lg font-semibold text-zinc-100">
                        {attachment?.fileName || "Media Preview"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500">
                        {attachment?.type} • {attachment?.size ? `${(attachment.size / 1024).toFixed(2)} KB` : 'Unknown size'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col md:flex-row gap-0">
                    {/* Preview Area */}
                    <div className="flex-1 bg-zinc-950/50 flex items-center justify-center p-6 min-h-[300px] md:min-h-[400px]">
                        {isImage ? (
                            <img
                                src={previewUrl}
                                alt={attachment?.fileName}
                                className="max-h-[60vh] max-w-full rounded-md shadow-xl"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-zinc-400">
                                <Icon icon="lucide:file" width="64" />
                                <span className="text-sm">{attachment?.fileName}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions Panel */}
                    <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-900/50 p-6 flex flex-col gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-zinc-200">Save to Database</h3>

                            {/* Single Destination Select */}
                            <div className="space-y-2">
                                <Label htmlFor="destination" className="text-xs text-zinc-400">
                                    Save Location
                                </Label>
                                <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                                    <SelectTrigger id="destination" className="bg-zinc-800 border-zinc-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {/* Personal Files */}
                                        <SelectItem value="personal">
                                            <div className="flex items-center gap-2">
                                                <Icon icon="lucide:user" width="14" />
                                                <span>Personal Files</span>
                                            </div>
                                        </SelectItem>

                                        {/* Separator if there's a current project or other projects */}
                                        {(currentProjectId || projects.length > 0) && (
                                            <Separator className="my-1 bg-zinc-700" />
                                        )}

                                        {/* Current Project (highlighted) */}
                                        {currentProjectId && currentProjectName && (
                                            <SelectItem value={currentProjectId}>
                                                <div className="flex items-center gap-2">
                                                    <Icon icon="lucide:folder" width="14" className="text-indigo-400" />
                                                    <span className="font-medium text-indigo-400">{currentProjectName}</span>
                                                    <span className="text-[10px] text-zinc-500 ml-1">(Current)</span>
                                                </div>
                                            </SelectItem>
                                        )}

                                        {/* Other Projects */}
                                        {projects
                                            .filter(p => p.id !== currentProjectId)
                                            .map((project) => (
                                                <SelectItem key={project.id} value={project.id}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon icon="lucide:folder" width="14" />
                                                        <span>{project.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        }

                                        {/* No projects message */}
                                        {!currentProjectId && projects.length === 0 && (
                                            <div className="p-2 text-xs text-zinc-500 text-center italic">
                                                No projects available
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                            >
                                {isSaving ? (
                                    <>
                                        <Icon icon="lucide:loader-2" className="animate-spin mr-2" width="16" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="lucide:save" className="mr-2" width="16" />
                                        Save to Database
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="border-t border-zinc-800 pt-4 space-y-2">
                            <Button
                                onClick={handleDownload}
                                variant="outline"
                                className="w-full border-zinc-700 hover:bg-zinc-800"
                            >
                                <Icon icon="lucide:download" className="mr-2" width="16" />
                                Download
                            </Button>
                        </div>

                        {/* File Info */}
                        <div className="border-t border-zinc-800 pt-4 space-y-2 mt-auto">
                            <h4 className="text-xs font-semibold text-zinc-400">File Information</h4>
                            <div className="space-y-1 text-xs text-zinc-500">
                                <div>Type: <span className="text-zinc-400">{attachment?.type}</span></div>
                                <div>Size: <span className="text-zinc-400">{attachment?.size ? `${(attachment.size / 1024).toFixed(2)} KB` : 'Unknown'}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
