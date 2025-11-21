// types/task_assignee.interface.ts

export interface TaskAssignee {
  taskId: string; // uuid
  teamMemberId: string; // uuid
  assignedAt: string; // timestamp
}