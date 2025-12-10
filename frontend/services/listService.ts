import apiClient from "./apiClient";
import { List } from "@/types";
import { ListCategoryEnum } from "@/types/common/enums"; // Import Enum nếu có, hoặc dùng string

// --- Interfaces matching Backend DTOs ---

export interface CreateListDto {
  name: string;
  position: number;
  projectId: string;
  category?: ListCategoryEnum;
  limited?: number | null;
  isArchived?: boolean; 
}

export interface UpdateListDto extends Partial<CreateListDto> {}

// DTO cho việc sắp xếp lại
export interface ListOrderEntry {
  id: string;
  order: number;
}

export interface UpdateListOrderDto {
  lists: ListOrderEntry[];
}

// --- Service Implementation ---

export const listService = {
  /**
   * Lấy tất cả list của một project
   * GET /list?projectId=...
   */
  getLists: async (projectId: string): Promise<List[]> => {
    const response = await apiClient.get<List[]>(`/list?projectId=${projectId}`);
    // Backend nên trả về list đã sort, nhưng frontend sort lại cho chắc chắn
    return response.data.sort((a, b) => a.position - b.position);
  },

  /**
   * Lấy chi tiết list
   * GET /list/{id}
   */
  getListById: async (id: string): Promise<List | undefined> => {
    const response = await apiClient.get<List>(`/list/${id}`);
    return response.data;
  },

  /**
   * Tạo list mới
   * POST /list
   */
  createList: async (data: CreateListDto): Promise<List> => {
    console.log("Creating list with data:", data);
    const response = await apiClient.post<List>('/list', data);
    return response.data;
  },

  /**
   * Cập nhật list
   * Put /list/{id}
   */
  updateList: async (id: string, updates: UpdateListDto): Promise<List> => {
    const response = await apiClient.put<List>(`/list/${id}`, updates);
    return response.data;
  },

  /**
   * Xóa list
   * DELETE /list/{id}
   */
  deleteList: async (id: string): Promise<void> => {
    await apiClient.delete(`/list/${id}`);
  },

  /**
   * Sắp xếp lại thứ tự các list
   * PATCH /list/order
   */
  reorderLists: async (projectId: string, lists: List[]): Promise<List[]> => {
    // 1. Chuẩn bị payload khớp với UpdateListOrderDto
    const payload: UpdateListOrderDto = {
      lists: lists.map((list, index) => ({
        id: list.id,
        order: index + 1 // Cập nhật vị trí mới dựa trên index mảng
      }))
    };

    // 2. Gọi API batch update
    await apiClient.patch('/list/order', payload);

    // 3. Trả về danh sách đã sắp xếp (Optimistic)
    return lists;
  }
};