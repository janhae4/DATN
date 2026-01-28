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

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      console.log("Loading more tasks...");
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
    <div className="flex flex-col relative max-h-[calc(60vh-9rem)] overflow-y-scroll custom-scrollbar">
      <div className="rounded-lg">
        <Table>
          {tasks.length > 0 ? (
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
              {isAddingNewRow && (
                <AddNewTaskRow
                  lists={listsList}
                  onCancel={() => setIsAddingNewRow(false)}
                />
              )}
            </TaskRowList>
          ) : (
            <TableBody>
              {isAddingNewRow ? (
                <AddNewTaskRow
                  lists={listsList}
                  onCancel={() => setIsAddingNewRow(false)}
                />
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-2 border-none">
                    <div
                      className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-muted-foreground hover:bg-muted/50 hover:border-primary/50 hover:text-primary transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddingNewRow(true);
                      }}
                    >
                      <PlusIcon className="h-8  w-8 opacity-50" />
                      <p className="text-sm font-medium">
                        Your backlog is empty
                      </p>
                      <p className="text-xs opacity-70">
                        Click here to create a new task
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </div>

      {!isAddingNewRow && tasks.length > 0 && (
        <Button
          variant="ghost"
          className="w-fit mb-2 justify-start gap-2 bg-primary/5 hover:bg-primary/10 p-4 text-muted-foreground mt-2 ml-2"
          onClick={() => setIsAddingNewRow(true)}
        >
          <PlusIcon className="h-4 w-4" />
          Create Task
        </Button>
      )}

      <div ref={ref} className="" />

      {isFetchingNextPage && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
