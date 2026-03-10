"use client";

import * as React from "react";
import {
    CheckCircle2,
    FileText,
    Loader2,
    Bot,
    XCircle,
    X,
    Paperclip,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MarkdownRenderer } from "./markdown-renderer";
import { AiMessage, Attachment, AttachmentType, FileVisibility } from "@/types";
import type { AttachedFile } from "@/hooks/useAiFileUpload";
import { fileService } from "@/services/fileService";
import { FilePreviewDialog } from "@/components/features/documentation/file-preview-dialog";

interface MessageListProps {
    messages: AiMessage[];
    streamingContent: string;
    isStreaming: boolean;
    isFetchingNextPage: boolean;
    activeId: string | undefined;
    viewportRef: React.RefObject<HTMLDivElement | null>;
    topRef: (node?: Element | null) => void;
    bottomRef: React.RefObject<HTMLDivElement | null>;
    /** Files pending upload — shown as a live preview "message" at the bottom */
    pendingFiles?: AttachedFile[];
    onRemovePendingFile?: (localKey: string) => void;
}

function getFileExt(name: string) {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(ext)) return "PDF";
    if (["doc", "docx"].includes(ext)) return "DOC";
    if (["xls", "xlsx", "csv"].includes(ext)) return "XLS";
    if (["md", "txt"].includes(ext)) return "TXT";
    return "FILE";
}

