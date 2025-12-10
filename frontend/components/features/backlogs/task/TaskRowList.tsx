"use client"

import * as React from "react"
import { TableBody } from "@/components/ui/table"
import { Task, List } from "@/types"
import { BacklogTaskRow } from "./BacklogTaskRow"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { UpdateTaskDto } from "@/services/taskService"

type TaskRowListProps = {
  tasks: Task[]
  lists: List[]
  isDraggable?: boolean
  isSortable?: boolean
  onRowClick: (task: Task) => void
  onUpdateTask: (taskId: string, updates: UpdateTaskDto) => void;
  children?: React.ReactNode 
  // Selection Props
  selectedIds?: string[];
  onSelect?: (taskId: string, checked: boolean) => void;
}

export function TaskRowList({
  tasks,
  lists,
  isDraggable = false,
  isSortable = false,
  onRowClick,
  onUpdateTask, 
  children,
  selectedIds,
  onSelect,
}: TaskRowListProps) {
  
  const safeSelectedIds = selectedIds ?? []

  // 1. Map rows
  const taskRows = tasks.map((task) => (
    <BacklogTaskRow
      key={task.id}
      task={task}
      lists={lists}
      isDraggable={isDraggable}
      onRowClick={onRowClick}
      // Pass selection state
      selected={safeSelectedIds.includes(task.id)}
      onSelect={onSelect}
      onUpdateTask={onUpdateTask} 
      data-sortable={isSortable}
    />
  ))

  // 2. Sortable List
  if (isSortable) {
    const taskIds = tasks.map((task) => task.id)
    return (
      <TableBody data-sortable={true}>
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {taskRows}
          {/* Render children (AddNewTaskRow) */}
          {children && React.Children.map(children, (child) => 
            React.isValidElement(child) ? React.cloneElement(child, { 'data-sortable': false } as any) : child
          )}
        </SortableContext>
      </TableBody>
    )
  }

  // 3. Static List
  return (
    <TableBody data-sortable={false}>
      {taskRows}
      {children}
    </TableBody>
  )
}