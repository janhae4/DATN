import apiClient from "./apiClient";
import { Label } from "@/types";

// Define DTOs here as requested
export interface CreateLabelDto {
  name: string;
  color?: string;
  projectId: string;
}

export interface UpdateLabelDto {
  name?: string;
  color?: string;
}

// NEW: DTO for fetching label details by IDs (POST /label/details)
export interface GetLabelsDetailsDto {
  ids: string[];
}

export const labelService = {
  getLabels: async (projectId: string): Promise<Label[]> => {
    const { data } = await apiClient.get<Label[]>(`/label/project/${projectId}`);
    return data;
  },

  getLabelById: async (id: string): Promise<Label | undefined> => {
    try {
      const { data } = await apiClient.get<Label>(`/label/${id}`);
      return data;
    } catch (error) {
      console.error("Error fetching label by ID:", error);
      return undefined;
    }
  },
  
  // 2. NEW: Function for POST /label/details
  getLabelsDetailsByIds: async (ids: string[]): Promise<Label[]> => {
    const payload: GetLabelsDetailsDto = { ids };
    // Sử dụng POST để gửi body chứa danh sách IDs
    const { data } = await apiClient.post<Label[]>(`/label/details`, payload);
    return data;
  },

  createLabel: async (label: CreateLabelDto): Promise<Label> => {
    const { data } = await apiClient.post<Label>('/label', label);
    return data;
  },

  updateLabel: async (
    id: string,
    updates: UpdateLabelDto
  ): Promise<Label | undefined> => {
    const { data } = await apiClient.patch<Label>(`/label/${id}`, updates);
    return data;
  },

  deleteLabel: async (id: string): Promise<void> => {
    await apiClient.delete(`/label/${id}`);
  },
};