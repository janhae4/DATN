// types/task.type.ts
import { Priority } from "../common/enums";

export type Task = {
  id: string; // uuid
  title: string;
  description?: string;
  listId: string; 
  projectId: string; 
  reporterId?: string; // uuid (Người tạo task)
  priority?: Priority | null;
  assigneeIds?: string[]; // Người được assign
  labelIds?: string[]; // Nhãn
  dueDate?: string | null; // timestamp
  epicId?: string | null; // uuid
  position?: number;
  sprintId?: string | null; // uuid
  parentId?: string | null; // uuid (Task cha)
  createdAt: string; 
  updatedAt: string;
};