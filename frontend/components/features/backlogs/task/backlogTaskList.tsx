"use client"

import * as React from "react"
import { PlusIcon, Loader2, AlertCircle, Trash2, X } from "lucide-react"

import { Table } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { List, Task } from "@/types"

import { toast } from "sonner"

import { AddNewTaskRow } from "./AddNewTaskRow"
import { TaskRowList } from "./TaskRowList"
import { UpdateTaskDto } from "@/services/taskService"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"

type BacklogTaskListProps = {
  lists?: List[]
  tasks: Task[]
  isLoading?: boolean
  error?: any
  onRowClick: (task: Task) => void
  onUpdateTask: (taskId: string, updates: UpdateTaskDto) => void
  onDeleteTasks: (ids: string[]) => Promise<void> | void
}

export function BacklogTaskList({
  lists,
  tasks,
  isLoading = false,
  error,
  onRowClick,
  onUpdateTask,
  onDeleteTasks,
}: BacklogTaskListProps) {
  const { isAddingNewRow, setIsAddingNewRow } = useTaskManagementContext()

  // 2. Selection State (Lifted Up)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // 3. Filter Backlog Tasks (No Sprint)
  const backlogTasks = React.useMemo(
    () => tasks.filter((task) => !task.sprintId && !task.parentId),
    [tasks]
  )

  const listsList = lists ?? []
  const isEmpty = backlogTasks.length === 0 && !isAddingNewRow

  // --- Handlers ---

  const handleSelectTask = (taskId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, taskId] : prev.filter((id) => id !== taskId)
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    try {
        // Delete all selected tasks in parallel
        await onDeleteTasks(selectedIds);

        toast.success(`Deleted ${selectedIds.length} tasks`);
        setSelectedIds([]); // Clear selection after delete
    } catch (err) {
        toast.error("Failed to delete tasks");
        console.error(err);
    }
  }

  const handleUpdateTask = (taskId: string, updates: UpdateTaskDto) => {
    onUpdateTask(taskId, updates);
  }

  // --- Render ---

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
    <div className="flex flex-col relative">
      
      {/* --- DELETE TOOLBAR (Shows when tasks are selected) --- */}
      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between p-2 mb-2 bg-destructive/10 border border-destructive/20 rounded-md shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20" onClick={handleClearSelection}>
                    <X className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-destructive">
                    {selectedIds.length} selected
                </span>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
            </Button>
        </div>
      )}

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
                onRowClick={onRowClick}
                onUpdateTask={handleUpdateTask}
                // Pass selection props down
                selectedIds={selectedIds}
                onSelect={handleSelectTask}
              >
                {isAddingNewRow && (
                  <AddNewTaskRow
                    lists={listsList}
                    onCancel={() => setIsAddingNewRow(false)}
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