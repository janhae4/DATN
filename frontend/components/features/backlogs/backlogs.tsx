// components/features/backlogs/backlogs.tsx
"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  pointerWithin,
} from "@dnd-kit/core";

// Components
import {
  Accordion,
} from "@/components/ui/accordion";
import { TaskDetailModal } from "./taskmodal";
import { BacklogAccordionItem } from "./BacklogAccordionItem";
import { BacklogFilterBar } from "./BacklogFilterBar";
import { SprintList } from "./sprint/sprintLists";
import { TaskDragOverlay } from "./task/TaskDragOverlay";

// Types
import { Task, Epic, Sprint } from "@/types";

// Hooks (Replaced Context)
import { useTasks } from "@/hooks/useTasks";
import { useSprints } from "@/hooks/useSprints";
import { useEpics } from "@/hooks/useEpics";
import { useLists } from "@/hooks/useList";

export default function Backlogs() {
  // 1. Get Project ID from URL
  const params = useParams();
  const projectId = params.projectId as string;

  // 2. Fetch Data using Hooks
  const { tasks, updateTask } = useTasks(projectId);
  const { sprints } = useSprints(projectId);
  const { lists } = useLists(projectId);
  const { epics } = useEpics(projectId);

  // 3. Local UI State
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  // 4. Derived State (Backlog Count)
  const backlogTaskCount = React.useMemo(() => {
    return tasks.filter((task) => !task.sprintId).length;
  }, [tasks]);

  // --- Handlers Wrapper around updateTask Mutation ---

  const handleUpdateCell = (taskId: string, columnId: "title", value: string) => {
    updateTask(taskId, { title: value });
  };

  const handleDescriptionChange = (taskId: string, description: string) => {
    updateTask(taskId, { description });
  };

  const handleDateChange = (taskId: string, newDate: Date | undefined) => {
    updateTask(taskId, { dueDate: newDate ? newDate.toISOString() : undefined });
  };

  const handlePriorityChange = (taskId: string, priority: Task["priority"]) => {
    // updateTask(taskId, { priority });
  };

  const handleListChange = (taskId: string, listId: string) => {
    updateTask(taskId, { listId });
  };

  const handleAssigneeChange = (taskId: string, assigneeIds: string[]) => {
    updateTask(taskId, { assigneeIds });
  };

  const handleEpicChange = (taskId: string, epicId: string | null) => {
    updateTask(taskId, { epicId });
  };

  const handleSprintChange = (taskId: string, sprintId: string | null) => {
    updateTask(taskId, { sprintId });
  };

  // --- Drag & Drop Logic ---

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = active.data.current?.task as Task | undefined;
    if (task) {
      setActiveTask(task);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const task = active.data.current?.task as Task | undefined;
    if (!task) return;

    const dropType = over.data.current?.type;

    // 1. Drop onto Epic
    if (dropType === "epic-drop-area") {
      const epic = over.data.current?.epic as Epic | undefined;
      if (epic && task.epicId !== epic.id) {
        handleEpicChange(task.id, epic.id);
      }
      return;
    }

    // 2. Drop onto Sprint
    if (dropType === "sprint-drop-area") {
      const sprint = over.data.current?.sprint as Sprint | undefined;
      if (sprint && task.sprintId !== sprint.id) {
        handleSprintChange(task.id, sprint.id);
      }
      return;
    }

    // 3. Drop onto Backlog Area
    if (over.id === "backlog-drop-area" && task.sprintId) {
      handleSprintChange(task.id, null);
      return;
    }

    // 4. Drop onto another Task (Reorder or Move)
    const overTask = over.data.current?.task as Task | undefined;
    if (overTask) {
      // If tasks are in different sprints/backlog, move the active task to the over task's container
      if (task.sprintId !== overTask.sprintId) {
        handleSprintChange(task.id, overTask.sprintId || null);
        return;
      }


      if (task.id !== overTask.id) {
        console.log("Reordering triggered: ", task.id, "over", overTask.id);
        //  reorder logic
      }
    }
  }

  function handleDragCancel() {
    setActiveTask(null);
  }

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      collisionDetection={pointerWithin}
    >
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <TaskDragOverlay task={activeTask} lists={lists} />
        ) : null}
      </DragOverlay>

      <div className="flex flex-col gap-8 py-4">
        {/* Task Detail Modal */}
        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open: boolean) => {
            if (!open) setSelectedTask(null);
          }}
          onListChange={handleListChange}
          onDateChange={handleDateChange}
          onPriorityChange={handlePriorityChange}
          onAssigneeChange={handleAssigneeChange}
          onTitleChange={handleUpdateCell}
          onDescriptionChange={handleDescriptionChange}
        />

        <Accordion
          type="multiple"
          defaultValue={["backlog", "sprints", "epics"]}
          className="w-full flex flex-col gap-4"
        >
          <BacklogFilterBar />

          {/* Backlog Section */}
          <BacklogAccordionItem
            lists={lists}
            taskCount={backlogTaskCount}

          />

          {/* Sprints Section */}
          <SprintList />
        </Accordion>
      </div>
    </DndContext>
  );
}