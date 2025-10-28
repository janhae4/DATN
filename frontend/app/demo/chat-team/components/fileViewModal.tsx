import React, { useState, useEffect, useCallback, JSX } from "react";
import {
  Loader2,
  Save,
  X,
  Edit,
  FileText,
  File as FileIcon,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ApiService } from "../services/api-service";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  originalName: string;
  fileType: "pdf" | "txt" | "other";
  onRenameSuccess: (newFileId: string) => void;
  teamId?: string;
}

export const FileViewerModal = ({
  isOpen,
  onClose,
  fileId,
  originalName,
  fileType,
  onRenameSuccess,
  teamId
}: FileViewerModalProps): JSX.Element | null => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | File | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [currentName, setCurrentName] = useState(originalName);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const isTextFile = fileType === "txt";
  const isPdfFile = fileType === "pdf";

  const fetchFileContent = useCallback(async () => {
    if (!fileId) return;
    setIsLoading(true);
    setError(null);
    setContent(null);
    setNumPages(null);
    setPageNumber(1);
    try {
      const response = await ApiService.getFile(fileId, teamId);
      if (isPdfFile) {
        const blob = await response.blob();
        const pdfFile = new File([blob], originalName, { type: blob.type });
        setContent(pdfFile);
      } else if (isTextFile) {
        const text = await response.text();
        setContent(text);
        setTextContent(text);
      } else {
        setContent("Preview not available for this file type.");
      }
    } catch (err: any) {
      console.error("Error fetching file content:", err);
      setError(
        `Không thể tải nội dung file: ${err.message || "Lỗi không xác định"}`
      );
    } finally {
      setIsLoading(false);
    }
  }, [fileId, isPdfFile, isTextFile]);

  useEffect(() => {
    if (isOpen) {
      setCurrentName(originalName);
      setIsEditingName(false);
      setIsEditingContent(false);
      fetchFileContent();
    }
  }, [isOpen, fileId, originalName, fetchFileContent]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const goToPrevPage = () =>
    setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 1));

  const goToNextPage = () =>
    setPageNumber((prevPageNumber) =>
      Math.min(prevPageNumber + 1, numPages || 1)
    );

  const handleRename = async () => {
    if (!currentName.trim() || currentName === originalName) {
      setIsEditingName(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const extension = originalName.split(".").pop()?.toLowerCase();
      const { newFileId } = await ApiService.renameFile(fileId, currentName, teamId);
      onRenameSuccess(newFileId);
      onClose();
    } catch (err: any) {
      console.error("Error renaming file:", err);
      setError(`Lỗi đổi tên file: ${err.message || "Lỗi không xác định"}`);
      setCurrentName(originalName);
    } finally {
      setIsLoading(false);
      setIsEditingName(false);
    }
  };

  const handleSaveContent = async () => {
    if (!isTextFile || textContent === content) {
      setIsEditingContent(false);
      return;
    }
    setIsLoading(true);
    try {
      const updatedBlob = new Blob([textContent], { type: "text/plain" });
      const updatedFile = new File([updatedBlob], currentName, {
        type: "text/plain",
      });
      await ApiService.updateFileContent(updatedFile, fileId);
      setContent(textContent);
      setIsEditingContent(false);
      setContent(textContent);
      setIsEditingContent(false);
    } catch (err: any) {
      console.error("Error saving file content:", err);
      setError(`Lỗi lưu nội dung file: ${err.message || "Lỗi không xác định"}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isTextFile ? (
              <FileText size={18} className="text-blue-600 flex-shrink-0" />
            ) : isPdfFile ? (
              <FileIcon size={18} className="text-red-600 flex-shrink-0" />
            ) : null}
            {isEditingName ? (
              <input
                type="text"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                className="text-lg font-semibold border-b border-blue-500 outline-none flex-grow min-w-[100px]"
                autoFocus
              />
            ) : (
              <h2
                className="text-lg font-semibold truncate cursor-pointer"
                title={currentName}
                onClick={() => setIsEditingName(true)}
              >
                {currentName}
              </h2>
            )}
            {!isEditingName && (
              <button
                onClick={() => setIsEditingName(true)}
                title="Đổi tên"
                className="text-slate-500 hover:text-slate-800 p-1"
              >
                <Edit size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isTextFile && (
              <>
                {isEditingContent ? (
                  <button
                    onClick={handleSaveContent}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-slate-300"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Lưu
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingContent(true)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Edit size={16} /> Sửa
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100"
              title="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body (Content Viewer) */}
        <div className="flex-1 overflow-auto p-4 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          )}
          {error && <p className="text-red-600">{error}</p>}

          {!isLoading && !error && (
            <>
              {/* PDF Viewer */}
              {isPdfFile && content instanceof File && (
                <div className="flex flex-col items-center">
                  <Document
                    file={content}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(pdfError) =>
                      setError(`Lỗi tải PDF: ${pdfError.message}`)
                    }
                    loading={
                      <Loader2
                        size={32}
                        className="animate-spin text-red-600"
                      />
                    }
                    className="w-full justify-center"
                  >
                    <Page
                      key={`page_${pageNumber}`}
                      pageNumber={pageNumber}
                      width={Math.min(window.innerWidth * 0.8, 800)}
                      renderAnnotationLayer={true}
                      renderTextLayer={true}
                    />
                  </Document>
                  {numPages && numPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mb-2 p-2 rounded bg-slate-100 bottom-0 sticky z-10 opacity-50 hover:opacity-100 transition-opacity">
                      <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className="px-3 py-1 rounded bg-slate-300 hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trang trước
                      </button>
                      <p className="text-sm text-slate-700 font-medium">
                        Trang {pageNumber} / {numPages}
                      </p>
                      <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                        className="px-3 py-1 rounded bg-slate-300 hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trang sau
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TXT Viewer/Editor */}
              {isTextFile &&
                typeof content === "string" &&
                (isEditingContent ? (
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full h-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                ) : (
                  <p className="whitespace-pre-wrap break-words text-sm tracking-tight">
                    {content}
                  </p>
                ))}

              {/* Other File Types */}
              {!isPdfFile && !isTextFile && typeof content === "string" && (
                <p className="text-slate-500">{content}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
