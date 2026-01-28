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
import { TaskSubtasks } from "./TaskSubtasks"
import { TaskDocuments } from "./TaskDocuments"
import { useTask } from "@/hooks/useTasks";
import { toast } from "sonner";

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
  updateTask: (taskId: string, updates: any) => void
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

  const { task: liveTask, isLoading: isTaskLoading } = useTask(initialTask?.id || null);

  // Local state for form fields
  const [task, setTask] = React.useState(initialTask);
  const [title, setTitle] = React.useState(initialTask?.title || "");
  const [description, setDescription] = React.useState(
    initialTask?.description || ""
  );

  React.useEffect(() => {
    const currentTask = liveTask || initialTask;
    if (currentTask) {
      setTask(currentTask);
    }
  }, [liveTask, initialTask]);

  const initializedTaskId = React.useRef<string | null>(null);

  React.useEffect(() => {
    const currentTask = liveTask || initialTask;
    if (currentTask && currentTask.id !== initializedTaskId.current) {
      setTitle(currentTask.title || "");
      setDescription(currentTask.description || "");
      initializedTaskId.current = currentTask.id;
    } else if (liveTask && liveTask.id === initializedTaskId.current) {
      if (!description && liveTask.description) {
        setDescription(liveTask.description);
      }
      if (title !== liveTask.title) {
        setTitle(liveTask.title);
      }
    }
  }, [liveTask, initialTask, title, description]);

  if (!task) return null;

  // Handler functions
  const handleListChange = (listId: string) => {
    if (listId === task.listId) return;
    onListChange(task.id, listId);
  };
  const handleTaskDateChange = (date: Date | undefined) => {
    const currentStr = date?.toISOString() || null;
    const taskStr = task.dueDate ? new Date(task.dueDate).toISOString() : null;
    if (currentStr === taskStr) return;
    onDateChange(task.id, date);
  };
  const handleTaskPriorityChange = (priority: Task["priority"]) => {
    if (priority === task.priority) return;
    onPriorityChange(task.id, priority);
  };
  const handleTaskAssigneeChange = (assigneeIds: string[]) => {
    if (JSON.stringify(assigneeIds) === JSON.stringify(task.assigneeIds)) return;
    onAssigneeChange(task.id, assigneeIds);
  };
  const handleTaskTitleChange = (newTitle: string) => {
    if (newTitle.trim() === (liveTask?.title || initialTask?.title || "").trim()) return;
    onTitleChange(task.id, "title", newTitle);
  };
  const handleTaskDescriptionChange = (newDescription: string) => {
    const currentDesc = (liveTask?.description || initialTask?.description || "").trim();
    if (newDescription.trim() === currentDesc) return;
    onDescriptionChange(task.id, newDescription);
  };
  const handleTaskLabelsChange = (labelIds: string[]) => {
    onLabelsChange?.(task.id, labelIds);
  };
  
  const handleSubtaskClick = (subtask: Task) => {
    onTaskSelect?.(subtask);
  };

  return (
    <Sheet open={modalOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6" onPointerDown={(e) => e.stopPropagation()}>
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

        <div className="mt-6 space-y-6 relative">
          {isTaskLoading && !liveTask && (
            <div className="absolute inset-0 bg-background/50 z-50 flex items-center justify-center rounded-md">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          {/* Description */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Description</h3>
            <TaskDescription
              description={description}
              onDescriptionChange={setDescription}
              onBlur={() => handleTaskDescriptionChange(description)}
            />
          </div>

          <TaskMetaBox
            task={task}
            lists={lists}
            onDateChange={handleTaskDateChange}
            onPriorityChange={handleTaskPriorityChange}
            onLabelsChange={handleTaskLabelsChange}
            updateTask={updateTask}
          />

          <TaskSubtasks
            taskId={task.id}
            teamId={task.teamId}
            projectId={task.projectId}
            lists={lists}
            onRowClick={handleSubtaskClick}
          />

          <TaskDocuments
            taskId={task.id}
            projectId={task.projectId}
          />



        </div>
      </SheetContent>
    </Sheet>
  )
}
