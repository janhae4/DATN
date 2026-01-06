import axios from "axios";
import apiClient from "./apiClient";

// --- 1. DEFINITIONS (Type chuẩn hóa) ---

// Interface khớp chính xác với từng item trong JSON backend trả về
export interface IFile {
  _id: string;
  originalName: string;
  status: string;
  createdAt: string; // ISO String
  mimetype: string;  // QUAN TRỌNG: JSON trả về key thường, không phải camelCase
  size: number;      // File luôn có size, không nên để optional
  userId?: string;   // Optional (nếu backend có trả về field này)
}

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

// Interface cho toàn bộ response
export interface GetFilesResponse {
  data: IFile[];
  pagination: PaginationMeta;
}

export interface PresignedUrlResponse {
  fileId: string;
  uploadUrl: string;
}

// --- 2. SERVICE IMPLEMENTATION ---

export const fileService = {
  // Lấy danh sách file
  getFiles: async (
    projectId?: string,
    page: number = 1,     // Mặc định trang 1
    limit: number = 10    // Mặc định 10 dòng/trang
  ): Promise<GetFilesResponse> => {
    const response = await apiClient.get<GetFilesResponse>("/files", {
      params: {
        projectId,
        page,   // Gửi page lên backend
        limit   // Gửi limit lên backend
      },
    });
    return response.data;
  },

  // Xin URL để upload
  // QUAN TRỌNG: Cần gửi cả fileType để Backend ký signature đúng với Content-Type
  initiateUpload: async (
    data: { fileName: string; fileType: string },
    projectId?: string
  ): Promise<PresignedUrlResponse> => {
    const response = await apiClient.post<PresignedUrlResponse>(
      "/files/initiate-upload",
      data,
      { params: { projectId } }
    );
    return response.data;
  },

  // Lấy URL download
  getDownloadUrl: async (fileId: string, projectId?: string): Promise<{ downloadUrl: string }> => {
    const response = await apiClient.get<{ downloadUrl: string }>(
      `/files/${fileId}/download`,
      { params: { projectId } }
    );
    return response.data;
  },

  // Lấy URL preview
  getPreviewUrl: async (fileId: string, projectId?: string): Promise<{ viewUrl: string }> => {
    const response = await apiClient.get<{ viewUrl: string }>(
      `/files/${fileId}/preview`,
      { params: { projectId } }
    );
    return response.data;
  },

  // Xóa file
  deleteFile: async (fileId: string, projectId?: string): Promise<void> => {
    await apiClient.delete(`/files/${fileId}`, { params: { projectId } });
  },

  confirmUpload: async (fileId: string): Promise<void> => {
    await apiClient.post(`/files/${fileId}/confirm`);
  },

  // Upload trực tiếp lên MinIO/S3
  uploadFileToMinIO: async (
    presignedUrl: string,
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<void> => {
    try {
      // Dùng axios gốc (không qua apiClient) để tránh bị chèn Authorization header của App
      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type, // Phải khớp với fileType lúc gọi initiateUpload
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
          throw new Error("Upload thất bại: MinIO từ chối quyền (Có thể do sai Content-Type hoặc Link hết hạn).");
        }
      }
      throw error;
    }
  }
};