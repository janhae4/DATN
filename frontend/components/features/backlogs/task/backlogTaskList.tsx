"use client";

import * as React from "react";
import { PlusIcon, Loader2, AlertCircle, Trash2, X } from "lucide-react";

import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { List, Task } from "@/types";

import { toast } from "sonner";

import { AddNewTaskRow } from "./AddNewTaskRow";
import { TaskRowList } from "./TaskRowList";
import { UpdateTaskDto } from "@/services/taskService";
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext";

type BacklogTaskListProps = {
  lists?: List[];
  tasks: Task[];
  isLoading?: boolean;
  error?: any;
  onRowClick: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: UpdateTaskDto) => void;
  onDeleteTasks: (ids: string[]) => Promise<void> | void;
  selectedIds?: string[];
  onSelect?: (taskId: string, checked: boolean) => void;
};

export function BacklogTaskList({
  lists,
  tasks,
  isLoading = false,
  error,
  onRowClick,
  onUpdateTask,
  onDeleteTasks,
  selectedIds,
  onSelect,
}: BacklogTaskListProps) {
  const { isAddingNewRow, setIsAddingNewRow } = useTaskManagementContext();

  // 3. Filter Backlog Tasks (No Sprint)
  const backlogTasks = React.useMemo(
    () => tasks.filter((task) => !task.sprintId && !task.parentId),
    [tasks]
  );

  const listsList = lists ?? [];
  const isEmpty = backlogTasks.length === 0 && !isAddingNewRow;

  const handleUpdateTask = (taskId: string, updates: UpdateTaskDto) => {
    onUpdateTask(taskId, updates);
  };

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
      <div className="rounded-lg">
        <div>
          {isEmpty ? (
            <div
              className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-muted-foreground hover:bg-muted/50 hover:border-primary/50 hover:text-primary transition-all"
              onClick={() => setIsAddingNewRow(true)}
            >
              <PlusIcon className="h-8 w-8 opacity-50" />
              <p className="text-sm font-medium">Your backlog is empty</p>
              <p className="text-xs opacity-70">
                Click here to create a new task
              </p>
            </div>
          ) : (
            <Table>
              <TaskRowList
                tasks={backlogTasks}
                lists={listsList}
                isDraggable={true}
                onRowClick={onRowClick}
                onUpdateTask={handleUpdateTask}
                selectedIds={selectedIds}
                onSelect={onSelect}
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
  );
}
