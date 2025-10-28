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
import { KnowledgeFile } from "../types/type";

interface KnowledgeSidebarProps {
  files: KnowledgeFile[];
  isLoadingFiles: boolean;
  isUploading: boolean;
  uploadStatus: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDelete: (file: KnowledgeFile) => Promise<void>;
  handleOpenFileViewer: (file: KnowledgeFile) => void;
  handleSummarize: (file: KnowledgeFile) => void; // Lấy từ hook chat
}

export function KnowledgeSidebar({
  files,
  isLoadingFiles,
  isUploading,
  uploadStatus,
  fileInputRef,
  handleFileUpload,
  handleFileDelete,
  handleOpenFileViewer,
  handleSummarize,
}: KnowledgeSidebarProps) {
  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 p-4 h-full">
      <div className="pb-4 border-b border-slate-200 mb-4">
        <h3 className="text-lg font-semibold">Knowledge Base</h3>
        <p className="text-sm text-slate-500">Các file AI sẽ học để trả lời.</p>
      </div>

      {/* Upload Button */}
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

      {/* File List Area */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {isLoadingFiles ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
          </div>
        ) : files.length === 0 ? (
          <p className="text-sm text-slate-400 text-center">
            Chưa có file nào.
          </p>
        ) : (
          files.map((file) => (
            <div
              key={file.fileId}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg group"
            >
              {/* File Icon */}
              {file.fileType === "pdf" ? (
                <FileIcon size={20} className="text-red-500 flex-shrink-0" />
              ) : file.fileType === "txt" ? (
                <FileText size={20} className="text-blue-500 flex-shrink-0" />
              ) : (
                <FileIcon size={20} className="text-slate-500 flex-shrink-0" />
              )}
              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  title={file.fileName}
                >
                  {file.fileName}
                </p>
              </div>
              {/* Action Buttons (Show on hover) */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {(file.fileType === "pdf" || file.fileType === "txt") && (
                  <button
                    title={file.fileType === "txt" ? "Xem/Sửa" : "Xem"}
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
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
