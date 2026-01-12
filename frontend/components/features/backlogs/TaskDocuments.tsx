"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Paperclip, Plus, Loader2 } from "lucide-react"
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
import { taskService } from "@/services/taskService"
import { fileService, IFile } from "@/services/fileService"
import { toast } from "sonner"

import { useParams } from "next/navigation"

import { DocumentList } from "./TaskDocuments/DocumentList"
import { UploadTab } from "./TaskDocuments/UploadTab"
import { AttachedFileItem } from "./TaskDocuments/AttachedFileItem"
import { FilePreviewDialog } from "@/components/features/documentation/file-preview-dialog"
import { Attachment } from "@/types"

interface TaskDocumentsProps {
    taskId: string
    projectId: string
    teamId?: string
}

export function TaskDocuments({ taskId, projectId, teamId: propTeamId }: TaskDocumentsProps) {
    const params = useParams()
    const teamId = propTeamId || (params.teamId as string)
    const queryClient = useQueryClient()
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

    // 1. Fetch attached files
    const { data: attachedFiles = [], isLoading: isLoadingAttached } = useQuery<IFile[]>({
        queryKey: ["task-files", taskId],
        queryFn: () => taskService.getFilesByTaskId(taskId),
        enabled: !!taskId,
    })

    // 2. Fetch all project/team files (for selection)
    const { data: allFilesData, isLoading: isLoadingAllFiles } = useQuery({
        queryKey: ["files", projectId],
        queryFn: () => fileService.getFiles(projectId, 1, 100), // Get first 100 files
        enabled: !!projectId && isDialogOpen,
    })

    // 3. Mutation to link file
    const linkFileMutation = useMutation({
        mutationFn: async (fileId: string) => {
            await taskService.addFileToTask(taskId, fileId)
        },
        onSuccess: () => {
            toast.success("Document linked successfully")
            queryClient.invalidateQueries({ queryKey: ["task-files", taskId] })
            setIsDialogOpen(false)
        },
        onError: () => {
            toast.error("Failed to link document")
        }
    })

    // 4. Handle Link
    const handleLinkFile = (fileId: string) => {
        linkFileMutation.mutate(fileId)
    }

    // 5. Download handler
    const handleDownload = async (fileId: string) => {
        try {
            const { downloadUrl } = await fileService.getDownloadUrl(fileId, teamId)
            window.open(downloadUrl, "_blank")
        } catch (error) {
            toast.error("Failed to get download link")
        }
    }

    // New Mutation: Unlink
    const unlinkFileMutation = useMutation({
        mutationFn: async (fileId: string) => {
            await taskService.removeFileFromTask(taskId, fileId)
        },
        onSuccess: () => {
            toast.success("Document unlinked successfully")
            queryClient.invalidateQueries({ queryKey: ["task-files", taskId] })
        },
        onError: () => {
            toast.error("Failed to unlink document")
        }
    })

    const handleUnlink = (fileId: string) => {
        unlinkFileMutation.mutate(fileId)
    }

    // Upload Logic
    const [isUploading, setIsUploading] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const { uploadUrl, fileId } = await fileService.initiateUpload(
                { fileName: file.name, fileType: file.type },
                projectId
            )

            const response = await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            })

            if (!response.ok) {
                throw new Error("Failed to upload to storage")
            }

            await fileService.confirmUpload(fileId)
            await taskService.addFileToTask(taskId, fileId)

            toast.success("File uploaded and linked successfully")
            queryClient.invalidateQueries({ queryKey: ["task-files", taskId] })
            queryClient.invalidateQueries({ queryKey: ["files", projectId] })
            setIsDialogOpen(false)

        } catch (error) {
            console.error(error)
            toast.error("Failed to upload file")
        } finally {
            setIsUploading(false)
        }
    }

    // Preview Logic
    const [previewFile, setPreviewFile] = React.useState<Attachment | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)

    const handlePreview = async (file: any) => {
        try {
            const { viewUrl } = await fileService.getPreviewUrl(file._id || file.id, projectId)
            const attachment: Attachment = {
                id: file._id || file.id,
                taskId: taskId,
                fileName: file.originalName || file.fileName,
                fileUrl: viewUrl,
                uploadedById: file.userId || "",
                uploadedAt: file.createdAt || new Date().toISOString(),
                fileType: file.mimetype || file.fileType || "application/octet-stream",
                fileSize: file.size || 0
            }
            setPreviewFile(attachment)
            setIsPreviewOpen(true)
        } catch (error) {
            toast.error("Failed to load preview")
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Paperclip className="h-4 w-4" />
                <span>Documents</span>
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                    {attachedFiles.length}
                </span>
            </div>

            <div className="grid gap-2">
                {isLoadingAttached ? (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : attachedFiles.length === 0 ? (
                    <div className="text-sm text-muted-foreground flex items-center justify-between border rounded-md p-3 border-dashed">
                        <span>No documents attached</span>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 gap-1">
                                    <Plus className="h-3 w-3" /> Add
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Link Document</DialogTitle>
                                    <DialogDescription>
                                        Choose a document to link to this task.
                                    </DialogDescription>
                                </DialogHeader>
                                <Tabs defaultValue="select" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="select">Select Existing</TabsTrigger>
                                        <TabsTrigger value="upload">Upload New</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="select" className="mt-4">
                                        <ScrollArea className="h-[300px] pr-4">
                                            <DocumentList
                                                files={allFilesData?.data || []}
                                                isLoading={isLoadingAllFiles}
                                                attachedFiles={attachedFiles}
                                                onLink={handleLinkFile}
                                                isLinking={linkFileMutation.isPending}
                                            />
                                        </ScrollArea>
                                    </TabsContent>
                                    <TabsContent value="upload" className="mt-4">
                                        <UploadTab
                                            onFileSelect={handleFileSelect}
                                            isUploading={isUploading}
                                            fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {attachedFiles.map((file: any) => (
                            <AttachedFileItem
                                key={file.id || file._id}
                                file={file}
                                onDownload={handleDownload}
                                onUnlink={handleUnlink}
                                onPreview={handlePreview}
                                isUnlinking={unlinkFileMutation.isPending}
                            />
                        ))}
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full h-8 border-dashed text-muted-foreground hover:text-foreground">
                                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Document
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Link Document</DialogTitle>
                                    <DialogDescription>
                                        Choose a document to link to this task.
                                    </DialogDescription>
                                </DialogHeader>
                                <Tabs defaultValue="select" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="select">Select Existing</TabsTrigger>
                                        <TabsTrigger value="upload">Upload New</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="select" className="mt-4">
                                        <ScrollArea className="h-[300px] pr-4">
                                            <DocumentList
                                                files={allFilesData?.data || []}
                                                isLoading={isLoadingAllFiles}
                                                attachedFiles={attachedFiles}
                                                onLink={handleLinkFile}
                                                isLinking={linkFileMutation.isPending}
                                            />
                                        </ScrollArea>
                                    </TabsContent>
                                    <TabsContent value="upload" className="mt-4">
                                        <UploadTab
                                            onFileSelect={handleFileSelect}
                                            isUploading={isUploading}
                                            fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
            <FilePreviewDialog
                isOpen={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                file={previewFile}
            />
        </div>
    )
}
