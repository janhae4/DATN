import axios from "axios";
import apiClient from "./apiClient";

// 1. Interface khớp chính xác với từng item trong mảng "data" của Backend
export interface BackendFileItem {
  _id: string;
  originalName: string;
  status: string;
  createdAt: string;
  userId?: string;
  size?: number;
  mimeType?: string;
}

// 2. Interface cho toàn bộ response từ API GET /files
export interface GetFilesResponse {
  data: BackendFileItem[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export interface PaginationMeta {
  totalItems: number
  totalPages: number
  currentPage: number
  limit: number
}

export interface PresignedUrlResponse {
  fileId: string;
  uploadUrl: string;
}

export const fileService = {
  // Lấy danh sách file
  getFiles: async (teamId?: string): Promise<GetFilesResponse> => {
    const response = await apiClient.get<GetFilesResponse>("/files", {
      params: { teamId },
    });
    return response.data;
  },

  // Xin URL để upload
initiateUpload: async (data: { fileName: string}, teamId?: string): Promise<PresignedUrlResponse> => {
    const response = await apiClient.post<PresignedUrlResponse>("/files/initiate-upload", data, {
      params: { teamId },
    });
    return response.data;
  },

  // Lấy URL download (Pre-signed)
  getDownloadUrl: async (fileId: string, teamId?: string): Promise<{ downloadUrl: string }> => {
    const response = await apiClient.get<{ downloadUrl: string }>(`/files/${fileId}/download`, {
      params: { teamId },
    });
    return response.data;
  },

  // Lấy URL preview (Pre-signed)
  getPreviewUrl: async (fileId: string, teamId?: string): Promise<{ viewUrl: string }> => {
    const response = await apiClient.get<{ viewUrl: string }>(`/files/${fileId}/preview`, {
      params: { teamId },
    });
    return response.data;
  },

  // Xóa file
  deleteFile: async (fileId: string, teamId?: string): Promise<void> => {
    await apiClient.delete(`/files/${fileId}`, { params: { teamId } });
  },
  uploadFileToMinIO: async (
    presignedUrl: string,
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<void> => {
    try {
      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type, 
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("MinIO Upload Error:", error.response?.status, error.response?.data);
        if (error.response?.status === 403) {
          throw new Error("MinIO từ chối quyền truy cập (Signature mismatch hoặc CORS).");
        }
      }
      throw error;
    }
  }
};