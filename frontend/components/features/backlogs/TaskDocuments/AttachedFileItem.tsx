import * as React from "react"
import {
    FileText,
    Download,
    Trash,
    MoreHorizontal,
    Eye,
    FileImage,
    FileVideo,
    FileAudio,
    FileCode,
    FilePieChart,
    Archive,
    FileType
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface AttachedFileItemProps {
    file: any;
    onDownload: (fileId: string) => void;
    onUnlink: (fileId: string) => void;
    onPreview: (file: any) => void;
    isUnlinking: boolean;
}

const getFileIcon = (fileName: string, mimetype?: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (mimetype?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
        return { icon: FileImage, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-100 dark:border-orange-800" };
    }
    if (mimetype?.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) {
        return { icon: FileVideo, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20", border: "border-purple-100 dark:border-purple-800" };
    }
    if (mimetype?.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(ext || '')) {
        return { icon: FileAudio, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-950/20", border: "border-pink-100 dark:border-pink-800" };
    }
    if (['pdf'].includes(ext || '')) {
        return { icon: FileType, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-100 dark:border-red-800" };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
        return { icon: Archive, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/20", border: "border-yellow-100 dark:border-yellow-800" };
    }
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext || '')) {
        return { icon: FileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-100 dark:border-blue-800" };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
        return { icon: FilePieChart, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20", border: "border-green-100 dark:border-green-800" };
    }
    if (['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'go', 'java', 'c', 'cpp', 'json'].includes(ext || '')) {
        return { icon: FileCode, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-100 dark:border-emerald-800" };
    }

    return { icon: FileText, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-950/20", border: "border-gray-200 dark:border-gray-800" };
}

export function AttachedFileItem({ file, onDownload, onUnlink, onPreview, isUnlinking }: AttachedFileItemProps) {
    const fileName = file.originalName || file.fileName || "Unknown File"
    const fileSize = file.size ? (file.size / 1024).toFixed(1) + ' KB' : (file.fileSize ? (file.fileSize / 1024).toFixed(1) + ' KB' : '')
    const iconData = getFileIcon(fileName, file.mimetype || file.fileType)
    const Icon = iconData.icon

    return (
        <div
            className="group flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/40 hover:border-accent/40 transition-all duration-200 shadow-sm hover:shadow-md h-14"
        >
            <div
                className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer min-w-0"
                onClick={(e) => { e.preventDefault(); onPreview(file); }}
            >
                {/* Icon Container */}
                <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
                    iconData.bg,
                    iconData.border
                )}>
                    <Icon className={cn("h-5 w-5", iconData.color)} />
                </div>

                {/* File Details */}
                <div className="flex flex-col min-w-0 flex-1">
                    <div
                        className="text-[13px] font-semibold truncate text-foreground/90 group-hover:text-primary transition-colors pr-2"
                        title={fileName}
                    >
                        {fileName}
                    </div>
                    <div className="flex items-center text-[10px] text-muted-foreground gap-1.5 font-medium mt-0.5">
                        {fileSize && (
                            <>
                                <span>{fileSize}</span>
                                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30" />
                            </>
                        )}
                        <span className="truncate">
                            {file.createdAt ? format(new Date(file.createdAt), "MMM d, yyyy") : "Date N/A"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground/40 hover:text-foreground opacity-40 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 data-[state=open]:opacity-100"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 p-1">
                    <DropdownMenuItem onClick={() => onPreview(file)} className="cursor-pointer gap-2 py-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Quick Preview</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDownload(file.id || file._id)} className="cursor-pointer gap-2 py-2">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Download File</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => onUnlink(file.id || file._id)}
                        disabled={isUnlinking}
                        className="text-destructive focus:text-destructive cursor-pointer gap-2 py-2 focus:bg-destructive/5"
                    >
                        <Trash className="h-4 w-4" />
                        <span className="text-sm">Remove from Task</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
