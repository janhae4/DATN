import React from "react";
import {
  Loader2,
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  Eye,
  File as FileIcon,
} from "lucide-react";
import { KnowledgeFile, FileStatus } from "../types/type";
import FileStatusDot from "./FileStatusDot";

const determineFileTypeFromId = (fileId: string): "pdf" | "txt" | "other" => {
  if (!fileId) return "other";
  const filename = fileId.includes("/") ? fileId.split("/").pop() : fileId;
  const extension = filename?.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "pdf";
  if (extension === "txt") return "txt";
  return "other";
};

interface FileTypeIconProps {
  fileId: string;
  size?: number;
  className?: string;
}

export const FileTypeIcon: React.FC<FileTypeIconProps> = ({
  fileId,
  size = 20,
  className = "",
}) => {
  const fileType = determineFileTypeFromId(fileId);

  switch (fileType) {
    case "pdf":
      return (
        <FileIcon
          size={size}
          className={`text-red-500 flex-shrink-0 ${className}`}
        />
      );
    case "txt":
      return (
        <FileText
          size={size}
          className={`text-blue-500 flex-shrink-0 ${className}`}
        />
      );
    default:
      return (
        <FileIcon
          size={size}
          className={`text-slate-500 flex-shrink-0 ${className}`}
        />
      );
  }
};

const getStatusTooltip = (status: FileStatus): string => {
  switch (status) {
    case FileStatus.PROCESSING:
      return "Đang xử lý...";
    case FileStatus.UPLOADED:
      return "Đã tải lên, chờ xử lý...";
    case FileStatus.COMPLETED:
      return "Đã xử lý";
    case FileStatus.FAILED:
      return "Xử lý thất bại";
    case FileStatus.PENDING:
      return "Đang chờ upload...";
    default:
      return "";
  }
};

interface KnowledgeSidebarProps {
  files: KnowledgeFile[];
  isLoadingFiles: boolean;
  isUploading: boolean;
  uploadStatus: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  fileContainerRef: React.RefObject<HTMLDivElement | null>;
  endFileRef: React.RefObject<HTMLDivElement | null>;
  isLoadingMore: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDelete: (file: KnowledgeFile) => Promise<void>;
  handleOpenFileViewer: (file: KnowledgeFile) => void;
  handleSummarize: (file: KnowledgeFile) => void;
}

export function KnowledgeSidebar({
  files,
  isLoadingFiles,
  isUploading,
  uploadStatus,
  fileInputRef,
  fileContainerRef,
  endFileRef,
  isLoadingMore,
  handleFileUpload,
  handleFileDelete,
  handleOpenFileViewer,
  handleSummarize,
}: KnowledgeSidebarProps) {
  const sortedFiles = [...files].sort((a, b) => {
    const processingA = [
      FileStatus.PROCESSING,
      FileStatus.UPLOADED,
      FileStatus.PENDING,
    ].includes(a.status);
    const processingB = [
      FileStatus.PROCESSING,
      FileStatus.UPLOADED,
      FileStatus.PENDING,
    ].includes(b.status);
    if (processingA && !processingB) return -1;
    if (!processingA && processingB) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const uniqueFiles = Array.from(
    new Map(sortedFiles.map((file) => [file.id, file])).values()
  );

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 p-4 h-full">
      <div className="pb-4 border-b border-slate-200 mb-4">
        <h3 className="text-lg font-semibold">Knowledge Base</h3>
        <p className="text-sm text-slate-500">Các file AI sẽ học để trả lời.</p>
      </div>

      <div className="mb-4">
        <label className="w-full cursor-pointer flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 px-4 rounded-lg transition-colors">
          <UploadCloud className="w-5 h-5" />
          Tải file mới...
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải lên...
          </div>
        )}
        {uploadStatus && !isUploading && (
          <p className="text-xs text-center mt-2 text-slate-500">
            {uploadStatus}
          </p>
        )}
      </div>

      <div
        ref={fileContainerRef}
        className="flex-1 overflow-y-auto space-y-2 pr-2 h-[calc(100vh-250px)]" // Thêm chiều cao cố định
      >
        {isLoadingFiles ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
          </div>
        ) : sortedFiles.length === 0 ? (
          <p className="text-sm text-slate-400 text-center">
            Chưa có file nào.
          </p>
        ) : (
          uniqueFiles.map((file) => {
            const isProcessing = [
              FileStatus.PROCESSING,
              FileStatus.PROCCESSED,
              FileStatus.UPLOADED,
              FileStatus.PENDING,
              FileStatus.UPDATING,
            ].includes(file.status);
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg group"
                title={getStatusTooltip(file.status)}
              >
                <div className="flex-1 min-w-0 flex items-start gap-2">
                  <FileTypeIcon fileId={file.id} />
                  <p
                    className={`text-sm font-medium truncate ${
                      isProcessing ? "text-slate-400" : ""
                    }`}
                    title={file.name}
                  >
                    {file.name}
                  </p>
                  <FileStatusDot status={file.status} />
                </div>

                {!isProcessing && (
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {(file.type === "pdf" || file.type === "txt") && (
                      <button
                        title={file.type === "txt" ? "Xem/Sửa" : "Xem"}
                        onClick={() => handleOpenFileViewer(file)}
                        className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      title="Tóm tắt file này"
                      onClick={() => handleSummarize(file)}
                      className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      title="Xóa"
                      onClick={() => handleFileDelete(file)}
                      className="p-1 text-slate-500 hover:text-red-600 rounded hover:bg-slate-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoadingMore && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
          </div>
        )}

        <div ref={endFileRef} style={{ height: "10px" }} />
      </div>
    </aside>
  );
}
