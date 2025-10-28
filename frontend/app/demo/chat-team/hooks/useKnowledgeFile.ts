import { useState, useEffect, useRef, useCallback } from "react";
import { ApiService } from "../services/api-service";

type KnowledgeFile = {
    fileId: string;
    fileName: string;
    fileType: "pdf" | "txt" | "other";
};

const determineFileType = (filename: string): "pdf" | "txt" | "other" => {
    if (!filename) return "other";
    const extension = filename.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return "pdf";
    if (extension === "txt") return "txt";
    return "other";
};

const determineFileName = (fileId: string) => {
    return fileId.split("_").pop() || "other";
};

export function useKnowledgeFiles(teamId?: string) {
    const [files, setFiles] = useState<KnowledgeFile[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State cho modal xem file
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewingFile, setViewingFile] = useState<KnowledgeFile | null>(null);

    useEffect(() => {
        const fetchFiles = async () => {
            setIsLoadingFiles(true);
            try {
                const fetchedFiles: string[] = await ApiService.getKnowledgeFiles(teamId);
                setFiles(
                    fetchedFiles.map((f) => ({
                        fileId: f,
                        fileName: determineFileName(f),
                        fileType: determineFileType(f),
                    }))
                );
            } catch (err) {
                console.error("Failed to load knowledge files:", err);
            } finally {
                setIsLoadingFiles(false);
            }
        };
        fetchFiles();
    }, [teamId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadStatus(`Đang tải lên '${file.name}'...`);
        try {
            const newFile = await ApiService.uploadKnowledgeFile(file, teamId);
            setFiles((prev) => [
                {
                    ...newFile,
                    fileType: determineFileType(newFile.originalName),
                    filename: newFile.originalName,
                },
                ...prev,
            ]);
            setUploadStatus(`Tải lên thành công! File đang được xử lý...`);
        } catch (error: any) {
            console.error("Failed to upload file:", error);
            setUploadStatus(`Lỗi tải lên: ${error.message || "Unknown error"}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setTimeout(() => setUploadStatus(""), 5000);
        }
    };

    const handleFileDelete = async (file: KnowledgeFile) => {
        if (!confirm(`Bạn có chắc muốn xóa file "${file.fileName}"?`)) return;

        try {
            await ApiService.deleteKnowledgeFile(file.fileId, teamId);
            setFiles((prev) => prev.filter((f) => f.fileId !== file.fileId));
        } catch (error) {
            console.error("Failed to delete file:", error);
            alert("Xóa file thất bại!");
        }
    };

    // 3. Xử lý modal xem file
    const handleOpenFileViewer = (file: KnowledgeFile) => {
        if (file.fileType !== "pdf" && file.fileType !== "txt") {
            alert("Chỉ có thể xem/sửa file PDF và TXT.");
            return;
        }
        setViewingFile(file);
        setIsViewerOpen(true);
    };

    const handleCloseFileViewer = () => {
        setViewingFile(null);
        setIsViewerOpen(false);
    };

    const handleRenameSuccess = useCallback(
        (newFileId: string) => {
            const oldId = viewingFile?.fileId;
            const newName = determineFileName(newFileId);
            setFiles((prev) =>
                prev.map((doc) =>
                    doc.fileId === oldId
                        ? { ...doc, fileId: newFileId, filename: newName, fileType: determineFileType(newName) }
                        : doc
                )
            );
            setViewingFile((prev) =>
                prev ? { ...prev, fileId: newFileId, filename: newName, fileType: determineFileType(newName) } : null
            );
        },
        [viewingFile]
    );

    return {
        files,
        isLoadingFiles,
        isUploading,
        uploadStatus,
        fileInputRef,
        isViewerOpen,
        viewingFile,
        handleFileUpload,
        handleFileDelete,
        handleOpenFileViewer,
        handleCloseFileViewer,
        handleRenameSuccess,
    };
}