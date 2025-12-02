import apiClient from "./apiClient";
import { Project } from "@/types"; 
import { ProjectVisibility } from "@/types/common/enums"; 

// --- Interfaces matching Backend DTOs ---

export interface CreateProjectDto {
  name: string;
  description?: string;
  icon?: string;
  visibility?: ProjectVisibility; // 'PRIVATE' | 'TEAM' | 'PUBLIC'
  teamId: string;
  backgroundImageUrl?: string;
  isArchived?: boolean;
  ownerId?: string; // Thêm trường này để khớp với Backend DTO
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {}

// --- Service Implementation ---

export const projectService = {
  /**
   * Lấy danh sách Project
   * GET /project?teamId=...
   * Nếu không truyền teamId -> Lấy tất cả project của user
   */
  getProjects: async (teamId: string): Promise<Project[]> => {
    const url = `/project?teamId=${teamId}` ;
    const response = await apiClient.get<Project[]>(url);
    return response.data;
  },

  /**
   * Lấy chi tiết Project
   * GET /project/{id}
   */
  getProjectById: async (id: string): Promise<Project | undefined> => {
    const response = await apiClient.get<Project>(`/project/${id}`);
    return response.data;
  },

  /**
   * Tạo Project mới
   * POST /project
   */
  createProject: async (projectData: CreateProjectDto): Promise<Project> => {
    const response = await apiClient.post<Project>('/project', projectData);
    return response.data;
  },

  /**
   * Cập nhật Project
   * PATCH /project/{id}
   */
  updateProject: async (
    id: string,
    updates: UpdateProjectDto
  ): Promise<Project | undefined> => {
    const response = await apiClient.patch<Project>(`/project/${id}`, updates);
    return response.data;
  },

  /**
   * Xóa Project
   * DELETE /project/{id}
   */
  deleteProject: async (id: string): Promise<void> => {
    await apiClient.delete(`/project/${id}`);
  },
};