"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { fileService } from "@/services/fileService";
import mime from "mime-types";

export type FileUploadStatus =
    | "pending"      // selected but NOT yet uploaded (waiting for send)
    | "uploading"    // being uploaded to server
    | "processing"   // server is processing (AI indexing)
    | "completed"    // ready for RAG
    | "error";

export interface PendingFile {
    localKey: string;
    file: File;
    originalName: string;
    status: "pending";
}

export interface UploadedFile {
    localKey: string;
    originalName: string;
    /** fileId / storageKey returned by the server after upload */
    fileId?: string;
    status: FileUploadStatus;
    errorMessage?: string;
}

/** Union type for display in the UI */
export type AttachedFile = PendingFile | UploadedFile;

interface FileStatusSocketPayload {
    id: string;       // fileId
    name: string;
    status: "processing" | "completed" | "failed";
}

export function useAiFileUpload(teamId?: string) {
    const { socket, isConnected } = useSocket();

    /** Files selected by user but NOT yet uploaded */
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

    /** Files that have been uploaded (in-flight or done) */
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

    const [isUploading, setIsUploading] = useState(false);

    // Map fileId → localKey for socket updates
    const fileIdToLocalKey = useRef<Map<string, string>>(new Map());
    // Keep a stable ref to socket so closures can access latest socket
    const socketRef = useRef(socket);
    useEffect(() => { socketRef.current = socket; }, [socket]);

    // ── socket: track server-side processing status ──────────────────────────
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleFileStatus = (data: FileStatusSocketPayload) => {
            const localKey = fileIdToLocalKey.current.get(data.id);
            if (!localKey) return;

            setUploadedFiles((prev) =>
                prev.map((f) => {
                    if (f.localKey !== localKey) return f;
                    if (data.status === "completed") return { ...f, status: "completed" };
                    if (data.status === "failed") return { ...f, status: "error", errorMessage: "AI processing failed" };
                    if (data.status === "processing") return { ...f, status: "processing" };
                    return f;
                })
            );
        };

        socket.on("file_status", handleFileStatus);
        return () => { socket.off("file_status", handleFileStatus); };
    }, [socket, isConnected]);

    /**
     * Wait for ALL given fileIds to receive a `completed` or `failed` socket event.
     * Returns only the fileIds that completed successfully.
     * Uses the raw socket (not React state) so it is immune to state clearing.
     */
    const uploadedFilesRef = useRef(uploadedFiles);
    useEffect(() => {
        uploadedFilesRef.current = uploadedFiles;
    }, [uploadedFiles]);

    /**
     * Wait for ALL given fileIds to receive a `completed` or `failed` socket event.
     * Returns only the fileIds that completed successfully.
     * Checks current state first to avoid waiting for already-done files.
     */
    const waitForFilesCompleted = useCallback(
        (fileIds: string[], timeoutMs = 2_000): Promise<string[]> => {
            if (fileIds.length === 0) return Promise.resolve([]);

            const current = uploadedFilesRef.current;
            const alreadyCompleted = current
                .filter(f => f.fileId && fileIds.includes(f.fileId) && f.status === "completed")
                .map(f => f.fileId!);
            
            const alreadyFailed = current
                .filter(f => f.fileId && fileIds.includes(f.fileId) && f.status === "error")
                .map(f => f.fileId!);
            
            const remainingIds = fileIds.filter(id => !alreadyCompleted.includes(id) && !alreadyFailed.includes(id));

            if (remainingIds.length === 0) {
                return Promise.resolve(alreadyCompleted);
            }

            return new Promise<string[]>((resolve) => {
                const completed = new Set<string>(alreadyCompleted);
                const remaining = new Set(remainingIds);

                const timer = setTimeout(() => {
                    cleanup();
                    resolve([...completed]); 
                }, timeoutMs);

                const onStatus = (data: FileStatusSocketPayload) => {
                    if (!remaining.has(data.id)) return;
                    
                    if (data.status === "completed") {
                        completed.add(data.id);
                        remaining.delete(data.id);
                    } else if (data.status === "failed") {
                        remaining.delete(data.id);
                    }
                    
                    if (remaining.size === 0) {
                        cleanup();
                        resolve([...completed]);
                    }
                };

                const cleanup = () => {
                    clearTimeout(timer);
                    socketRef.current?.off("file_status", onStatus);
                };

                socketRef.current?.on("file_status", onStatus);
            });
        },
        []
    );



    // ── Add files to pending list (no upload yet) ─────────────────────────────
    const addPendingFiles = useCallback((files: File[]) => {
        if (files.length === 0) return;
        const newEntries: PendingFile[] = files.map((f) => ({
            localKey: `${f.name}-${Date.now()}-${Math.random()}`,
            file: f,
            originalName: f.name,
            status: "pending",
        }));
        setPendingFiles((prev) => [...prev, ...newEntries]);
    }, []);

    // ── Upload all pending files, return their storageKey IDs ────────────────
    const uploadPendingFiles = useCallback(async (): Promise<{fileId: string, originalName: string}[]> => {
        if (pendingFiles.length === 0) return [];

        const toUpload = [...pendingFiles];

        // Move each to uploadedFiles with status "uploading"
        const uploadingEntries: UploadedFile[] = toUpload.map((p) => ({
            localKey: p.localKey,
            originalName: p.originalName,
            status: "uploading",
        }));
        setPendingFiles([]);
        setUploadedFiles((prev) => [...prev, ...uploadingEntries]);
        setIsUploading(true);

        const collectedFiles: {fileId: string, originalName: string}[] = [];

        try {
            const results = await Promise.all(
                toUpload.map(async (entry) => {
                    try {
                        const fileType = mime.lookup(entry.file.name) || 'application/octet-stream';
                        const { uploadUrl, fileId, storageKey } = await fileService.initiateUpload(
                            {
                                fileName: entry.file.name,
                                fileType,
                                parentId: null,
                                isChatAttachment: true,
                            },
                            undefined,
                            teamId
                        );

                        await fileService.uploadFileToMinIO(uploadUrl, entry.file);

                        return {
                            status: "processing" as const,
                            fileId, // record ID for tracking
                            storageKey, // for RAG
                            originalName: entry.originalName,
                        };
                    } catch (error: any) {
                        return {
                            status: "error" as const,
                            originalName: entry.originalName,
                            message: error.message || "Failed to upload to MinIO"
                        };
                    }
                })
            );

            results.forEach((result, idx) => {
                const entry = toUpload[idx];
                if (!entry) return;
                if (result.status === "processing" && result.fileId) {
                    fileIdToLocalKey.current.set(result.fileId, entry.localKey);
                    collectedFiles.push({
                        fileId: result.storageKey || result.fileId, // Pass storageKey to AI
                        originalName: result.originalName || entry.originalName
                    });
                }
            });

            setUploadedFiles((prev) => {
                const updated = [...prev];
                results.forEach((result, idx) => {
                    const entry = toUpload[idx];
                    if (!entry) return;
                    const entryIdx = updated.findIndex((u) => u.localKey === entry.localKey);
                    if (entryIdx === -1) return;

                    if (result.status === "processing" && result.fileId) {
                        updated[entryIdx] = {
                            ...updated[entryIdx],
                            fileId: result.fileId,
                            originalName: result.originalName || entry.originalName,
                            status: "processing",
                        };
                    } else {
                        updated[entryIdx] = {
                            ...updated[entryIdx],
                            originalName: result.originalName || entry.originalName,
                            status: "error",
                            errorMessage: result.message || "Upload failed",
                        };
                    }
                });
                return updated;
            });

            // We skip waiting for socket here.
            // The waiting will be handled by the caller (handleSend) 
            // to ensure a single, consistent wait step.


        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Upload failed";
            setUploadedFiles((prev) =>
                prev.map((f) =>
                    toUpload.some((e) => e.localKey === f.localKey)
                        ? { ...f, status: "error", errorMessage: message }
                        : f
                )
            );
        } finally {
            setIsUploading(false);
        }

        return collectedFiles;
    }, [pendingFiles, teamId]);

    // ── Remove a pending file (before upload) ────────────────────────────────
    const removePendingFile = useCallback((localKey: string) => {
        setPendingFiles((prev) => prev.filter((f) => f.localKey !== localKey));
    }, []);

    // ── Remove an already-uploaded file ─────────────────────────────────────
    const removeUploadedFile = useCallback((localKey: string) => {
        setUploadedFiles((prev) => {
            const file = prev.find((f) => f.localKey === localKey);
            if (file?.fileId) fileIdToLocalKey.current.delete(file.fileId);
            return prev.filter((f) => f.localKey !== localKey);
        });
    }, []);

    // ── Remove either kind ───────────────────────────────────────────────────
    const removeFile = useCallback((localKey: string) => {
        removePendingFile(localKey);
        removeUploadedFile(localKey);
    }, [removePendingFile, removeUploadedFile]);

    // ── Clear everything ─────────────────────────────────────────────────────
    const clearFiles = useCallback(() => {
        fileIdToLocalKey.current.clear();
        setPendingFiles([]);
        setUploadedFiles([]);
    }, []);

    // ── Combined list for display ────────────────────────────────────────────
    const allFiles: AttachedFile[] = [...pendingFiles, ...uploadedFiles];
    const hasPendingFiles = pendingFiles.length > 0;
    const hasFiles = allFiles.length > 0;

    return {
        allFiles,
        pendingFiles,
        uploadedFiles,
        hasPendingFiles,
        hasFiles,
        isUploading,
        addPendingFiles,
        uploadPendingFiles,
        waitForFilesCompleted,
        removeFile,
        clearFiles,
    };
}
