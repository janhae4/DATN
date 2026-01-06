// contexts/TaskManagementContext.tsx
"use client";

import * as React from "react";
import { Task, Sprint, Epic, Label } from "@/types";
import { db } from "@/public/mock-data/mock-data";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { TaskFilters, useTaskManagement } from "@/hooks/useTaskManagement";

// Context type definition
interface TaskManagementContextType {
  data: Task[];
  allData: Task[];
  sprints: Sprint[];
  epics: Epic[];
  labels: Label[];
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  selectedTask: Task | null;
  isAddingNewRow: boolean;
  newRowTitle: string;
  newTaskPriority: Task["priority"];
  newTaskDueDate: Date | null;
  newTaskAssignees: string[];
  newTaskListId: string;
  dataIds: string[];
  projectId: string;

  activeSprint: Sprint | null;
  startSprint: (sprintId: string) => Promise<void>;

  // Handlers
  handleUpdateCell: (taskId: string, columnId: "title", value: string) => void;
  handleDescriptionChange: (taskId: string, description: string) => void;
  handleDateChange: (taskId: string, newDate: Date | undefined) => void;
  handlePriorityChange: (taskId: string, priority: Task["priority"]) => void;
  handleListChange: (taskId: string, listId: string) => void;
  handleRowClick: (task: Task) => void;
  handleAddNewRow: (parentId: string | null, sprintId?: string) => void;
  handleInputKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    parentId: string | null,
    options?: {
      sprintId?: string;
      onCancel?: () => void;
    }
  ) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleEpicChange: (taskId: string, epicId: string | null) => void;
  handleSprintChange: (taskId: string, sprintId: string | null) => void;
  handleLabelChange: (taskId: string, labelIds: string[]) => void;
  handleAssigneeChange: (taskId: string, assigneeIds: string[]) => void;
  handleReorderTask: (activeId: string, overId: string) => void;
  handleDeleteTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;

  // Setters
  setNewRowTitle: (title: string) => void;
  setIsAddingNewRow: (isAdding: boolean) => void;
  setSelectedTask: (task: Task | null) => void;
  setNewTaskPriority: (priority: Task["priority"]) => void;
  setNewTaskDueDate: (date: Date | null) => void;
  setNewTaskAssignees: (assignees: string[]) => void;
  setNewTaskListId: (listId: string) => void;
}

// Create context
const TaskManagementContext = React.createContext<
  TaskManagementContextType | undefined
>(undefined);

// Provider component
export function TaskManagementProvider({
  children,
  projectId,
  teamId,
}: {
  children: React.ReactNode;
  projectId?: string;
  teamId?: string;
}) {
  const taskManagementData = useTaskManagement(projectId, teamId);

  return (
    <TaskManagementContext.Provider value={taskManagementData}>
      {children}
    </TaskManagementContext.Provider>
  );
}

// Custom hook to use context
export function useTaskManagementContext(): TaskManagementContextType {
  const context = React.useContext(TaskManagementContext);

  if (context === undefined) {
    throw new Error(
      "useTaskManagementContext must be used within a TaskManagementProvider"
    );
  }

  return context;
}
