"use client";

import * as React from "react";
import { useModal } from "@/hooks/useModal";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { List, Task, User } from "@/types";
import { TaskTitle } from "./TaskTitle";
import { TaskDescription } from "./TaskDescription";
import { TaskMetaBox } from "./TaskMetaBox";
// 1. IMPORT COMPONENT MỚI
import { TaskSubtasks } from "./TaskSubtasks"
import { TaskDocuments } from "./TaskDocuments"

type TaskDetailModalProps = {
    task: Task | null
    open?: boolean
    users?: User[]
    lists: List[]
    onOpenChange?: (open: boolean) => void
    onListChange: (taskId: string, listId: string) => void
    onDateChange: (taskId: string, newDate: Date | undefined) => void
    onPriorityChange: (taskId: string, priority: Task["priority"]) => void
    onAssigneeChange: (taskId: string, assigneeIds: string[]) => void
    onTitleChange: (taskId: string, columnId: "title", value: string) => void
    onDescriptionChange: (taskId: string, description: string) => void
    onLabelsChange?: (taskId: string, labelIds: string[]) => void
    onTaskSelect?: (task: Task) => void
}

export function TaskDetailModal({
  task: initialTask,
  lists,
  open: propOpen = false,
  onOpenChange: propOnOpenChange,
  onListChange,
  onDateChange,
  onPriorityChange,
  onAssigneeChange,
  onTitleChange,
  onDescriptionChange,
  onLabelsChange,
  onTaskSelect,
  updateTask
}: TaskDetailModalProps) {
  const { isOpen, onOpenChange } = useModal(propOpen);
  const modalOpen = propOnOpenChange ? propOpen : isOpen;
  const handleOpenChange = propOnOpenChange || onOpenChange;

  // Local state for form fields
  const [task, setTask] = React.useState(initialTask);
  const [title, setTitle] = React.useState(initialTask?.title || "");
  const [description, setDescription] = React.useState(
    initialTask?.description || ""
  );

  // Update local state when initialTask changes
  React.useEffect(() => {
    if (initialTask) {
      setTask(initialTask);
      setTitle(initialTask.title);
      setDescription(initialTask.description || "");
    }
  }, [initialTask]);

  // Don't render anything if no task is selected
  if (!task) return null;

  // Handler functions
  const handleListChange = (listId: string) => onListChange(task.id, listId);
  const handleTaskDateChange = (date: Date | undefined) =>
    onDateChange(task.id, date);
  const handleTaskPriorityChange = (priority: Task["priority"]) =>
    onPriorityChange(task.id, priority);
  const handleTaskAssigneeChange = (assigneeIds: string[]) =>
    onAssigneeChange(task.id, assigneeIds);
  const handleTaskTitleChange = (title: string) =>
    onTitleChange(task.id, "title", title);
  const handleTaskDescriptionChange = (description: string) =>
    onDescriptionChange(task.id, description);
  const handleTaskLabelsChange = (labelIds: string[]) =>
    onLabelsChange?.(task.id, labelIds);

  // Khi click vào 1 subtask trong modal -> yêu cầu component cha switch sang task đó
  const handleSubtaskClick = (subtask: Task) => {
    onTaskSelect?.(subtask);
  };

  return (
    <Sheet open={modalOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6">
        <SheetHeader className="p-0">
          <SheetDescription className="pl-2">ID: {task.id}</SheetDescription>
          <SheetTitle className="sr-only">
            Task Details: {task.title}
          </SheetTitle>
          <TaskTitle
            title={title}
            onTitleChange={(newTitle) => {
              setTitle(newTitle);
              handleTaskTitleChange(newTitle);
            }}
          />
        </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Description */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Description</h3>
                        <TaskDescription
                            description={description}
                            onDescriptionChange={setDescription}
                            onBlur={() => handleTaskDescriptionChange(description)}
                        />
                    </div>
                     {/* Task Meta Information */}
                    <TaskMetaBox
                        task={task}
                        lists={lists}
                        onDateChange={handleTaskDateChange}
                        onPriorityChange={handleTaskPriorityChange}
                        onLabelsChange={handleTaskLabelsChange}
                    />

                    {/* 2. SUBTASKS SECTION */}
                    <TaskSubtasks
                        taskId={task.id}
                        projectId={task.projectId}
                        lists={lists}
                        onRowClick={handleSubtaskClick}
                    />

                    {/* 3. DOCUMENTS SECTION */}
                    <TaskDocuments
                        taskId={task.id}
                        projectId={task.projectId}
                    />

                   

                </div>
            </SheetContent>
        </Sheet>
    )
}
