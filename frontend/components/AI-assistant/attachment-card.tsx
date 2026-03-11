import * as React from "react";
import { CheckCircle2, Loader2, XCircle, X, Paperclip } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AttachedFile } from "@/hooks/useAiFileUpload";

export function getFileExt(name: string) {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(ext)) return "PDF";
    if (["doc", "docx"].includes(ext)) return "DOC";
    if (["xls", "xlsx", "csv"].includes(ext)) return "XLS";
    if (["md", "txt"].includes(ext)) return "TXT";
    return "FILE";
}

export function AttachmentCard({
    file,
    onRemove,
    onClick,
    isHistory = false,
}: {
    file: AttachedFile | { fileId: string; name: string };
    onRemove?: () => void;
    onClick?: () => void;
    isHistory?: boolean;
}) {
    // If it's a history file, it's already "completed"
    if (isHistory || !("status" in file)) {
        const name = "name" in file ? file.name : (file as AttachedFile).originalName;
        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.92, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: -4 }}
                transition={{ duration: 0.18 }}
                onClick={onClick}
                className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 border transition-all w-56",
                    "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800",
                    "bg-emerald-50/50 border-emerald-200/60 dark:bg-emerald-500/5 dark:border-emerald-500/20"
                )}
            >
                <div className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                    {getFileExt(name)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-emerald-950 dark:text-emerald-50 leading-tight">
                        {name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[11px] leading-none text-emerald-600 dark:text-emerald-400 font-medium">
                            Indexed & ready
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    }

    const liveFile = file as AttachedFile;
    const isPending = liveFile.status === "pending";
    const isUploading = liveFile.status === "uploading";
    const isProcessing = liveFile.status === "processing";
    const isCompleted = liveFile.status === "completed";
    const isError = liveFile.status === "error";
    const canRemove = isPending && !!onRemove;

    const statusLabel = isPending
        ? "Attached \u00b7 will upload on send"
        : isUploading
        ? "Uploading\u2026"
        : isProcessing
        ? "AI indexing\u2026"
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
            onClick={onClick}
            className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 border transition-all w-56",
                onClick && "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800",
                isPending && "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 shadow-sm",
                isUploading && "bg-blue-50/50 border-blue-200/60 dark:bg-blue-500/5 dark:border-blue-500/20",
                isProcessing && "bg-amber-50/50 border-amber-200/60 dark:bg-amber-500/5 dark:border-amber-500/20",
                isCompleted && "bg-emerald-50/50 border-emerald-200/60 dark:bg-emerald-500/5 dark:border-emerald-500/20",
                isError && "bg-red-50/50 border-red-200/60 dark:bg-red-500/5 dark:border-red-500/20"
            )}
        >
            <div
                className={cn(
                    "shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-bold",
                    isPending && "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                    isUploading && "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
                    isProcessing && "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                    isCompleted && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                    isError && "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                )}
            >
                {getFileExt(liveFile.originalName)}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100 leading-tight">
                    {liveFile.originalName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                    {(isUploading || isProcessing) && (
                        <Loader2 className="h-3 w-3 animate-spin shrink-0 text-current opacity-60" />
                    )}
                    {isCompleted && (
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}
                    {isError && (
                        <XCircle className="h-3 w-3 shrink-0 text-red-500" />
                    )}
                    {isPending && (
                        <Paperclip className="h-3 w-3 shrink-0 opacity-40" />
                    )}
                    <span
                        className={cn(
                            "text-[11px] leading-none font-medium",
                            isPending && "text-zinc-400 dark:text-zinc-500",
                            isUploading && "text-blue-600 dark:text-blue-400",
                            isProcessing && "text-amber-600 dark:text-amber-400",
                            isCompleted && "text-emerald-600 dark:text-emerald-400",
                            isError && "text-red-500"
                        )}
                    >
                        {statusLabel}
                    </span>
                </div>
            </div>

            {canRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity rounded-full p-0.5"
                    aria-label={`Remove ${liveFile.originalName}`}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </motion.div>
    );
}
