"use client"

import * as React from "react"
import { Table, TableBody } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { AddNewTaskRow } from "./BacklogTaskRow"
import TaskTreeList from "./TaskTreeList"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"

type BacklogTaskListProps = {
  statuses?: any
}

export function BacklogTaskList({ statuses }: BacklogTaskListProps) {
  const {
    data,
    isAddingNewRow,
    setIsAddingNewRow,
  } = useTaskManagementContext()

  const statusesList = statuses ?? []

  const allSubtaskIds = React.useMemo(() => {
    const ids = new Set<string>()
    data.forEach((task) => {
      task.subtaskIds?.forEach((id) => ids.add(id))
    })
    return ids
  }, [data])

  const topLevelTasks = React.useMemo(() => {
    return data.filter((task) => !allSubtaskIds.has(task.id))
  }, [data, allSubtaskIds])

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg ">
        <Table>
          <TaskTreeList
            topLevelTasks={topLevelTasks}
            statuses={statusesList}
            isDraggable={true}
          />

          {isAddingNewRow && (
            <TableBody>
              <AddNewTaskRow
                level={0}
                parentId={null}
                statuses={statusesList}
              />
            </TableBody>
          )}
        </Table>
      </div>

      {!isAddingNewRow && (
        <Button
          variant="ghost"
          className="w-fit justify-start gap-2 px-1 text-muted-foreground"
          onClick={() => setIsAddingNewRow(true)}
        >
          <PlusIcon className="h-4 w-4" />
          Create Task
        </Button>
      )}
    </div>
  )
}