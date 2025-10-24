"use client"

import * as React from "react"
import { TableBody } from "@/components/ui/table"
import { Task } from "@/lib/dto/task.type"
import { Status } from "@/lib/dto/status.interaface"
import { BacklogTaskRow, AddNewTaskRow } from "./BacklogTaskRow" 
import { buildTaskMap, flattenTaskTree, FlattenedTaskNode } from "@/lib/utils/backlog-utils"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"

type TaskTreeListProps = {
  topLevelTasks: Task[]
  statuses: Status[]
  isDraggable?: boolean
}

export function TaskTreeList({
  topLevelTasks,
  statuses,
  isDraggable = false,
}: TaskTreeListProps) {
  const {
    data,
    addingSubtaskTo,
    setAddingSubtaskTo,
    newRowTitle,
    setNewRowTitle,
    handleAddNewRow,
    handleInputKeyDown,
    newTaskPriority,
    setNewTaskPriority,
    newTaskDueDate,
    setNewTaskDueDate,
    setNewTaskStatus,
    handleUpdateCell,
    handlePriorityChange,
    handleDateChange,
    handleStatusChange,
    handleDescriptionChange,
    handleRowClick,
  } = useTaskManagementContext()

  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())
  const taskMap = React.useMemo(() => buildTaskMap(data), [data])

  return (
    <TableBody>
      {topLevelTasks.map((top) => {
        const flattened: FlattenedTaskNode[] = flattenTaskTree(top, taskMap, expandedIds)

        // MODIFICATION: Use React.Fragment to render row + optional add row
        return flattened.map((node: FlattenedTaskNode) => {
          const hasChildren = (node.task.subtaskIds?.length || 0) > 0;
          const isAddingSubtaskHere = addingSubtaskTo === node.task.id;

          return (
            <React.Fragment key={node.task.id}>
              <BacklogTaskRow      
                key={node.task.id} // Keep key on the main row
                task={node.task}
                statuses={statuses}
                level={node.level}
                hasSubtasks={hasChildren}
                // Row is "expanded" if it has children open OR if we're adding a subtask
                isExpanded={expandedIds.has(node.task.id) || isAddingSubtaskHere}
                isDraggable={isDraggable}
                onToggleExpand={() => {
                  setNewRowTitle(""); // Clear title when toggling
                  if (hasChildren) {
                    // Normal expand/collapse
                    setAddingSubtaskTo(null); // Close add row if open
                    const next = new Set(expandedIds)
                    if (next.has(node.task.id)) next.delete(node.task.id)
                    else next.add(node.task.id)
                    setExpandedIds(next)
                  } else {
                    // Toggle "add subtask" mode
                    setAddingSubtaskTo(isAddingSubtaskHere ? null : node.task.id)
                  }
                }}
              />

              {/* MODIFICATION: Conditionally render AddNewTaskRow */}
              {isAddingSubtaskHere && (
                <AddNewTaskRow
                  level={node.level + 1} // Indent one level deeper
                  parentId={node.task.id}
                  statuses={statuses}
                />
              )}
            </React.Fragment>
          )
        })
      })}
    </TableBody>
  )
}

export default TaskTreeList