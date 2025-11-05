export type Epic = {
  id: string
  title: string
  description?: string
  status: "todo" | "in_progress" | "done" | "canceled"
  priority: "low" | "medium" | "high" | null
  ownerId: string
  memberIds: string[]
  projectId: string
  sprintId?: string | null
  start_date?: string | null
  due_date?: string | null
  createdAt: string
  updatedAt: string
}
