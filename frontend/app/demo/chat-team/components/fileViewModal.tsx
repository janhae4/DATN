"use client";

import React, { useState, useEffect, useCallback, JSX, useRef } from "react";
import {
  Loader2,
  X,
  Edit,
  FileText,
  File as FileIcon,
  AlertTriangle,
} from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ApiService } from "../services/api-service";
import path from "path";
import PdfViewer from "./PdfViewer";
import { TextViewer } from "./TextViewer"; 
interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  originalName: string;
  fileType: "pdf" | "txt" | "other";
  onRenameSuccess: (fileId: string, newName: string) => void;
  teamId?: string;
}

export const FileViewerModal = ({
  isOpen,
  onClose,
  fileId,
  originalName,
  fileType,
  onRenameSuccess,
  teamId,
}: FileViewerModalProps): JSX.Element | null => {
  const [isLoading, setIsLoading] = useState(false); // Loading cho rename và fetch URL
  const [isPdfLoading, setIsPdfLoading] = useState(false); // Loading riêng cho render PDF
  const [error, setError] = useState<string | null>(null);
  const [contentUrl, setContentUrl] = useState<string | null>(null); // Đổi tên state để chỉ lưu URL
  const [isEditingName, setIsEditingName] = useState(false);
  const [currentName, setCurrentName] = useState(originalName);
  // Bỏ state: isEditingContent, textContent

  const containerRef = useRef<HTMLDivElement>(null);
  // Bỏ state: viewUrl (dùng contentUrl)

  const isTextFile = fileType === "txt";
  const isPdfFile = fileType === "pdf";

  const fetchFileContent = useCallback(async () => {
    if (!fileId || !isOpen) return;

    setIsLoading(true);
    if (isPdfFile) setIsPdfLoading(true); // Bật loading PDF
    setError(null);
    setContentUrl(null); // Reset URL

    try {
      const responseUrl = await ApiService.getFilePreview(fileId, teamId);
      const viewUrl = responseUrl.viewUrl;
      if (!viewUrl) throw new Error("Không nhận được URL xem file.");
      setContentUrl(viewUrl); // Chỉ lưu URL
    } catch (err: any) {
      console.error("Lỗi khi fetch nội dung file:", err);
      setError(
        `Không thể tải nội dung: ${err.message || "Lỗi không xác định"}`
      );
    } finally {
      setIsLoading(false);
      if (isPdfFile) setIsPdfLoading(false);
    }
  }, [fileId, isOpen, teamId, isPdfFile]);

  useEffect(() => {
    if (isOpen && fileId) {
      setCurrentName(originalName);
      setIsEditingName(false);
      fetchFileContent();
    }
  }, [isOpen, fileId, originalName, fetchFileContent]);

  const handleRename = async () => {
    const trimmedName = currentName.trim();
    const originalExt = path.extname(originalName);
    let finalName = trimmedName;
    if (trimmedName && !path.extname(trimmedName) && originalExt) {
      finalName += originalExt;
    }

    if (!finalName || finalName === originalName) {
      setCurrentName(originalName);
      setIsEditingName(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await ApiService.renameFile(fileId, finalName, teamId);
      onRenameSuccess(fileId, finalName);
      setIsEditingName(false);
    } catch (err: any) {
      console.error("Lỗi đổi tên file:", err);
      setError(`Lỗi đổi tên: ${err.message || "Lỗi không xác định"}`);
      setCurrentName(originalName);
      setIsEditingName(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[85vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-grow mr-4">
            {isTextFile ? (
              <FileText size={18} className="text-blue-600 flex-shrink-0" />
            ) : null}
            {isPdfFile ? (
              <FileIcon size={18} className="text-red-600 flex-shrink-0" />
            ) : null}
            {isEditingName ? (
              <input
                type="text"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                className="text-lg font-semibold border-b border-blue-500 outline-none flex-grow min-w-[100px] bg-transparent"
                autoFocus
                disabled={isLoading}
              />
            ) : (
              <h2
                className="text-lg font-semibold truncate cursor-pointer hover:text-blue-600"
                title={currentName}
                onClick={() => !isLoading && setIsEditingName(true)}
              >
                {currentName}
              </h2>
            )}
            {!isEditingName && !isLoading && (
              <button
                onClick={() => setIsEditingName(true)}
                title="Đổi tên"
                className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 flex-shrink-0"
              >
                <Edit size={16} />
              </button>
            )}
            {isLoading && isEditingName && (
              <Loader2
                size={16}
                className="animate-spin text-blue-600 flex-shrink-0"
              />
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100"
              title="Đóng"
              disabled={isLoading}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-auto p-4 relative bg-gray-50"
        >
          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <span className="ml-2 text-slate-600">Đang tải...</span>
            </div>
          )}
          {isPdfLoading && !isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <span className="ml-2 text-slate-600">Đang render PDF...</span>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center text-red-600 p-4 bg-red-50 rounded border border-red-200">
              <AlertTriangle className="w-8 h-8 mb-2" />
              <p className="font-semibold">Lỗi!</p>
              <p className="text-center text-sm">{error}</p>
            </div>
          )}

          {!isLoading && !error && contentUrl && (
            <>
              {isPdfFile && (
                <PdfViewer
                  setIsPdfLoading={setIsPdfLoading}
                  file={contentUrl}
                />
              )}

              {isTextFile && (
                <TextViewer
                  viewUrl={contentUrl}
                  fileId={fileId}
                  fileName={currentName}
                  teamId={teamId}
                />
              )}

              {!isPdfFile && !isTextFile && (
                <div className="flex flex-col items-center justify-center text-slate-500 p-4 h-full">
                  <FileIcon className="w-12 h-12 mb-2" />
                  <p>Không hỗ trợ xem trước cho loại file này.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div
        className="absolute inset-0 -z-10"
        onClick={() => !isLoading && onClose()}
      ></div>
    </div>
  );
};
