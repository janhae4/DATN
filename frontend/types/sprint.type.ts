export type Sprint = {
  id: string
  title: string
  goal?: string
  start_date: string
  end_date: string
  projectId: string
  status: "planned" | "active" | "completed" | "archived"
  createdAt: string
  updatedAt: string
}
