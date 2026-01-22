"use client";

import * as React from "react";
import { PlusIcon, Loader2, AlertCircle, Trash2, X } from "lucide-react";

import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { List, Task } from "@/types";
import { AddNewTaskRow } from "./AddNewTaskRow";
import { TaskRowList } from "./TaskRowList";
import { UpdateTaskDto } from "@/services/taskService";
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext";
import { TaskListSkeleton } from "@/components/skeletons/TaskListSkeleton";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";

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
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
};

export function BacklogTaskList({
  lists,
  tasks,
  allTasks,
  isLoading = false,
  error,
  onRowClick,
  onUpdateTask,
  onDeleteTasks,
  selectedIds,
  onSelect,
  onMultiSelectChange,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: BacklogTaskListProps) {
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

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const listsList = lists ?? [];

  const handleUpdateTask = (taskId: string, updates: UpdateTaskDto) => {
    onUpdateTask(taskId, updates);
  };

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
    <div className="flex flex-col relative max-h-[calc(60vh-9rem)] bg-background rounded-lg">
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <Table>
          {(tasks.length > 0 || isFetchingNextPage) && (
            <TaskRowList
              key="backlog-task-row-list"
              tasks={tasks}
              allTasks={allTasks}
              lists={listsList}
              isDraggable={true}
              onRowClick={onRowClick}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={(id) => onDeleteTasks([id])}
              selectedIds={selectedIds}
              onSelect={onSelect}
              onMultiSelectChange={onMultiSelectChange}
            >
              <TableRow className="hover:bg-transparent border-none">
                <TableCell colSpan={5} className="p-0 border-none">
                  <div ref={ref} className="h-4 w-full" />
                  {isFetchingNextPage && (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            </TaskRowList>
          )}
        </Table>

        {!tasks.length && !isFetchingNextPage && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p>No tasks in Backlog</p>
          </div>
        )}
      </div>

      <div className="shrink-0 z-10 bg-card sticky bottom-2">
        {isAddingNewRow ? (
          <AddNewTaskRow
            lists={listsList}
            sprintId={""}
            onCancel={() => setIsAddingNewRow(false)}
          />
        ) : (
          <div className="flex items-center gap-4 p-4">
            <Button
              variant="ghost"
              className="flex items-center gap-4 p-2 text-zinc-500 bg-zinc-50 cursor-pointer"
              onClick={() => setIsAddingNewRow(true)}
            >
              <PlusIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Create Task</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
