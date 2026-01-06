import apiClient from "./apiClient";
import { Epic } from "@/types";
import { EpicStatus, Priority } from "@/types/common/enums";

// --- DTOs khớp với Backend ---
// Dựa trên file src/epic/create-epic.dto.ts

export interface CreateEpicDto {
  title: string;
  description?: string;
  status?: EpicStatus;
  color?: string;
  priority?: Priority;
  projectId: string;
    startDate?: string; 
    dueDate?: string;   
}

export interface UpdateEpicDto extends Partial<CreateEpicDto> {}

// --- Service Implementation ---

export const epicService = {
  /**
   * Lấy danh sách Epic của một Project
   * GET /epics/project/{projectId}
   */
  getEpics: async (projectId: string): Promise<Epic[]> => {
    const response = await apiClient.get<Epic[]>(`/epics/project/${projectId}`);
    return response.data;
  },

  /**
   * Lấy chi tiết Epic
   * GET /epics/{id}
   */
  getEpicById: async (id: string): Promise<Epic | undefined> => {
    const response = await apiClient.get<Epic>(`/epics/${id}`);
    return response.data;
  },

  /**
   * Tạo Epic mới
   * POST /epics
   */
  createEpic: async (data: CreateEpicDto): Promise<Epic> => {
    console.log("Creating epic with data:", data);
    const response = await apiClient.post<Epic>('/epics', data);
    return response.data;
  },

  /**
   * Cập nhật Epic
   * PUT /epics/{id}
   */
  updateEpic: async (id: string, updates: UpdateEpicDto): Promise<Epic> => {
    const response = await apiClient.put<Epic>(`/epics/${id}`, updates);
    return response.data;
  },

  /**
   * Xóa Epic
   * DELETE /epics/{id}
   */
  deleteEpic: async (id: string): Promise<void> => {
    await apiClient.delete(`/epics/${id}`);
  },
};