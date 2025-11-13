import * as React from "react"
import { Table } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { AddNewTaskRow } from "./AddNewTaskRow"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { TaskRowList } from "./TaskRowList"
import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"

type BacklogTaskListProps = {
  statuses?: any
}

export function BacklogTaskList({ statuses }: BacklogTaskListProps) {
  const {
    data,
    isAddingNewRow,
    setIsAddingNewRow,
    handleRowClick, 
  } = useTaskManagementContext()

  const backlogTasks = React.useMemo(
    () => data.filter((task) => !task.sprintId),
    [data]
  )
  
  const statusesList = statuses ?? []

  const { setNodeRef, isOver } = useDroppable({
    id: 'backlog-drop-area',
    data: {
      type: 'backlog-drop-area'
    }
  });

  return (
    <div className="flex flex-col">
      <div className="rounded-lg">
        <div 
          ref={setNodeRef}
          className={cn(
            isOver && "ring-2 ring-primary/40 bg-primary/10"
          )}
        >
          <Table>
          <TaskRowList
            tasks={backlogTasks}
            statuses={statusesList}
            isDraggable={true}
            isSortable={true} 
            onRowClick={handleRowClick}
          >
            {isAddingNewRow && (
              <AddNewTaskRow
                statuses={statusesList}
              />
            )}
          </TaskRowList>
          </Table>
        </div>
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