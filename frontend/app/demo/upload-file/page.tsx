// Tên file: app/upload-demo/page.tsx
"use client";

import React, { useState } from "react";
import axios, { AxiosProgressEvent } from "axios";

interface InitiateResponse {
  uploadUrl: string;
  fileId: string;
}

// Thiết lập một axios instance với baseURL
const api = axios.create({
  baseURL: "http://localhost:3000/",
  withCredentials: true,
});

const UploadDemoPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setStatusMessage(`Đã chọn file: ${file.name}`);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatusMessage("Vui lòng chọn một file trước!");
      return;
    }

    setIsLoading(true);
    setStatusMessage("Đang xin link upload từ server...");
    setUploadProgress(0);

    try {
          const initiateResponse = await api.post<InitiateResponse>(
        "/files/initiate-upload",
        {
          fileName: selectedFile.name,
        }
        // (Nếu cần token, thêm header ở đây)
        // { headers: { Authorization: `Bearer ${token}` } }
      );

      const { uploadUrl, fileId } = initiateResponse.data;
      setStatusMessage(`Đã có link. Đang upload file ID: ${fileId}...`);

      // BƯỚC 2: UPLOAD THẲNG LÊN MINIO
      await axios.put(uploadUrl, selectedFile, {
        headers: {
          "Content-Type": selectedFile.type,
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      });

      setStatusMessage("Upload thành công! Đang chờ server xử lý...");
    } catch (err) {
      console.error("Upload thất bại:", err);
      setStatusMessage("Upload thất bại! Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-xl p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Demo Upload File (Pre-signed URL)
        </h1>

        <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
          <p className="text-blue-700">
            {statusMessage || "Chọn một file và nhấn Upload."}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <label className="block w-full px-4 py-3 text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <span className="font-medium">
              {selectedFile ? selectedFile.name : "Nhấn để chọn file..."}
            </span>
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
          </label>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
            className="w-full px-4 py-3 text-base font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Đang xử lý..." : "Upload File"}
          </button>
        </div>

        {uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full">
            <div
              className="p-1 text-xs font-medium leading-none text-center text-white bg-green-500 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            >
              {uploadProgress}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadDemoPage;
