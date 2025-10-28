import React, { useState, useEffect, JSX } from "react";
import { Loader2, X, FilePlus } from "lucide-react";
import { ApiService } from "../../services/api-service";

interface CreateTextFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (file: any) => void;
}

export const CreateTextFileModal = ({
  isOpen,
  onClose,
  onUploadSuccess,
}: CreateTextFileModalProps): JSX.Element | null => {
  const [fileName, setFileName] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFileName("");
      setTextContent("");
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !textContent.trim()) {
      setError("Vui lòng nhập cả tên file và nội dung.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const finalFileName = fileName.endsWith(".txt")
        ? fileName
        : `${fileName}.txt`;

      const updatedBlob = new Blob([textContent], {
        type: "text/plain;charset=utf-8",
      });

      const fileToUpload = new File([updatedBlob], finalFileName, {
        type: "text/plain;charset=utf-8",
      });

      const newFileResponse = await ApiService.uploadNewFile(fileToUpload);
      onUploadSuccess(newFileResponse);
      onClose();
    } catch (err: any) {
      console.error("Error creating file:", err);
      setError(`Lỗi tạo file: ${err.message || "Lỗi không xác định"}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tạo file text mới</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {error && (
              <p className="text-red-600 bg-red-50 p-3 rounded">{error}</p>
            )}

            <div>
              <label
                htmlFor="fileName"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Tên file (sẽ tự động thêm .txt)
              </label>
              <input
                id="fileName"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Ví dụ: ghichu_cuatoi"
                className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="textContent"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Nội dung
              </label>
              <textarea
                id="textContent"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Nhập nội dung của bạn vào đây..."
                className="w-full h-48 p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Footer (Actions) */}
          <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <FilePlus size={18} />
              )}
              {isLoading ? "Đang tạo..." : "Tạo file"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
