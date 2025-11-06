export type Task = {
  id: string;
  title: string;
  description?: string;
  statusId: string | null;
  priority: "low" | "medium" | "high" | null;
  assigneeIds: string[];
  due_date?: string | null;
  epicId?: string | null;
  projectId: string;
  sprintId?: string | null;
  labelIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};
