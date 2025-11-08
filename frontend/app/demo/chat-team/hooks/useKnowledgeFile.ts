import { useState, useEffect, useRef, useCallback } from "react";
import { ApiService } from "../services/api-service";
import { useSocket } from "@/app/SocketContext";
import { FileStatus, KnowledgeFile, PaginatedResponse, FileStatusEvent, KnowledgeFileResponse } from "../types/type";
import axios from "axios";
import { useInfiniteScroll } from "./useInfiniteroll";

// ----- HELPER FUNCTIONS -----

const determineFileType = (name: string): KnowledgeFile['type'] => {
    if (!name) return "other";
    const extension = name.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return "pdf";
    if (extension === "txt") return "txt";
    return "other";
};

const mapApiFileToKnowledgeFile = (apiFile: KnowledgeFileResponse): KnowledgeFile => ({
    id: apiFile._id,
    name: apiFile.originalName,
    status: apiFile.status,
    createdAt: apiFile.createdAt,
    size: 0,
    type: determineFileType(apiFile.originalName),
});

const mapEventToKnowledgeFile = (event: FileStatusEvent): KnowledgeFile => ({
    id: event.id,
    name: event.name,
    status: event.status,
    createdAt: new Date().toISOString(),
    size: 0,
    type: determineFileType(event.name),
});



