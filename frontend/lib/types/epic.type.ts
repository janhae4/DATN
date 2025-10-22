// lib/types/epic.type.ts
import { User } from "./user.type";

export interface Epic {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done" | "canceled";
  priority: "low" | "medium" | "high" | null;
  owner: User | null;
  start_date: string | Date | null;
  due_date: string | Date | null;
}