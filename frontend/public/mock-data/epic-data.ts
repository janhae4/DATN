// data/epic-data.ts
import { Epic } from "@/lib/types/epic.type";
import { User } from "@/lib/types/user.type";

// (Giả sử bạn có mảng users từ task-data.ts)
const users: User[] = [
    { id: "user-1", name: "Son Goku", avatarFallback: "SG" },
    { id: "user-2", name: "Jane Doe", avatarFallback: "JD" },
];

export const initialEpicData: Epic[] = [
  {
    id: "EPIC-1",
    title: "Website Redesign",
    status: "in_progress",
    priority: "high",
    owner: users[0],
    start_date: "2025-10-01",
    due_date: "2025-12-15",
  },
  {
    id: "EPIC-2",
    title: "Customer Outreach Campaign",
    status: "todo",
    priority: "medium",
    owner: users[1],
    start_date: null,
    due_date: null,
  },
  {
    id: "EPIC-3",
    title: "Reporting System Upgrade",
    status: "done",
    priority: "low",
    owner: null,
    start_date: "2025-09-15",
    due_date: "2025-10-20",
  },
];