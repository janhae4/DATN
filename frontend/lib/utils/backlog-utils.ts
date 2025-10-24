// lib/utils/backlog-utils.ts
import { db } from "@/public/mock-data/mock-data"
import { Status } from "@/lib/dto/status.interaface";
import { Task } from "@/lib/dto/task.type"

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

// Collect all subtask ids present in the list of tasks
export const collectAllSubtaskIds = (tasks: Task[]) => {
  const ids = new Set<string>()
  tasks.forEach(task => {
    task.subtaskIds?.forEach(id => ids.add(id))
  })
  return ids
}

// Return top-level tasks (those that are not listed as any task's subtask)
export const getTopLevelTasks = (tasks: Task[]) => {
  const allSubtaskIds = collectAllSubtaskIds(tasks)
  return tasks.filter(t => !allSubtaskIds.has(t.id))
}

// Given a task and a task map, return its immediate subtasks (as Task[])
export const getSubtasksForTask = (task: Task, taskMap: Map<string, Task>) => {
  return task.subtaskIds?.map(id => taskMap.get(id)).filter(Boolean) as Task[] || []
}

// Flatten a task and its (expanded) subtasks into an ordered array of {task, level}
export type FlattenedTaskNode = { task: Task; level: number }

export const flattenTaskTree = (
  task: Task,
  taskMap: Map<string, Task>,
  expandedIds: Set<string>,
): FlattenedTaskNode[] => {
  const result: FlattenedTaskNode[] = []
  const stack: Array<{ t: Task; level: number }> = [{ t: task, level: 0 }]

  const traverse = (t: Task, level: number) => {
    result.push({ task: t, level })
    const subtasks = getSubtasksForTask(t, taskMap)
    if (subtasks.length > 0 && expandedIds.has(t.id)) {
      subtasks.forEach(sub => traverse(sub, level + 1))
    }
  }

  traverse(task, 0)
  return result
}

