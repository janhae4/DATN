import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FileText, Paperclip, Plus, X, Loader2, Link as LinkIcon, Download, Trash, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { taskService } from "@/services/taskService"
import { fileService, IFile } from "@/services/fileService"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { useParams } from "next/navigation"

interface DocumentListProps {
    files: IFile[];
    isLoading: boolean;
    attachedFiles: any[];
    onLink: (fileId: string) => void;
    isLinking: boolean;
}

export function DocumentList({ files, isLoading, attachedFiles, onLink, isLinking }: DocumentListProps) {
    if (isLoading) {
        return (
            <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )
    }

    if (!files || files.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8">
                No files found in project.
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {files.map((file) => {
                const isLinked = attachedFiles.some((af: any) => af.id === file._id || af._id === file._id)
                return (
                    <div key={file._id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="truncate">
                                <div className="text-sm font-medium truncate max-w-[180px]" title={file.originalName}>{file.originalName}</div>
                                <div className="text-xs text-muted-foreground">
                                    {format(new Date(file.createdAt), "MMM d, yyyy")} • {(file.size / 1024).toFixed(1)} KB
                                </div>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant={isLinked ? "secondary" : "default"}
                            disabled={isLinked || isLinking}
                            onClick={() => onLink(file._id)}
                            className="shrink-0"
                        >
                            {isLinked ? (
                                <span className="text-green-600 flex items-center gap-1">
                                    Linked
                                </span>
                            ) : (
                                <>
                                    {isLinking ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <LinkIcon className="h-3 w-3" />
                                    )}
                                </>
                            )}
                        </Button>
                    </div>
                )
            })}
        </div>
    )
}
