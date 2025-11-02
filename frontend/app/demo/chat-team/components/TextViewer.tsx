"use client";

import React, { useState, useEffect, JSX } from "react";
import { Loader2, Save, Edit, AlertTriangle } from "lucide-react";
import axios from "axios";
import { ApiService } from "../services/api-service"; 
interface TextViewerProps {
  viewUrl: string;
  fileId: string;
  fileName: string;
  teamId?: string;
}

export const TextViewer = ({
  viewUrl,
  fileId,
  fileName,
  teamId,
}: TextViewerProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");

  useEffect(() => {
    if (!viewUrl) return;

    const fetchText = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(viewUrl);
        if (!response.ok) {
          throw new Error(
            `Không thể tải file, server trả về: ${response.status}`
          );
        }
        const text = await response.text();
        setCurrentContent(text);
        setOriginalContent(text);
      } catch (err: any) {
        console.error("Lỗi khi fetch text content:", err);
        setError(`Không thể tải nội dung text: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchText();
  }, [viewUrl]);

  const handleSaveContent = async () => {
    if (currentContent === originalContent) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const updatedBlob = new Blob([currentContent], { type: "text/plain" });
      const updatedFile = new File([updatedBlob], fileName, {
        type: "text/plain",
      });

      const { uploadUrl } = await ApiService.initiateUpload(
        fileId,
        fileName,
      );
      // Tải file lên
      await axios.put(uploadUrl, updatedFile, {
        headers: { "Content-Type": updatedFile.type },
      });

      setOriginalContent(currentContent);
      setIsEditing(false);
    } catch (err: any) {
      console.error("Lỗi lưu nội dung:", err);
      setError(`Lỗi lưu file: ${err.message || "Lỗi không xác định"}`);
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading && !originalContent && !error) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-slate-600">
        <Loader2 size={24} className="animate-spin" />
        <span className="ml-2">Đang tải nội dung...</span>
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div className="flex flex-col items-center justify-center text-red-600 p-4 bg-red-50 rounded border border-red-200 m-4">
        <AlertTriangle className="w-8 h-8 mb-2" />
        <p className="font-semibold">Lỗi!</p>
        <p className="text-center text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border border-slate-200 rounded-md bg-white">
      <div className="flex-shrink-0 p-2 border-b border-slate-400/50 bg-slate-50 rounded-t-md flex items-center justify-between">
        {isEditing ? (
          <button
            onClick={handleSaveContent}
            disabled={isLoading || currentContent === originalContent}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            title="Lưu thay đổi nội dung"
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
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-slate-300"
            title="Chỉnh sửa nội dung file text"
          >
            <Edit size={16} /> Edit
          </button>
        )}
        {error && isEditing && (
          <span className="text-sm text-red-600 ml-2 truncate" title={error}>
            Lỗi: {error}
          </span>
        )}
      </div>

      <div className="flex-grow overflow-auto">
        {isEditing ? (
          <textarea
            value={currentContent}
            onChange={(e) => setCurrentContent(e.target.value)}
            className="w-full h-full p-3 border-0 outline-none focus:ring-0 text-sm resize-none"
            disabled={isLoading}
            autoFocus
          />
        ) : (
          <pre className="whitespace-pre-wrap break-words text-sm p-3">
            {currentContent}
          </pre>
        )}
      </div>
    </div>
  );
};
    