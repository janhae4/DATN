"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { aiDiscussionService } from "@/services/aiDiscussionService";
import { useSocket } from "@/contexts/SocketContext";

export type FileUploadStatus = "idle" | "uploading" | "processing" | "completed" | "error";

export interface UploadedFile {
    /** Unique local key for tracking (before upload we use the File object reference) */
    localKey: string;
    originalName: string;
    /** fileId returned by the server after upload */
    fileId?: string;
    status: FileUploadStatus;
    errorMessage?: string;
}

interface FileStatusSocketPayload {
    id: string;       // fileId
    name: string;
    status: "processing" | "completed" | "failed";
}

export function useAiFileUpload(teamId?: string) {
    const { socket, isConnected } = useSocket();
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Track fileId -> localKey mapping for socket updates
    const fileIdToLocalKey = useRef<Map<string, string>>(new Map());

    // Listen for file_status socket events from the AI backend
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleFileStatus = (data: FileStatusSocketPayload) => {
            const localKey = fileIdToLocalKey.current.get(data.id);
            if (!localKey) return; // Not a file we uploaded in this session

            setUploadedFiles((prev) =>
                prev.map((f) => {
                    if (f.localKey !== localKey) return f;
                    if (data.status === "completed") {
                        return { ...f, status: "completed" };
                    } else if (data.status === "failed") {
                        return { ...f, status: "error", errorMessage: "AI processing failed" };
                    } else if (data.status === "processing") {
                        return { ...f, status: "processing" };
                    }
                    return f;
                })
            );
        };

        socket.on("file_status", handleFileStatus);
        return () => {
            socket.off("file_status", handleFileStatus);
        };
    }, [socket, isConnected]);

    const uploadFiles = useCallback(
        async (files: File[]) => {
            if (files.length === 0) return;

            // Register all files with "uploading" status immediately
            const newEntries: UploadedFile[] = files.map((f) => ({
                localKey: `${f.name}-${Date.now()}-${Math.random()}`,
                originalName: f.name,
                status: "uploading",
            }));

            setUploadedFiles((prev) => [...prev, ...newEntries]);
            setIsUploading(true);

            try {
                const results = await aiDiscussionService.uploadAiFiles(files, teamId);

                // Update entries with server response
                setUploadedFiles((prev) => {
                    const updated = [...prev];
                    results.forEach((result, idx) => {
                        const entry = newEntries[idx];
                        if (!entry) return;
                        const entryIdx = updated.findIndex((u) => u.localKey === entry.localKey);
                        if (entryIdx === -1) return;

                        if (result.status === "processing" && result.fileId) {
                            // Register the mapping for socket tracking
                            fileIdToLocalKey.current.set(result.fileId, entry.localKey);
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
            } catch (err: any) {
                // All files failed
                setUploadedFiles((prev) =>
                    prev.map((f) =>
                        newEntries.some((e) => e.localKey === f.localKey)
                            ? { ...f, status: "error", errorMessage: err?.message || "Upload failed" }
                            : f
                    )
                );
            } finally {
                setIsUploading(false);
            }
        },
        [teamId]
    );

    const removeFile = useCallback((localKey: string) => {
        setUploadedFiles((prev) => {
            const file = prev.find((f) => f.localKey === localKey);
            if (file?.fileId) {
                fileIdToLocalKey.current.delete(file.fileId);
            }
            return prev.filter((f) => f.localKey !== localKey);
        });
    }, []);

    const clearFiles = useCallback(() => {
        fileIdToLocalKey.current.clear();
        setUploadedFiles([]);
    }, []);

    return {
        uploadedFiles,
        isUploading,
        uploadFiles,
        removeFile,
        clearFiles,
    };
}
