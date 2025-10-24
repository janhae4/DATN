// contexts/TaskManagementContext.tsx
"use client"

import * as React from "react"
import { Task } from "@/lib/dto/task.type"
import { db } from "@/public/mock-data/mock-data"
import { DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { useTaskManagement } from "@/hooks/useTaskManagement"

// Context type definition
interface TaskManagementContextType {
  data: Task[]
  selectedTask: Task | null
  isAddingNewRow: boolean
  addingSubtaskTo: string | null
  newRowTitle: string
  newTaskPriority: Task["priority"]
  newTaskDueDate: Date | null
  newTaskAssignees: string[]
  newTaskStatus: string
  dataIds: string[]

  // Handlers
  handleUpdateCell: (taskId: string, columnId: "title", value: string) => void
  handleDescriptionChange: (taskId: string, description: string) => void
  handleDateChange: (taskId: string, newDate: Date | undefined) => void
  handlePriorityChange: (taskId: string, priority: Task["priority"]) => void
  handleStatusChange: (taskId: string, statusId: string) => void
  handleRowClick: (task: Task) => void
  handleAddNewRow: (parentId: string | null) => void
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, parentId: string | null) => void
  handleDragEnd: (event: DragEndEvent) => void
  handleEpicChange: (taskId: string, epicId: string | null) => void
  handleSprintChange: (taskId: string, sprintId: string | null) => void 

  // Setters
  setNewRowTitle: (title: string) => void
  setIsAddingNewRow: (isAdding: boolean) => void
  setAddingSubtaskTo: (id: string | null) => void
  setSelectedTask: (task: Task | null) => void
  setNewTaskPriority: (priority: Task["priority"]) => void
  setNewTaskDueDate: (date: Date | null) => void
  setNewTaskAssignees: (assignees: string[]) => void
  setNewTaskStatus: (status: string) => void
}

// Create context
const TaskManagementContext = React.createContext<TaskManagementContextType | undefined>(undefined)

// Provider component
export function TaskManagementProvider({ children }: { children: React.ReactNode }) {
  const taskManagementData = useTaskManagement()

  return (
    <TaskManagementContext.Provider value={taskManagementData}>
      {children}
    </TaskManagementContext.Provider>
  )
}

// Custom hook to use context
export function useTaskManagementContext(): TaskManagementContextType {
  const context = React.useContext(TaskManagementContext)

  if (context === undefined) {
    throw new Error('useTaskManagementContext must be used within a TaskManagementProvider')
  }

  return context
}
