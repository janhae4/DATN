// backlogs/task/TaskRowList.tsx
"use client"

import * as React from "react"
import { TableBody } from "@/components/ui/table"
import { Task, List } from "@/types"
import { BacklogTaskRow } from "./BacklogTaskRow"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"

type TaskRowListProps = {
  tasks: Task[]
  lists: List[]
  isDraggable?: boolean
  isSortable?: boolean
  onRowClick: (task: Task) => void
  children?: React.ReactNode // Dùng để nhét <AddNewTaskRow /> vào
}

export function TaskRowList({
  tasks,
  lists,
  isDraggable = false,
  isSortable = false,
  onRowClick,
  children,
  onDeleteMultiple,
}: TaskRowListProps & { onDeleteMultiple?: (ids: string[]) => void }) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const handleSelect = (taskId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, taskId] : prev.filter((id) => id !== taskId)
    );
  };

  const handleDeleteSelected = () => {
    if (onDeleteMultiple) onDeleteMultiple(selectedIds);
    setSelectedIds([]);
  };

  // 1. Tạo ra 1 mảng các component <BacklogTaskRow>
  const taskRows = tasks.map((task) => (
    <BacklogTaskRow
      key={task.id}
      task={task}
      lists={lists}
      isDraggable={isDraggable}
      onRowClick={onRowClick}
      selected={selectedIds.includes(task.id)}
      onSelect={handleSelect}
      data-sortable={isSortable}
    />
  ))

  // 2. Nếu list này CÓ SẮP XẾP (sortable)
  if (isSortable) {
    // Lấy ID cho SortableContext
    const taskIds = tasks.map((task) => task.id)
    return (
      <TableBody data-sortable={true}>
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {/* Delete button for selected tasks */}
          {selectedIds.length > 0 && (
            <tr>
              <td colSpan={10} className="py-2">
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                  Delete Selected ({selectedIds.length})
                </Button>
              </td>
            </tr>
          )}
          {taskRows}
          {children && React.Children.map(children, (child) => 
            React.isValidElement(child) ? React.cloneElement(child, { 'data-sortable': false } as any) : child
          )}
        </SortableContext>
      </TableBody>
    )
  }

  // 3. Nếu list này KHÔNG SẮP XẾP (ví dụ: trong Epic)
  return (
    <TableBody data-sortable={false}>
      {taskRows}
      {children}
    </TableBody>
  )
}