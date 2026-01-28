import axios from "axios";
import apiClient from "./apiClient";
import { Attachment, AttachmentType, FileVisibility } from "@/types";

// --- 1. DEFINITIONS (Type chuẩn hóa) ---

// Interface khớp chính xác với từng item trong JSON backend trả về
export interface IFile {
  _id: string;
  originalName: string;
  status: string;
  type: AttachmentType;
  createdAt: string; // ISO String
  mimetype: string;  // QUAN TRỌNG: JSON trả về key thường, không phải camelCase
  size: number;      // File luôn có size, không nên để optional
  userId?: string;   // Optional (nếu backend có trả về field này)
  visibility: FileVisibility,
  allowedUserIds?: string[];
  parentId?: string;
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


export const fileService = {
  getFiles: async (
    projectId?: string,
    teamId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<GetFilesResponse> => {
    const response = await apiClient.get<GetFilesResponse>("/files", {
      params: {
        projectId,
        teamId,
        page,
        limit
      },
    });
    return response.data;
  },

  initiateUpload: async (
    data: { fileName: string; fileType: string, parentId: string | null },
    projectId?: string,
    teamId?: string
  ): Promise<PresignedUrlResponse> => {
    const payload: any = { ...data };
    if (projectId) payload.projectId = projectId;
    if (teamId) payload.teamId = teamId;
    const response = await apiClient.post<PresignedUrlResponse>(
      "/files/initiate-upload",
      payload
    );
    return response.data;
  },

  getDownloadUrl: async (fileId: string, projectId?: string): Promise<{ downloadUrl: string }> => {
    const response = await apiClient.get(
      `/files/${fileId}/download`,
      { params: { projectId } }
    );
    return response.data;
  },

  downloadFiles: async (fileIds: string[], projectId?: string, teamId?: string) => {
    const response = await apiClient.post(
      `/files/download/bulk`,
      { fileIds, projectId, teamId }
    );

    if (response.data.type === 'application/json') {
      const text = await response.data.text();
      const json = JSON.parse(text);
      if (json.url) window.location.href = json.url;
    } else {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'files.zip');
      document.body.appendChild(link);
      link.click();
    }
  },

  getPreviewUrl: async (fileId: string, projectId?: string): Promise<{ viewUrl: string }> => {
    const params = projectId ? { projectId } : {};
    const response = await apiClient.get<{ viewUrl: string }>(
      `/files/${fileId}/preview`,
      { params }
    );
    return response.data;
  },

  deleteFile: async (fileId: string, projectId?: string): Promise<void> => {
    console.log("FileId, projectId", fileId, projectId);
    await apiClient.delete(`/files/${fileId}`, { params: { projectId } });
  },

  confirmUpload: async (fileId: string): Promise<void> => {
    await apiClient.post(`/files/${fileId}/confirm`);
  },

  uploadFileToMinIO: async (
    presignedUrl: string,
    file: File,
    onProgress?: (percentage: number) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    try {
      return await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        signal: signal,
        transformRequest: [(data, headers) => {
          delete headers['Authorization'];
          return data;
        }],
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
    }
  },

  createFolder: async (fileName: string, parentId: string | null, projectId?: string, teamId?: string) => {
    await apiClient.post('/files/folder', { fileName, parentId, projectId, teamId });
  },

  getFolder: async (folderId: string) => {
    const response = await apiClient.get(`/files/folder/${folderId}`);
    return response.data;
  },

  moveFileToFolder: async (fileId: string, parentId: string, projectId?: string, teamId?: string) => {
    await apiClient.patch(`/files/${fileId}/move`, { parentId, teamId, projectId });
  },

  moveFilesToFolder: async (fileIds: string[], parentId: string, projectId?: string, teamId?: string) => {
    const payload: any = { fileIds, parentId, teamId };
    if (projectId) payload.projectId = projectId;
    await apiClient.patch(`/files/move/bulk`, payload);
  },

  deleteFiles: async (
    fileIds: string[],
    projectId?: string,
    teamId?: string
  ) => {
    const payload: any = { fileIds };

    if (projectId) payload.projectId = projectId;
    if (teamId) payload.teamId = teamId;

    await apiClient.delete("/files/bulk", { data: payload });
  },

  changeVisibility: async (fileIds: string[], visibility: FileVisibility, allowedUserIds?: string[], projectId?: string, teamId?: string) => {
    await apiClient.patch(`/files/visibility/bulk`, { fileIds, visibility, allowedUserIds, projectId, teamId });
  },
};