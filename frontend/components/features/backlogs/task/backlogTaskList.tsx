import * as React from "react"
import { Table } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { AddNewTaskRow } from "./AddNewTaskRow"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { TaskRowList } from "./TaskRowList"
import { List } from "@/types"

type BacklogTaskListProps = {
  lists?: List[]
}

export function BacklogTaskList({ lists }: BacklogTaskListProps) {
  const {
    data,
    isAddingNewRow,
    setIsAddingNewRow,
    handleRowClick,
    handleDeleteTask,
  } = useTaskManagementContext()

  const backlogTasks = React.useMemo(
    () => data.filter((task) => !task.sprintId),
    [data]
  )
  
  const listsList = lists ?? []

  const isEmpty = backlogTasks.length === 0 && !isAddingNewRow

  const handleDeleteMultiple = (ids: string[]) => {
    ids.forEach((id) => handleDeleteTask(id))
  }

  return (
    <div className="flex flex-col">
      <div className="rounded-lg">
        <div>
          {isEmpty ? (
            <div
              className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-muted-foreground hover:bg-muted/50 hover:border-primary/50 hover:text-primary transition-all"
              onClick={() => setIsAddingNewRow(true)}
            >
              <PlusIcon className="h-8 w-8 opacity-50" />
              <p className="text-sm font-medium">Your backlog is empty</p>
              <p className="text-xs opacity-70">Click here to create a new task</p>
            </div>
          ) : (
            <Table>
              <TaskRowList
                tasks={backlogTasks}
                lists={listsList}
                isDraggable={true}
                isSortable={true} 
                onRowClick={handleRowClick}
                onDeleteMultiple={handleDeleteMultiple}
              >
                {isAddingNewRow && (
                  <AddNewTaskRow
                    lists={listsList}
                  />
                )}
              </TaskRowList>
            </Table>
          )}
        </div>
      </div>

      {!isAddingNewRow && !isEmpty && (
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