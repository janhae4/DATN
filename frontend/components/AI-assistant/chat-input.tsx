"use client";

import * as React from "react";
import { ArrowUp, CheckCircle2, Loader2, Paperclip, X, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { UploadedFile, FileUploadStatus } from "@/hooks/useAiFileUpload";

interface ChatInputProps {
    input: string;
    setInput: (val: string) => void;
    onSend: () => void;
    isStreaming: boolean;
    uploadedFiles: UploadedFile[];
    isUploading: boolean;
    onUploadFiles: (files: File[]) => void;
    onRemoveFile: (localKey: string) => void;
    teamId?: string;
}

const FILE_STATUS_CONFIG: Record<FileUploadStatus, { label: string; icon: React.ReactNode; className: string }> = {
    idle: {
        label: "Pending",
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    },
    uploading: {
        label: "Uploading...",
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        className: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    processing: {
        label: "Processing...",
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        className: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
    completed: {
        label: "Ready",
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    error: {
        label: "Failed",
        icon: <XCircle className="h-3 w-3" />,
        className: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    },
};

function FileBadge({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) {
    const config = FILE_STATUS_CONFIG[file.status];
    const isRemovable = file.status !== "uploading";

    return (
        <motion.div
            key={file.localKey}
            layout
            initial={{ opacity: 0, scale: 0.85, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            title={file.errorMessage || file.originalName}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                "max-w-[180px] border",
                config.className,
                file.status === "completed" && "border-emerald-200 dark:border-emerald-800",
                file.status === "processing" && "border-amber-200 dark:border-amber-800",
                file.status === "uploading" && "border-blue-200 dark:border-blue-800",
                file.status === "error" && "border-red-200 dark:border-red-800",
                (file.status === "idle" || !["completed","processing","uploading","error"].includes(file.status)) && "border-zinc-200 dark:border-zinc-700",
            )}
        >
            {config.icon}
            <span className="truncate max-w-[100px]">{file.originalName}</span>
            <span className="opacity-70 shrink-0">&nbsp;·&nbsp;{config.label}</span>
            {isRemovable && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="ml-0.5 rounded-full opacity-50 hover:opacity-100 transition-opacity shrink-0"
                    aria-label={`Remove ${file.originalName}`}
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </motion.div>
    );
}

export const ChatInput = ({
    input,
    setInput,
    onSend,
    isStreaming,
    uploadedFiles,
    isUploading,
    onUploadFiles,
    onRemoveFile,
    teamId,
}: ChatInputProps) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (input.trim() && !isStreaming) {
                onSend();
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            onUploadFiles(files);
        }
        // Reset so same file can be re-selected
        e.target.value = "";
    };

    const hasFiles = uploadedFiles.length > 0;

    return (
        <div className="shrink-0 py-4 px-4 bg-white dark:bg-zinc-950">
            <div className="max-w-3xl mx-auto">
                {/* File badges area */}
                <AnimatePresence>
                    {hasFiles && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-wrap gap-1.5 mb-2.5 px-1"
                        >
                            <AnimatePresence>
                                {uploadedFiles.map((file) => (
                                    <FileBadge
                                        key={file.localKey}
                                        file={file}
                                        onRemove={() => onRemoveFile(file.localKey)}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div
                    className={cn(
                        "relative flex items-end w-full p-2 gap-2 transition-all duration-200 ease-in-out",
                        "border border-zinc-200 dark:border-zinc-800 rounded-2xl",
                        "bg-zinc-50/50 dark:bg-zinc-900/50",
                        "focus-within:bg-white dark:focus-within:bg-black",
                        "focus-within:border-zinc-300 dark:focus-within:border-zinc-700",
                        "focus-within:shadow-[0_2px_20px_rgba(0,0,0,0.05)] dark:focus-within:shadow-none"
                    )}
                >
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.txt,.doc,.docx,.md,.csv"
                        className="hidden"
                        onChange={handleFileChange}
                        id="ai-file-upload-input"
                    />

                    {/* Attach button */}
                    <div className="shrink-0 pb-1 pl-1">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors",
                                isUploading && "opacity-50 cursor-not-allowed"
                            )}
                            title="Attach files"
                            id="ai-attach-file-btn"
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Paperclip className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {/* Text Area */}
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className={cn(
                            "flex-1 min-h-[44px] max-h-64 py-3 px-3",
                            "bg-transparent border-none focus-visible:ring-0 shadow-none",
                            "text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                            "text-[15px] leading-relaxed resize-none scrollbar-none"
                        )}
                        rows={1}
                        id="ai-chat-textarea"
                    />

                    {/* Send Button */}
                    <div className="flex shrink-0 pb-1 pr-1">
                        <Button
                            size="icon"
                            onClick={onSend}
                            disabled={!input.trim() || isStreaming}
                            className={cn(
                                "h-8 w-8 rounded-full transition-all duration-200",
                                input.trim() && !isStreaming
                                    ? "bg-black text-white dark:bg-white dark:text-black hover:opacity-90 shadow-sm"
                                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
                            )}
                            id="ai-send-btn"
                        >
                            <AnimatePresence mode="wait">
                                {isStreaming ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                    >
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="send"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                    >
                                        <ArrowUp className="h-4 w-4 stroke-[2.5px]" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Button>
                    </div>
                </div>

                {/* Footer Text */}
                <div className="text-center mt-3">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-medium">
                        Enter to send <span className="mx-1 opacity-30">|</span> Shift + Enter for new line
                        {hasFiles && (
                            <> <span className="mx-1 opacity-30">|</span> {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""} attached</>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};