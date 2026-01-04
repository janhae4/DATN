// types/task.type.ts
import { Priority } from "../common/enums";
import { TaskLabel } from "./taskLabel.interface";

export type Task = {
  id: string; // uuid
  title: string;
  description?: string | null;
  listId: string; 
  projectId: string; 
  reporterId?: string | null; // uuid (Người tạo task)
  priority?: Priority | null;
  assigneeIds?: string[] | null; // Người được assign
  labelIds?: string[]; // Nhãn
  startDate?: string | null; 
  dueDate?: string | null; 
  epicId?: string | null; // uuid
  position?: number;
  sprintId?: string | null; // uuid
  parentId?: string | null; // uuid (Task cha)
  createdAt: string; 
  updatedAt: string;
  taskLabels: TaskLabel[];
};