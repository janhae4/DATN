"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  pointerWithin,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  MeasuringStrategy,
} from "@dnd-kit/core";

import { Accordion } from "@/components/ui/accordion";
import { TaskDetailModal } from "./taskmodal";
import { BacklogAccordionItem } from "./BacklogAccordionItem";
import { BacklogFilterBar, TaskFilters } from "./BacklogFilterBar";
import { SprintList } from "./sprint/sprintLists";
import { TaskDragOverlay } from "./task/TaskDragOverlay";
import { Task, Epic, Sprint, SprintStatus } from "@/types";
import { useTasks } from "@/hooks/useTasks";
import { useSprints } from "@/hooks/useSprints";
import { useLists } from "@/hooks/useList";
import { calculateNewPositionForTask } from "@/lib/position-utils";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { GetTasksParams } from "@/services/taskService";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

export default function Backlogs() {
  // 1. Get Project ID from URL
  const params = useParams();
  const projectId = params.projectId as string;
  const teamId = params.teamId as string;

  const [filters, setFilters] = React.useState<TaskFilters>({
    searchText: "",
    assigneeIds: [],
    priorities: [],
    listIds: [],
    epicIds: [],
    labelIds: [],
    sprintIds: [],
  });

  const [debouncedSearch] = useDebounce(filters.searchText, 500);
  const [backLogPage, setBackLogPage] = React.useState(1);
  const [sprintPage, setSprintPage] = React.useState(1);

  const { sprints } = useSprints(projectId, teamId, [
    SprintStatus.PLANNED,
    SprintStatus.ACTIVE,
    SprintStatus.ARCHIVED,
  ]);
  const { lists } = useLists(projectId);

  console.log("Sprints loaded in Backlogs:", sprints.length);

  const sprintQueryFilters: GetTasksParams = React.useMemo(() => {
    const { sprintIds, ...otherFilters } = filters;

    return {
      projectId,
      search: debouncedSearch,
      assigneeIds:
        filters.assigneeIds.length > 0 ? filters.assigneeIds : undefined,
      priority: filters.priorities.length > 0 ? filters.priorities : undefined,
      statusId: filters.listIds.length > 0 ? filters.listIds : undefined,
      epicId: filters.epicIds.length > 0 ? filters.epicIds : undefined,
      labelIds: filters.labelIds.length > 0 ? filters.labelIds : undefined,
      sprintId: sprints.length > 0 ? sprints.map((s) => s.id) : undefined,
      limit: 50,
      page: sprintPage,
    };
  }, [projectId, debouncedSearch, filters, sprintPage, sprints]);

  const backlogQueryFilters: GetTasksParams = React.useMemo(() => {
    return {
      projectId,
      search: debouncedSearch,
      assigneeIds:
        filters.assigneeIds.length > 0 ? filters.assigneeIds : undefined,
      priority: filters.priorities.length > 0 ? filters.priorities : undefined,
      statusId: filters.listIds.length > 0 ? filters.listIds : undefined,
      epicId: filters.epicIds.length > 0 ? filters.epicIds : undefined,
      labelIds: filters.labelIds.length > 0 ? filters.labelIds : undefined,
      parentId: "null",
      sprintId: "null",
      limit: 8,
      page: backLogPage,
    };
  }, [projectId, debouncedSearch, filters, backLogPage]);

  // const { epics } = useEpics(projectId);
  const {
    tasks: backlogTasks,
    updateTask,
    updateTasks,
    deleteTasks,
    isLoading,
    error,
    createTasks,
    suggestTaskByAi,
    totalPages,
    total: backlogTotal,
  } = useTasks(backlogQueryFilters);

  console.log("🏷️ Backlogs Rendered with filters:", backlogTasks.length);

  const { tasks: sprintTasks, isLoading: isLoadingSprint } =
    useTasks(sprintQueryFilters);

  console.log("🏷️ Sprints Rendered with filters:", sprintTasks.length);

  const allVisibleTasks = React.useMemo(() => {
    return [...sprintTasks, ...backlogTasks];
  }, [sprintTasks, backlogTasks]);

  const tasksInSprints = sprintTasks;
  const tasksInBacklog = backlogTasks;
  console.log("Tasks in Backlog:", tasksInBacklog.length);

  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [accordionValue, setAccordionValue] = React.useState<string[]>([
    "backlog",
    "sprints",
    "epics",
  ]);
  const [isSelectingMode, setIsSelectingMode] = React.useState<boolean | null>(
    null
  );
  const backlogTaskCount = tasksInBacklog.length;

  const handleUpdateCell = (
    taskId: string,
    columnId: "title",
    value: string
  ) => {
    updateTask(taskId, { title: value });
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(taskId) ? prev : [...prev, taskId];
      } else {
        return prev.filter((id) => id !== taskId);
      }
    });
  };

  const handleDescriptionChange = (taskId: string, description: string) => {
    updateTask(taskId, { description });
  };

  const handleDateChange = (taskId: string, newDate: Date | undefined) => {
    updateTask(taskId, {
      dueDate: newDate ? newDate.toISOString() : undefined,
    });
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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const task = active.data.current?.task as Task | undefined;
    if (!task) return;

    let tasksToMoveIds: string[] = [task.id];

    if (selectedIds.includes(task.id)) {
      tasksToMoveIds = selectedIds;
    }

    const dropType = over.data.current?.type;

    if (dropType === "sprint-drop-area") {
      const sprint = over.data.current?.sprint as Sprint | undefined;
      console.log("Dropped into sprint:", sprint);
      if (sprint) {
        const idsNeedUpdate = tasksToMoveIds.filter((id) => {
          const t = allVisibleTasks.find((x) => x.id === id);
          return t && t.sprintId !== sprint.id;
        });

        if (idsNeedUpdate.length > 0) {
          try {
            await updateTasks({
              ids: idsNeedUpdate,
              updates: { sprintId: sprint.id },
            });
            toast.success(`Moved ${idsNeedUpdate.length} tasks to sprint`);
            setSelectedIds([]);
          } catch (error) {
            console.error(error);
            toast.error("Failed to move tasks to sprint");
          }
        }
      }
      return;
    }

    if (over.id === "backlog-drop-area") {
      const idsNeedUpdate = tasksToMoveIds.filter((id) => {
        const t = allVisibleTasks.find((x) => x.id === id);
        return t && t.sprintId;
      });

      if (idsNeedUpdate.length > 0) {
        try {
          await updateTasks({
            ids: idsNeedUpdate,
            updates: { sprintId: null },
          });
          toast.success(`Moved ${idsNeedUpdate.length} tasks to backlog`);
          setSelectedIds([]);
        } catch (error) {
          console.error(error);
          toast.error("Failed to move tasks to backlog");
        }
      }
      return;
    }

    // --- CASE 3: Thả vào Epic ---
    if (dropType === "epic-drop-area") {
      const epic = over.data.current?.epic as Epic | undefined;
      if (epic && task.epicId !== epic.id) {
        handleEpicChange(task.id, epic.id);
      }
      return;
    }

    const overTask = over.data.current?.task as Task | undefined;

    if (overTask) {
      const targetSprintId = overTask.sprintId || null;

      const targetTasks = allVisibleTasks
        .filter(
          (t) =>
            t.sprintId === targetSprintId && !t.parentId && t.position != null
        )
        .sort((a, b) => a.position! - b.position!);

      const newPosition = calculateNewPositionForTask(
        task.id,
        overTask.id,
        targetTasks
      );

      if (task.sprintId !== targetSprintId || task.position !== newPosition) {
        updateTask(task.id, {
          sprintId: targetSprintId,
          position: newPosition,
        });
      }
    }
  }

  function handleDragCancel() {
    setActiveTask(null);
  }

  const handleClearSelection = () => setSelectedIds([]);

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await deleteTasks(selectedIds);
      toast.success(`Deleted ${selectedIds.length} tasks`);
      setSelectedIds([]);
    } catch (err) {
      toast.error("Failed to delete tasks");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      collisionDetection={pointerWithin}
    >
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <TaskDragOverlay
            task={activeTask}
            lists={lists}
            selectedCount={
              selectedIds.includes(activeTask.id) ? selectedIds.length : 1
            }
          />
        ) : null}
      </DragOverlay>

      <div className="flex flex-col gap-8 py-4 relative">
        {selectedIds.length > 0 && (
          <div
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-1.5 pl-5 
                  bg-white/10 dark:bg-black/20 backdrop-blur-xl 
                  rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] 
                  border border-white/20 dark:border-white/10
                  animate-in fade-in zoom-in-95 slide-in-from-bottom-10 transition-all duration-500 ease-out"
          >
            <div className="flex items-center gap-2 mr-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[13px] font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
                {selectedIds.length}{" "}
                <span className="font-medium opacity-70">selected</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Nút Xóa với hiệu ứng Hover màu đỏ mềm */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteSelected}
                className="h-9 px-4 rounded-full bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white 
                   transition-all duration-300 gap-2 text-xs font-bold border border-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Confirm Delete
              </Button>

              {/* Nút Hủy (X) - Glass effect */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-white/20 dark:hover:bg-zinc-800/50 transition-colors"
                onClick={handleClearSelection}
              >
                <X className="h-4 w-4 text-zinc-500" />
              </Button>
            </div>
          </div>
        )}
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
          updateTask={updateTask}
        />
        <Accordion
          type="multiple"
          value={accordionValue}
          onValueChange={setAccordionValue}
          className="w-full flex flex-col gap-4"
        >
          <BacklogFilterBar
            filters={filters}
            onFilterChange={setFilters}
            createTasks={createTasks}
            suggestTaskByAi={suggestTaskByAi}
          />
          {/* Sprints Section */}
          <SprintList
            key="sprint-list"
            tasks={tasksInSprints.filter((task) => !task.parentId)}
            allTasks={allVisibleTasks}
            onRowClick={handleRowClick}
            onUpdateTask={updateTask}
            selectedIds={selectedIds}
            onSelect={handleSelectTask}
            onMultiSelectChange={setSelectedIds}
          />
          {/* Backlog Section */}
          <BacklogAccordionItem
            key="backlog-item"
            lists={lists}
            taskCount={backlogTotal || 0}
            tasks={tasksInBacklog.filter((task) => !task.parentId)}
            allTasks={allVisibleTasks}
            isLoading={isLoading}
            totalPages={totalPages}
            page={backLogPage}
            setPage={setBackLogPage}
            error={error}
            onRowClick={handleRowClick}
            onUpdateTask={updateTask}
            onDeleteTasks={deleteTasks}
            selectedIds={selectedIds}
            onSelect={handleSelectTask}
            onMultiSelectChange={setSelectedIds}
          />
        </Accordion>
      </div>
    </DndContext>
  );
}
