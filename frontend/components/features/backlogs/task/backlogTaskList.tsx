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
import { TaskListSkeleton } from "@/components/skeletons/TaskListSkeleton";
import { PaginationControl } from "@/components/shared/PaginationControl";

type BacklogTaskListProps = {
  lists?: List[];
  tasks: Task[];
  allTasks: Task[];
  isLoading?: boolean;
  error?: any;
  onRowClick: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: UpdateTaskDto) => void;
  onDeleteTasks: (ids: string[]) => Promise<void> | void;
  selectedIds?: string[];
  onSelect?: (taskId: string, checked: boolean) => void;
  onMultiSelectChange: (ids: string[]) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
};

export function BacklogTaskList({
  lists,
  tasks,
  allTasks,
  isLoading = false,
  error,
  onRowClick,
  onUpdateTask,
  selectedIds,
  onSelect,
  onMultiSelectChange,
  page = 1,
  setPage,
  totalPages,
}: BacklogTaskListProps) {
  console.log("Rendering BacklogAccordionItem with", tasks.length, "tasks");

  const { isAddingNewRow, setIsAddingNewRow } = useTaskManagementContext();

  const [isSelectionDragging, setIsSelectionDragging] = React.useState(false);

  React.useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isSelectionDragging) {
        setIsSelectionDragging(false);
      }
    };

    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => window.removeEventListener("pointerup", handleGlobalPointerUp);
  }, [isSelectionDragging]);

  const listsList = lists ?? [];

  const handleUpdateTask = (taskId: string, updates: UpdateTaskDto) => {
    onUpdateTask(taskId, updates);
  };

  // --- Render ---

  if (isLoading) {
    return <TaskListSkeleton />;
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
          {tasks.length === 0 ? (
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
                key="backlog-task-row-list"
                tasks={tasks}
                allTasks={allTasks}
                lists={listsList}
                isDraggable={true}
                onRowClick={onRowClick}
                onUpdateTask={handleUpdateTask}
                selectedIds={selectedIds}
                onSelect={onSelect}
                onMultiSelectChange={onMultiSelectChange}
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

      {!isAddingNewRow && (
        <Button
          variant="ghost"
          className="w-fit justify-start gap-2 bg-primary/5 hover:bg-primary/10 p-4 text-muted-foreground mt-2 ml-2"
          onClick={() => setIsAddingNewRow(true)}
        >
          <PlusIcon className="h-4 w-4" />
          Create Task
        </Button>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="mt-4 pt-4 border-t flex justify-center pb-2">
          <PaginationControl
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
