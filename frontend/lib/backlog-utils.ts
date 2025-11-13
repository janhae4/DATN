// lib/utils/backlog-utils.ts
import { db } from "@/public/mock-data/mock-data"
import { Status } from "@/types/status.interface";
import { Task } from "@/types/task.type"
import { Flag } from "lucide-react"

// Priority mapping
export const priorityMap = {
  'high': { label: 'High', icon: Flag, color: 'text-red-500' },
  'medium': { label: 'Medium', icon: Flag, color: 'text-yellow-500' },
  'low': { label: 'Low', icon: Flag, color: 'text-green-500' },
  'none': { label: 'None', icon: Flag, color: 'text-gray-500' }
} as const;

// Lọc status cho Project 1
export const statusesForProject1: Status[] = db.statuses
  .filter(s => s.projectId === "project-1")
  .sort((a, b) => a.order - b.order);

// Helper format ngày
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

// Lấy chữ cái đầu của tên user từ ID
export const getAssigneeInitial = (assigneeId: string): string => {
  const user = db.users.find(u => u.id === assigneeId);
  return user ? user.name.charAt(0).toUpperCase() : "U";
}

// Build a map of tasks by id
export const buildTaskMap = (tasks: Task[]) => new Map(tasks.map(t => [t.id, t]))

// Since subtasks are no longer part of the Task type, these functions are no longer needed
// and will be removed or replaced with alternative implementations if needed

// Placeholder for future task hierarchy implementation
export const collectAllSubtaskIds = (): Set<string> => {
  // Return empty set as subtasks are not supported
  return new Set<string>();
}

// Return all tasks as top-level since there's no subtask relationship
export const getTopLevelTasks = (tasks: Task[]) => {
  return [...tasks]; // Return all tasks as top-level
}

// Return empty array as subtasks are not supported
export const getSubtasksForTask = (): Task[] => {
  return [];
}

// Flatten a task into an array of FlattenedTaskNode (single item array since subtasks are no longer supported)
export type FlattenedTaskNode = { task: Task}

export const flattenTaskTree = (
  task: Task,
  _taskMap: Map<string, Task>,
  _expandedIds: Set<string>,
): FlattenedTaskNode[] => {
  return [{ task }];
}
