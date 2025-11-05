"use client"

import * as React from "react"
import { TableBody } from "@/components/ui/table"
import { Task } from "@/types/task.type"
import { Status } from "@/types/status.interaface"
import { BacklogTaskRow } from "./BacklogTaskRow" 
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
    handleRowClick,
  } = useTaskManagementContext()

  return (
    <TableBody>
      {topLevelTasks.map((task) => (
        <BacklogTaskRow
          key={task.id}
          task={task}
          statuses={statuses}
          isDraggable={isDraggable}
          onRowClick={handleRowClick}
        />
      ))}
    </TableBody>
  )
}

export default TaskTreeList