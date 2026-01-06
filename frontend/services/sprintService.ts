import apiClient from "./apiClient";
import { Sprint } from "@/types";
import { SprintStatus } from "@/types/common/enums";


export interface CreateSprintDto {
  title: string;
  goal?: string;
  start_date: string;
  end_date: string;
  projectId: string;
  status?: SprintStatus;
  userId?: string;
  teamId: string;
}

export interface UpdateSprintDto extends Partial<CreateSprintDto> { }

export const sprintService = {
  /**
   * Lấy danh sách Sprint theo Project
   * GET /sprints/project/{projectId}
   */
  getSprints: async (projectId: string, teamId: string, status?: SprintStatus[]): Promise<Sprint[]> => {
    const params = new URLSearchParams();
    console.log("status in service:", status);
    if (projectId) params.append('projectId', projectId);
    if (teamId) params.append('teamId', teamId);

    if (status && status.length > 0) {
      status.forEach(s => params.append('status', s));
    }

    const response = await apiClient.get<Sprint[]>(`/sprints?${params.toString()}`);
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
    console.log("creating sprint:", data)
    const response = await apiClient.post<Sprint>('/sprints', data);
    return response.data;
  },

  /**
   * Cập nhật Sprint
   * PUT /sprints/{id}
   */
  updateSprint: async (id: string, updates: UpdateSprintDto): Promise<Sprint> => {
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