function AttachmentCard({
    file,
    onRemove,
}: {
    file: AttachedFile;
    onRemove?: () => void;
}) {
    const isPending = file.status === "pending";
    const isUploading = file.status === "uploading";
    const isProcessing = file.status === "processing";
    const isCompleted = file.status === "completed";
    const isError = file.status === "error";
    const canRemove = isPending && !!onRemove;

    const statusLabel = isPending
        ? "Attached · will upload on send"
        : isUploading
        ? "Uploading…"
        : isProcessing
        ? "AI indexing…"
        : isCompleted
        ? "Indexed & ready"
        : "Failed";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -4 }}
            transition={{ duration: 0.18 }}
            className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 border transition-all w-56",
                isPending &&
                    "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700",
                isUploading &&
                    "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800",
                isProcessing &&
                    "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
                isCompleted &&
                    "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
                isError &&
                    "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
            )}
        >
            {/* Icon */}
            <div
                className={cn(
                    "shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-bold",
                    isPending && "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                    isUploading && "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
                    isProcessing && "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
                    isCompleted && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300",
                    isError && "bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-400"
                )}
            >
                {getFileExt(file.originalName)}
            </div>

            {/* Name + status */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100 leading-tight">
                    {file.originalName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                    {(isUploading || isProcessing) && (
                        <Loader2 className="h-3 w-3 animate-spin shrink-0 text-current opacity-60" />
                    )}
                    {isCompleted && (
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500 dark:text-emerald-400" />
                    )}
                    {isError && (
                        <XCircle className="h-3 w-3 shrink-0 text-red-500" />
                    )}
                    {isPending && (
                        <Paperclip className="h-3 w-3 shrink-0 opacity-40" />
                    )}
                    <span
                        className={cn(
                            "text-[11px] leading-none",
                            isPending && "text-zinc-400 dark:text-zinc-500",
                            isUploading && "text-blue-500 dark:text-blue-400",
                            isProcessing && "text-amber-600 dark:text-amber-400",
                            isCompleted && "text-emerald-600 dark:text-emerald-400",
                            isError && "text-red-500"
                        )}
                    >
                        {statusLabel}
                    </span>
                </div>
            </div>

            {/* Remove (only for pending) */}
            {canRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity rounded-full p-0.5"
                    aria-label={`Remove ${file.originalName}`}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </motion.div>
    );
}

export const MessageList = ({
    messages,
    streamingContent,
    isStreaming,
    isFetchingNextPage,
    activeId,
    viewportRef,
    topRef,
    bottomRef,
    pendingFiles = [],
    onRemovePendingFile,
}: MessageListProps) => {
    const hasPending = pendingFiles.length > 0;
    const hasUploadingOrProcessing = pendingFiles.some(
        (f) => f.status === "uploading" || f.status === "processing"
    );

    const [previewFile, setPreviewFile] = React.useState<Attachment | null>(null);
    const [previewOpen, setPreviewOpen] = React.useState(false);
    
    const handlePreviewFile = async (fileId: string, name: string) => {
        try {
            const { viewUrl } = await fileService.getPreviewUrl(fileId);
            const mockAttachment: Attachment = {
                id: fileId,
                name: name,
                fileName: name,
                fileUrl: viewUrl || "",
                fileType: AttachmentType.FILE,
                taskId: "chat",
                uploadedById: "system",
                uploadedAt: new Date().toISOString(),
                fileSize: 0,
                mimeType: name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
                visibility: FileVisibility.PRIVATE
            };
            setPreviewFile(mockAttachment);
            setPreviewOpen(true);
        } catch (error) {
            console.error("Failed to get preview URL:", error);
        }
    };

    return (
        <div ref={viewportRef} className="flex-1 overflow-y-auto px-4">
            <div className="max-w-3xl mx-auto py-8">
                <FilePreviewDialog 
                    isOpen={previewOpen}
                    onOpenChange={setPreviewOpen}
                    file={previewFile}
                />
                {activeId && (
                    <div
                        ref={topRef}
                        className="h-6 w-full flex justify-center items-center mb-4"
                    >
                        {isFetchingNextPage && (
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                        )}
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {messages.length === 0 && !streamingContent && !hasPending ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4"
                        >
                            <div className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
                                <Bot className="h-6 w-6 text-zinc-900 dark:text-zinc-100" />
                            </div>
                            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                                How can I help you today?
                            </h1>
                        </motion.div>
                    ) : (
                        <div className="space-y-6 pb-4">
                            {/* ── Saved messages ───────────────────────────── */}
                            {messages.map((msg: AiMessage) => {
                                const isAi = msg.sender._id === "AI_ID";
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        key={msg._id}
                                        className={cn(
                                            "flex w-full gap-4",
                                            !isAi ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {isAi && (
                                            <Avatar className="h-8 w-8 shrink-0 border border-zinc-200 dark:border-zinc-700">
                                                <AvatarFallback className="bg-zinc-50 dark:bg-zinc-800">
                                                    <Bot className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}

                                        <div
                                            className={cn(
                                                "relative max-w-[85%] md:max-w-[75%] px-5 rounded-2xl text-[15px] leading-relaxed flex flex-col gap-2",
                                                !isAi
                                                    ? "bg-zinc-100 py-3.5 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tr-sm"
                                                    : "bg-transparent ml-2 text-zinc-900 dark:text-zinc-100 px-0 md:px-0 lg:px-0 mt-0"
                                            )}
                                        >
                                            {msg.metadata?.files && msg.metadata.files.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-1 mt-1">
                                                    {msg.metadata.files.map((f: {fileId: string; name: string}) => (
                                                        <div 
                                                          onClick={() => handlePreviewFile(f.fileId, f.name)}
                                                          key={f.fileId} 
                                                          className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg border border-black/5 dark:border-white/10 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                                            <div className="h-7 w-7 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 rounded flex items-center justify-center text-[9px] font-bold shrink-0">
                                                                {getFileExt(f.name)}
                                                            </div>
                                                            <span className="text-sm truncate max-w-[180px] font-medium">{f.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div
                                                className={cn(
                                                    "prose dark:prose-invert max-w-none wrap-break-word prose-p:leading-7 prose-pre:bg-zinc-900 prose-pre:rounded-lg prose-pre:p-4",
                                                    isAi && "prose-zinc"
                                                )}
                                            >
                                                <MarkdownRenderer text={msg.content} />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* ── Streaming AI response ─────────────────────── */}
                            {streamingContent && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex w-full gap-4 justify-start"
                                >
                                    <Avatar className="h-8 w-8 shrink-0 border border-zinc-200 dark:border-zinc-700">
                                        <AvatarFallback className="bg-zinc-50 dark:bg-zinc-800">
                                            <Bot className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="relative max-w-[85%] md:max-w-[75%] text-[15px] leading-relaxed -ml-2 text-zinc-900 dark:text-zinc-100">
                                        <MarkdownRenderer text={streamingContent} />
                                        <span className="inline-block w-2 h-4 ml-1 bg-zinc-900 dark:bg-zinc-100 animate-pulse align-middle rounded-sm" />
                                    </div>
                                </motion.div>
                            )}

                            {/* ── Typing dot animation ──────────────────────── */}
                            {isStreaming && !streamingContent && (
                                <div className="flex gap-2 items-center ml-12">
                                    <span className="h-2 w-2 bg-zinc-300 dark:bg-zinc-700 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="h-2 w-2 bg-zinc-300 dark:bg-zinc-700 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="h-2 w-2 bg-zinc-300 dark:bg-zinc-700 rounded-full animate-bounce" />
                                </div>
                            )}

                            {/* ── Pending attachment preview ────────────────── */}
                            <AnimatePresence>
                                {hasPending && (
                                    <motion.div
                                        key="pending-attachments"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex w-full justify-end"
                                    >
                                        <div className="flex flex-col items-end gap-2 max-w-[85%] md:max-w-[75%]">
                                            {/* Label */}
                                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 pr-1">
                                                {hasUploadingOrProcessing ? (
                                                    <>
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                        <span>Uploading files…</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Paperclip className="h-3 w-3" />
                                                        <span>
                                                            {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""} attached · send to upload
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* File cards */}
                                            <div className="flex flex-wrap gap-2 justify-end">
                                                <AnimatePresence>
                                                    {pendingFiles.map((file) => (
                                                        <AttachmentCard
                                                            key={file.localKey}
                                                            file={file}
                                                            onRemove={
                                                                file.status === "pending"
                                                                    ? () => onRemovePendingFile?.(file.localKey)
                                                                    : undefined
                                                            }
                                                        />
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div ref={bottomRef} className="h-4" />
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