export function useKnowledgeFiles(teamId?: string) {
    const { socket } = useSocket();
    const [files, setFiles] = useState<KnowledgeFile[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileContainerRef = useRef<HTMLDivElement>(null);
    const endFileRef = useRef<HTMLDivElement>(null);

    const fetchFiles = useCallback(async (pageToFetch = 1) => {
        if (pageToFetch === 1) setIsLoadingFiles(true);
        else setIsLoadingMore(true);
        try {
            const response: PaginatedResponse<KnowledgeFileResponse> = await ApiService.getKnowledgeFiles(
                teamId,
                pageToFetch,
                15
            );
            console.log("Fetched Files:", response);
            const mappedFiles = response.data.map(mapApiFileToKnowledgeFile);
            setFiles((prev) =>
                pageToFetch === 1 ? mappedFiles : [...prev, ...mappedFiles]
            );
            setPagination({
                page: response.page,
                totalPages: response.totalPages,
                totalItems: response.totalItems || 0,
            });
            fileContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) { console.error("Failed to load knowledge files:", err); }
        finally {
            setIsLoadingFiles(false);
            setIsLoadingMore(false);
        }
    }, [teamId]);

    useEffect(() => { fetchFiles(1); }, [fetchFiles]);

    useEffect(() => {
        if (!socket) return;

        const handleFileStatus = (data: FileStatusEvent) => {
            console.log("Socket event: file_status received", data);
            if (!data.id) {
                console.error("Socket event received without fileId:", data);
                return;
            }

            setFiles((prev) => {
                if (data.status === FileStatus.DELETED) {
                    return prev.filter((f) => f.id !== data.id);
                }

                const tempFileId = `temp-${data.id}`;
                const existingTempFileIndex = prev.findIndex(f => f.id === tempFileId);
                const existingRealFileIndex = prev.findIndex(f => f.id === data.id);
                if (data.status === FileStatus.UPLOADED || data.status === FileStatus.PROCCESSED && data.name) {
                    const realFile = mapEventToKnowledgeFile(data);
                    if (existingTempFileIndex !== -1) {
                        console.log(`Socket: Replacing temp file ${tempFileId} with real file ${data.id}.`);
                        const updatedFiles = [...prev];
                        updatedFiles[existingTempFileIndex] = realFile;
                        return updatedFiles;
                    } else if (existingRealFileIndex === -1) {
                        console.log(`Socket: Adding new file ${data.id} with status UPLOADED (no temp found).`);
                        return [realFile, ...prev];
                    } else {
                        console.log(`Socket: Real file ${data.id} already exists, updating status to UPLOADED.`);
                        const updatedFiles = [...prev];
                        updatedFiles[existingRealFileIndex] = {
                            ...updatedFiles[existingRealFileIndex],
                            status: data.status,
                            name: data.name || updatedFiles[existingRealFileIndex].name
                        };
                        return updatedFiles;
                    }
                }
                else {
                    const targetFileIndex = existingRealFileIndex !== -1 ? existingRealFileIndex : existingTempFileIndex;

                    if (targetFileIndex !== -1) {
                        const updatedFiles = [...prev];
                        const targetFile = updatedFiles[targetFileIndex];
                        if (targetFile.status !== data.status) {
                            console.log(`Socket: Updating status for file ${targetFile.id} to ${data.status}.`);
                            updatedFiles[targetFileIndex] = { ...targetFile, status: data.status };
                            if (data.name && targetFile.name !== data.name) {
                                updatedFiles[targetFileIndex].name = data.name;
                                updatedFiles[targetFileIndex].type = determineFileType(data.name);
                            }
                        } else {
                            console.log(`Socket: Status for file ${targetFile.id} is already ${data.status}. No update needed.`);
                        }
                        return updatedFiles;

                    } else {
                        if (data) {
                            console.warn(`Socket: Received status update for unknown fileId: ${data.id}. Adding it.`);
                            return [mapEventToKnowledgeFile(data), ...prev];
                        } else {
                            console.warn(`Socket: Received status update for unknown fileId: ${data} without file data. Ignoring.`);
                            return prev;
                        }
                    }
                }
            });

            if (data.status === FileStatus.UPLOADED && data) {
                setTimeout(() => setUploadStatus(""), 5000);
            } else if (data.status === FileStatus.COMPLETED) {
                setUploadStatus((prevStatus) => (prevStatus.includes(data.id) ? "" : prevStatus));
            } else if (data.status === FileStatus.FAILED) {
                const nameToShow = data.name || data.id;
                setUploadStatus((prevStatus) => (prevStatus.includes(data.id) ? `Processing failed for file ${nameToShow}.` : prevStatus));
                setTimeout(() => setUploadStatus(""), 5000);
            }
        };

        socket.on("file_status", handleFileStatus);
        return () => { socket.off("file_status", handleFileStatus); };
    }, [socket]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadStatus(`Đang lấy link cho '${file.name}'...`);
        let tempFileId = '';

        try {
            const { uploadUrl, fileId } = await ApiService.initiateUpload(file.name, teamId);
            tempFileId = `temp-${fileId}`;
            setUploadStatus(`Đang tải lên '${file.name}' (ID: ${fileId})...`);

            const tempFile: KnowledgeFile = {
                id: tempFileId,
                name: file.name,
                size: 0,
                type: determineFileType(file.name),
                status: FileStatus.PENDING,
                createdAt: new Date().toISOString(),
            };
            setFiles((prev) => [tempFile, ...prev]);
            fileContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

            await axios.put(uploadUrl, file, {
                headers: { "Content-Type": file.type },
                onUploadProgress: (progressEvent: any) => {
                    setFiles(prev => prev.map(f => f.id === tempFileId ? { ...f, status: FileStatus.UPLOADING } : f)); // Cập nhật trạng thái UPLOADING
                },
            });

            setFiles(prev => prev.map(f => f.id === tempFileId ? { ...f, status: FileStatus.UPLOADED } : f)); // Cập nhật trạng thái UPLOADED
            setUploadStatus(`Uploaded! Waiting for confirmation (ID: ${fileId})...`);

        } catch (error: any) {
            console.error("Failed to upload file:", error);
            setUploadStatus(`Upload failed: ${error.message || "Unknown error"}`);
            if (tempFileId) {
                setFiles(prev => prev.filter(f => f.id !== tempFileId));
            }
            setTimeout(() => setUploadStatus(""), 5000);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleFileDelete = async (file: KnowledgeFile) => {
        if (!confirm(`Bạn có chắc muốn xóa file "${file.name}"?`)) return;
        try {
            await ApiService.deleteKnowledgeFile(file.id, teamId);
        } catch (error: any) {
            console.error("Failed to delete file:", error);
            alert(`Xóa file thất bại: ${error.message}`);
        }
    };

    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewingFile, setViewingFile] = useState<KnowledgeFile | null>(null);

    const handleOpenFileViewer = (file: KnowledgeFile) => {
        if (file.type !== "pdf" && file.type !== "txt") { alert("Chỉ có thể xem/sửa file PDF và TXT."); return; }
        setViewingFile(file);
        setIsViewerOpen(true);
    };
    const handleCloseFileViewer = () => {
        console.log("Closing file viewer...");
        setViewingFile(null);
        setIsViewerOpen(false);
    };

    const handleRenameSuccess = useCallback(
        (fileId: string, newName: string) => {
            const fileType = determineFileType(newName);
            setFiles((prev) =>
                prev.map((doc) =>
                    doc.id === fileId
                        ? { ...doc, name: newName, type: fileType }
                        : doc
                )
            );
            setViewingFile((prev) =>
                prev && prev.id === fileId
                    ? { ...prev, name: newName, type: fileType }
                    : prev
            );
        },
        []
    );

    const handleLoadMoreFiles = useCallback(() => {
        if (!isLoadingMore && pagination.page < pagination.totalPages) {
            fetchFiles(pagination.page + 1);
        }
    }, [isLoadingMore, pagination, fetchFiles]);

    useInfiniteScroll({
        containerRef: fileContainerRef,
        endRef: endFileRef,
        loadOlder: handleLoadMoreFiles,
        count: files.length,
        isLoadingOlder: isLoadingMore,
        loadDirection: 'bottom',
        threshold: 150,
    });

    return {
        files,
        isLoadingFiles,
        isUploading,
        uploadStatus,
        fileInputRef,
        fileContainerRef,
        endFileRef,
        isViewerOpen,
        viewingFile,
        isLoadingMore,
        handleFileUpload,
        handleFileDelete,
        handleOpenFileViewer,
        handleCloseFileViewer,
        handleRenameSuccess,
    };
}

