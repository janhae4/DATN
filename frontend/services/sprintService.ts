import apiClient from "./apiClient";
import { Sprint } from "@/types";
// Import Enum SprintStatus nếu bạn đã định nghĩa trong frontend (thường là từ @/types/common/enums)
// Nếu chưa có, bạn có thể dùng string hoặc định nghĩa tạm thời.
import { SprintStatus } from "@/types/common/enums"; 

// --- DTOs Matching Backend ---

export interface CreateSprintDto {
  title: string;
  goal?: string;
  start_date: string; // ISO Date string
  end_date: string;   // ISO Date string
  projectId: string;
  status?: SprintStatus;
  userId?: string;
}

export interface UpdateSprintDto extends Partial<CreateSprintDto> {}


export const sprintService = {
  /**
   * Lấy danh sách Sprint theo Project
   * GET /sprints/project/{projectId}
   */
  getSprints: async (projectId: string): Promise<Sprint[]> => {
    const response = await apiClient.get<Sprint[]>(`/sprints/project/${projectId}`);
    return response.data;
  },

  /**
   * Lấy chi tiết Sprint
   * GET /sprints/{id}
   */
  getSprintById: async (id: string): Promise<Sprint | undefined> => {
    const response = await apiClient.get<Sprint>(`/sprints/${id}`);
    return response.data;
  },

  /**
   * Tạo Sprint mới
   * POST /sprints
   */
  createSprint: async (data: CreateSprintDto): Promise<Sprint> => {
    const response = await apiClient.post<Sprint>('/sprints', data);
    return response.data;
  },

  /**
   * Cập nhật Sprint
   * PUT /sprints/{id}
   */
  updateSprint: async (id: string, updates: UpdateSprintDto): Promise<Sprint> => {
    // Dựa trên endpoint list bạn cung cấp trước đó là PUT
    const response = await apiClient.put<Sprint>(`/sprints/${id}`, updates);
    return response.data;
  },

  /**
   * Xóa Sprint
   * DELETE /sprints/{id}
   */
  deleteSprint: async (id: string): Promise<void> => {
    await apiClient.delete(`/sprints/${id}`);
  },
};