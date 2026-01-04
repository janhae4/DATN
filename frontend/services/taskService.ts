import apiClient, { streamHelper } from "@/services/apiClient";
import { Pagination, Task, TaskLabel } from "@/types";
import { Priority } from "@/types/common/enums";
import { update } from "lodash";

// --- DTOs ---

export interface CreateTaskDto {
  title: string;
  description?: string | null;
  projectId: string;
  listId: string;
  priority?: Priority | null;
  reporterId?: string | null;
  assigneeIds?: string[] | null;
  startDate?: string | null;
  parentId?: string | null;
  dueDate?: string | null;
  epicId?: string | null;
  sprintId?: string | null;
}

export interface UpdateTaskDto extends Partial<Omit<CreateTaskDto, "projectId">> {
  position?: number;
  labelIds?: string[];
}

export interface GetTasksParams {
  projectId: string;
  search?: string;
  assigneeIds?: string[];
  priority?: Task['priority'][];
  statusId?: string[];
  epicId?: string[];
  labelIds?: string[];
  sprintId?: string[] | "null";
  page?: number;
  limit?: number;
}

// --- Service ---

export const taskService = {
  /**
   * Lấy danh sách Task
   * GET /tasks?projectId=...
   */
  getTasks: async (params: GetTasksParams): Promise<Pagination<Task>> => {
    const response = await apiClient.get("/tasks", { params });
    return response.data;
  },

  /**
   * Lấy chi tiết Task
   * GET /tasks/{id}
   */
  getTaskById: async (id: string): Promise<Task | undefined> => {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  /**
   * Tạo Task mới
   * POST /tasks
   */
  createTask: async (data: CreateTaskDto): Promise<Task> => {
    const response = await apiClient.post<Task>('/tasks', data);
    return response.data;
  },

  createTasks: async (newTasks: CreateTaskDto[], epic: string, sprintId?: string): Promise<Task[]> => {
    const response = await apiClient.post<Task[]>('/tasks/bulk', {
      tasks: newTasks,
      epicTitle: epic,
      sprintId
    });
    return response.data;
  },

  suggestTasksByAi: async (teamId: string, projectId: string, query: string, onChunk: (chunk: string) => void): Promise<void> => {
    await streamHelper('/tasks/suggest-stream', { teamId, projectId, query }, onChunk);
  },

  /**
   * Cập nhật Task
   * PUT /tasks/{id}
   */
  updateTask: async (id: string, updates: UpdateTaskDto): Promise<Task> => {
    console.log("updates while updateTask", updates, "with task: ", id)
    const response = await apiClient.put<Task>(`/tasks/${id}`, updates);
    return response.data;
  },

  updateTasks: async (taskIds: string[], updates: UpdateTaskDto): Promise<Task[]> => {
    const response = await apiClient.patch<Task[]>(`/tasks/bulk`, { taskIds, updates });
    return response.data;
  },

  /**
   * Xóa Task
   * DELETE /tasks/{id}
   */
  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  deleteTasks: async (taskIds: string[]): Promise<void> => {
    await apiClient.delete(`/tasks/bulk`, { data: { taskIds } });
  },

  /**
   * Lấy danh sách Label của 1 Task cụ thể
   * GET /tasks/{id}/labels
   */
  getLabelsByTaskId: async (taskId: string): Promise<TaskLabel[]> => {
    const response = await apiClient.get<TaskLabel[]>(`/tasks/${taskId}/labels`);
    return response.data;
  },


  getAllTaskLabelByProjectId: async (projectId: string): Promise<TaskLabel[]> => {
    const response = await apiClient.get<TaskLabel[]>(`/tasks/tasklabel?projectId=${projectId}`);
    return response.data;
  },

  /**
   * Upload file đính kèm cho Task
   * POST /tasks/{id}/files
   */
  addFileToTask: async (taskId: string, fileId: string): Promise<void> => {
    await apiClient.post(`/tasks/${taskId}/files`, { fileIds: [fileId] });
  },
  /**
   * Remove label from task
   * DELETE /tasks/{id}/label?labelId=...
   */
  deleteLabelFromTask: async (taskId: string, labelId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}/label?labelId=${labelId}`);
  }
};