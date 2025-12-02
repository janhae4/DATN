"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { PlusIcon, Loader2, AlertCircle } from "lucide-react"

import { Table } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { useTasks } from "@/hooks/useTasks" // Import Hook
import { List, TaskLabel } from "@/types"

import { AddNewTaskRow } from "./AddNewTaskRow"
import { TaskRowList } from "./TaskRowList"
import { UpdateTaskDto } from "@/services/taskService"

type BacklogTaskListProps = {
  lists?: List[]
}

export function BacklogTaskList({ lists }: BacklogTaskListProps) {
  const params = useParams();
  const projectId = params.projectId as string;

  // 1. Lấy dữ liệu và hàm xóa, CẬP NHẬT (updateTask)
  const { tasks, deleteTask, updateTask, isLoading, error, projectLabels } = useTasks(projectId);


  // 2. Các thao tác UI global 
  const {
    isAddingNewRow,
    setIsAddingNewRow,
    handleRowClick,
  } = useTaskManagementContext()

  // 3. Lọc Backlog Tasks (Task chưa có sprintId)
  const backlogTasks = React.useMemo(
    () => tasks.filter((task) => !task.sprintId),
    [tasks]
  )

  const listsList = lists ?? []
  const isEmpty = backlogTasks.length === 0 && !isAddingNewRow

  // 4. Xử lý xóa nhiều (sử dụng hàm delete từ hook)
  const handleDeleteMultiple = async (ids: string[]) => {
    await Promise.all(ids.map((id) => deleteTask(id)));
  }

  const handleUpdateTask = (taskId: string, updates: UpdateTaskDto) => {
    console.log("updating tasks: ", taskId, updates)
    updateTask(taskId, updates);
  }


  if (isLoading) {
    return (
      <div className="flex h-32 w-full items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading backlog...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-32 w-full flex-col items-center justify-center gap-2 text-destructive border-2 border-destructive/20 rounded-md bg-destructive/5">
        <AlertCircle className="h-6 w-6" />
        <p>Failed to load tasks</p>
      </div>
    );
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
                onRowClick={handleRowClick}
                onDeleteMultiple={handleDeleteMultiple}
                onUpdateTask={handleUpdateTask}
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
          className="w-fit justify-start gap-2 px-1 text-muted-foreground mt-2"
          onClick={() => setIsAddingNewRow(true)}
        >
          <PlusIcon className="h-4 w-4" />
          Create Task
        </Button>
      )}
    </div>
  )
}