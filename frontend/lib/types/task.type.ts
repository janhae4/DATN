import { User } from "./user.type"

// Định nghĩa Task
export type Task = {
  id: string
  title: string
  description?: string
  isCompleted: boolean
  status: "todo" | "in_progress" | "done" | "canceled"
  priority: "low" | "medium" | "high" | null | undefined
  assignees: User[]
  due_date?: string | null
  subtasks?: any[]
}

