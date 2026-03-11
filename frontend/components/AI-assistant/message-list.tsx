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
    inFlightText?: string;
    isProcessing?: boolean;
    onRemovePendingFile?: (localKey: string) => void;
}

import { AttachmentCard, getFileExt } from "./attachment-card";

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
    inFlightText = "",
    isProcessing = false,
    onRemovePendingFile,
}: MessageListProps) => {
    const hasPending = pendingFiles.length > 0;
    const hasUploadingOrProcessing = pendingFiles.some(
        (f) => f.status === "uploading" || f.status === "processing"
    );
    const hasAnyInFlight = hasPending || (isProcessing && inFlightText.trim().length > 0);


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
                                                        <AttachmentCard
                                                            key={f.fileId}
                                                            file={f}
                                                            isHistory
                                                            onClick={() => handlePreviewFile(f.fileId, f.name)}
                                                        />
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

                            {/* ── Pending attachment & in-flight message preview ────────────────── */}
                            <AnimatePresence>
                                {hasAnyInFlight && (
                                    <motion.div
                                        key="pending-everything"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.2 }}
                                        className={cn(
                                            "flex w-full flex-col gap-4 items-end",
                                            isProcessing && "opacity-60 grayscale-[0.3]"
                                        )}
                                    >
                                        {/* Status Text */}
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 pr-1">
                                            {hasUploadingOrProcessing ? (
                                                <>
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    <span>AI processing documents…</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                    <span>Ready to ask AI</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Combined Message Block (Blurred/Dimmed if processing) */}
                                        <div className={cn(
                                            "relative max-w-[85%] md:max-w-[75%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed flex flex-col gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tr-sm transition-all duration-300",
                                            isProcessing && "ring-1 ring-blue-500/20 shadow-lg"
                                        )}>
                                            {/* Files */}
                                            {pendingFiles.length > 0 && (
                                                <div className="flex flex-wrap gap-2 justify-end">
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
                                                </div>
                                            )}

                                            {/* Text */}
                                            {inFlightText && (
                                                <div className="prose dark:prose-invert max-w-none wrap-break-word">
                                                    <p>{inFlightText}</p>
                                                </div>
                                            )}
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
