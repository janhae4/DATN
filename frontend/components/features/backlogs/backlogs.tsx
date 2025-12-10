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
import { BacklogFilterBar, TaskFilters } from "./BacklogFilterBar";
import { SprintList } from "./sprint/sprintLists";
import { TaskDragOverlay } from "./task/TaskDragOverlay";

// Types
import { Task, Epic, Sprint } from "@/types";

// Hooks (Replaced Context)
import { useTasks } from "@/hooks/useTasks";
import { useSprints } from "@/hooks/useSprints";
import { useEpics } from "@/hooks/useEpics";
import { useLists } from "@/hooks/useList";
import { calculateNewPositionForTask } from "@/lib/position-utils";

export default function Backlogs() {
  // 1. Get Project ID from URL
  const params = useParams();
  const projectId = params.projectId as string;

  // 2. Fetch Data using Hooks
  const { tasks, updateTask, deleteTask, isLoading, error } = useTasks(projectId);
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

  const handleLabelsChange = (taskId: string, labelIds: string[]) => {
    updateTask(taskId, { labelIds });
  };

  const handleEpicChange = (taskId: string, epicId: string | null) => {
    updateTask(taskId, { epicId });
  };

  const handleSprintChange = (taskId: string, sprintId: string | null) => {
    updateTask(taskId, { sprintId });
  };

  const handleRowClick = (task: Task) => {
    setSelectedTask(task);
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

    // 1. Drop onto Epic (Kéo thả vào nhóm Epic bên trái/phải nếu có)
    if (dropType === "epic-drop-area") {
      const epic = over.data.current?.epic as Epic | undefined;
      if (epic && task.epicId !== epic.id) {
        handleEpicChange(task.id, epic.id);
      }
      return;
    }

    // 2. Drop onto Sprint Container (Kéo vào vùng header/trống của Sprint)
    if (dropType === "sprint-drop-area") {
      const sprint = over.data.current?.sprint as Sprint | undefined;
      // Chỉ update nếu task chưa thuộc sprint này
      if (sprint && task.sprintId !== sprint.id) {
        handleSprintChange(task.id, sprint.id);
      }
      return;
    }

    // 3. Drop onto Backlog Area (Kéo vào vùng header Backlog)
    if (over.id === "backlog-drop-area") {
      if (task.sprintId) {
        handleSprintChange(task.id, null);
      }
      return;
    }

    // 4. Drop onto another Task (Xử lý Reorder & Move)
    const overTask = over.data.current?.task as Task | undefined;

    if (overTask) {
      const targetSprintId = overTask.sprintId || null;

      const targetTasks = tasks
        .filter(
          t =>
            t.sprintId === targetSprintId &&
            !t.parentId &&
            t.position != null
        )
        .sort((a, b) => a.position! - b.position!);
      const newPosition = calculateNewPositionForTask(task.id, overTask.id, targetTasks);

      if (task.sprintId !== targetSprintId || task.position !== newPosition) {
        updateTask(task.id, {
          sprintId: targetSprintId, 
          position: newPosition    
        });
      }
    }
  }

  function handleDragCancel() {
    setActiveTask(null);
  }

  // ---- Filtering ----

  const [filters, setFilters] = React.useState<TaskFilters>({
    searchText: "",
    assigneeIds: [],
    priorities: [],
    listIds: [],
    epicIds: [],
    labelIds: [],
    sprintIds: [],
  });

  const filterTasksByFilters = React.useCallback(
    (source: Task[], f: TaskFilters) => {
      const search = f.searchText.trim().toLowerCase();
      return source.filter((task) => {
        if (search && !task.title?.toLowerCase().includes(search)) return false;

        if (f.assigneeIds.length) {
          const hasUnassigned = f.assigneeIds.includes("unassigned");
          const assignees = task.assigneeIds ?? [];
          const matchAssigned = assignees.some((id) => f.assigneeIds.includes(id));
          if (!matchAssigned && !(hasUnassigned && assignees.length === 0)) return false;
        }

        if (f.priorities.length && !f.priorities.includes(task.priority)) return false;

        if (f.listIds.length && (!task.listId || !f.listIds.includes(task.listId))) return false;

        if (f.epicIds.length && (!task.epicId || !f.epicIds.includes(task.epicId))) return false;

        if (f.labelIds.length) {
          const labels = task.labelIds ?? [];
          if (!labels.some((id) => f.labelIds.includes(id))) return false;
        }

        if (f.sprintIds.length && (!task.sprintId || !f.sprintIds.includes(task.sprintId))) return false;

        return true;
      });
    },
    []
  );

  const filteredTasks = React.useMemo(
    () => filterTasksByFilters(tasks, filters),
    [tasks, filters, filterTasksByFilters]
  );

  const filteredBacklogTasks = React.useMemo(
    () => filteredTasks.filter((task) => !task.sprintId && !task.parentId),
    [filteredTasks]
  );

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
          lists={lists}
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
          onLabelsChange={handleLabelsChange}
          onTaskSelect={setSelectedTask}
        />

        <Accordion
          type="multiple"
          defaultValue={["backlog", "sprints", "epics"]}
          className="w-full flex flex-col gap-4"
        >
          <BacklogFilterBar
            filters={filters}
            onFilterChange={setFilters}
          />
          {/* Sprints Section */}
          <SprintList tasks={filteredTasks} />
          {/* Backlog Section */}
          <BacklogAccordionItem
            lists={lists}
            taskCount={filteredBacklogTasks.length}
            tasks={filteredBacklogTasks}
            isLoading={isLoading}
            error={error}
            onRowClick={handleRowClick}
            onUpdateTask={updateTask}
            onDeleteTasks={async (ids) => {
              await Promise.all(ids.map((id) => deleteTask(id)));
            }}
          />

        </Accordion>
      </div>
    </DndContext>
  );
}