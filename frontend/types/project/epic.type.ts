// types/epic.type.ts
import { EpicStatus, Priority } from "../common/enums";

export type Epic = {
  id: string;
  title: string;
  description?: string;
  color?: string;
  status: EpicStatus;
  priority: Priority;
  startDate?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
};