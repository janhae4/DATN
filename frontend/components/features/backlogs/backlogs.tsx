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
import { useBacklogTour } from "@/hooks/touring/useBacklogTour";
import { calculateNewPositionForTask } from "@/lib/position-utils";
import { Button } from "@/components/ui/button";
import { Ban, CheckCircle2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BaseTaskFilterDto } from "@/services/taskService";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Backlogs() {
  const params = useParams();
  const projectId = params.projectId as string;
  const teamId = params.teamId as string;

  const [viewLayout, setViewLayout] = React.useState<"list" | "split">("list");

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
  const [sprintPage, setSprintPage] = React.useState(1);
  const { startTour } = useBacklogTour();

  const {
    sprints,
    error: sprintError,
    isLoading: isSprintsLoading,
  } = useSprints(projectId, teamId, [
    SprintStatus.PLANNED,
    SprintStatus.ACTIVE,
    SprintStatus.ARCHIVED,
  ]);

  const visibleSprints = React.useMemo(() => {
    if (!sprints) return [];
    if (filters.sprintIds.length > 0) {
      return sprints.filter((s) => filters.sprintIds.includes(s.id));
    }
    return sprints;
  }, [sprints, filters.sprintIds]);

  const { lists, error: listError } = useLists(projectId);

  console.log("Sprints loaded in Backlogs:", sprints.length);
  const shouldFetchSprintTasks =
    !isSprintsLoading && sprints && sprints.length > 0;

  const sprintQueryFilters: BaseTaskFilterDto = React.useMemo(() => {
    const targetSprintIds =
      filters.sprintIds.length > 0
        ? filters.sprintIds
        : sprints.map((s) => s.id);

    return {
      projectId,
      teamId,
      search: debouncedSearch,
      assigneeIds:
        filters.assigneeIds.length > 0 ? filters.assigneeIds : undefined,
      priority: filters.priorities.length > 0 ? filters.priorities : undefined,
      statusId: filters.listIds.length > 0 ? filters.listIds : undefined,
      epicId: filters.epicIds.length > 0 ? filters.epicIds : undefined,
      labelIds: filters.labelIds.length > 0 ? filters.labelIds : undefined,
      sprintId: targetSprintIds,
      limit: 50,
      page: sprintPage,
    };
  }, [projectId, debouncedSearch, filters, sprintPage, visibleSprints]);

  const backlogQueryFilters: BaseTaskFilterDto = React.useMemo(() => {
    return {
      projectId,
      teamId,
      search: debouncedSearch,
      assigneeIds:
        filters.assigneeIds.length > 0 ? filters.assigneeIds : undefined,
      priority: filters.priorities.length > 0 ? filters.priorities : undefined,
      statusId: filters.listIds.length > 0 ? filters.listIds : undefined,
      epicId: filters.epicIds.length > 0 ? filters.epicIds : undefined,
      labelIds: filters.labelIds.length > 0 ? filters.labelIds : undefined,
      parentId: "null",
      sprintId: "null",
      limit: 10,
    };
  }, [projectId, debouncedSearch, filters]);

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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTasks(backlogQueryFilters);

  const { tasks: sprintTasks } = useTasks(sprintQueryFilters, {
    enabled: shouldFetchSprintTasks,
  });

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

  const pendingSelectedIds = React.useMemo(() => {
    return allVisibleTasks
      .filter(
        (t) => selectedIds.includes(t.id) && t.approvalStatus === "PENDING"
      )
      .map((t) => t.id);
  }, [allVisibleTasks, selectedIds]);

  const handleBulkStatusChange = async (status: "APPROVED" | "REJECTED") => {
    if (pendingSelectedIds.length === 0) {
      toast.info("There is no pending task selected.");
      return;
    }

    try {
      await updateTasks({
        ids: pendingSelectedIds,
        updates: { approvalStatus: status },
      });
    } catch (error) {
      console.error(error);
    }
  };

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

            const currentTasksInSprint = allVisibleTasks.filter(
              (t) => t.sprintId === sprint.id
            );
            const movedTasks = allVisibleTasks.filter((t) =>
              idsNeedUpdate.includes(t.id)
            );
            const newSprintTasks = [...currentTasksInSprint, ...movedTasks];
            console.log(`Tasks in Sprint [${sprint.title}]:`, newSprintTasks);

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
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-300">
            <div className="flex items-center gap-1 p-2 pl-4 pr-2 dark:bg-zinc-900 dark:text-zinc-50 bg-zinc-50 text-zinc-900 rounded-full shadow-2xl border border-zinc-200/20 ring-1 ring-black/5">
              {/* 1. Counter Section */}
              <div className="flex items-center gap-2 mr-2">
                <span className="flex items-center justify-center w-5 h-5 dark:bg-zinc-700 bg-zinc-200 rounded-full text-[10px] font-bold">
                  {selectedIds.length}
                </span>
                <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500 hidden sm:inline-block">
                  selected
                </span>
              </div>

              <div className="h-6 w-[1px] bg-zinc-700 dark:bg-zinc-300 mx-1" />
              <div className="flex items-center gap-1">
                {pendingSelectedIds.length > 0 && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleBulkStatusChange("APPROVED")} // Bạn cần hàm này
                          className="h-9 w-9 rounded-full hover:bg-emerald-500/20 hover:text-emerald-500 text-zinc-400 dark:text-zinc-600 transition-colors"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-emerald-600 border-emerald-600 text-white"
                      >
                        <p>Approve selected</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleBulkStatusChange("REJECTED")}
                          className="h-9 w-9 rounded-full hover:bg-orange-500/20 hover:text-orange-500 text-zinc-400 dark:text-zinc-600 transition-colors"
                        >
                          <Ban className="h-4.5 w-4.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-orange-600 border-orange-600 text-white"
                      >
                        <p>Reject selected</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDeleteSelected}
                      className="h-9 w-9 rounded-full hover:bg-red-500/20 hover:text-red-500 text-zinc-400 dark:text-zinc-600 transition-colors"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-red-600 border-red-600 text-white"
                  >
                    <p>Delete selected</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="h-6 w-[1px] bg-zinc-700 dark:bg-zinc-300 mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearSelection}
                    className="h-9 w-9 rounded-full dark:hover:bg-zinc-800 hover:bg-zinc-200 text-zinc-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Clear selection</p>
                </TooltipContent>
              </Tooltip>
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
            viewLayout={viewLayout}
            onViewLayoutChange={setViewLayout}
            onStartTour={startTour}
          />

          {viewLayout === "list" ? (
            <>
              {/* Sprints Section */}
              <div id="sprint-list-section">
                <SprintList
                  key="sprint-list"
                  sprints={visibleSprints}
                  tasks={tasksInSprints.filter((task) => !task.parentId)}
                  allTasks={allVisibleTasks}
                  onRowClick={handleRowClick}
                  onUpdateTask={updateTask}
                  selectedIds={selectedIds}
                  onSelect={handleSelectTask}
                  onMultiSelectChange={setSelectedIds}
                />
              </div>
              {/* Backlog Section */}
              <div id="backlog-list-section">
                <BacklogAccordionItem
                  key="backlog-item"
                  lists={lists}
                  taskCount={backlogTotal || 0}
                  tasks={tasksInBacklog.filter((task) => !task.parentId)}
                  allTasks={allVisibleTasks}
                  isLoading={isLoading}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  error={error}
                  onRowClick={handleRowClick}
                  onUpdateTask={updateTask}
                  onDeleteTasks={deleteTasks}
                  selectedIds={selectedIds}
                  onSelect={handleSelectTask}
                  onMultiSelectChange={setSelectedIds}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-row gap-6 h-[calc(80vh-190px)] overflow-hidden">
              <div
                id="backlog-list-section"
                className="flex-1 flex flex-col min-w-[450px] h-full overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-3 px-1 shrink-0">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-muted-foreground/30 rounded-full" />
                    Backlog
                  </h3>
                  <Badge
                    variant="secondary"
                    className="rounded-full h-5 text-[10px] font-bold"
                  >
                    {backlogTotal || 0}
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6">
                  <BacklogAccordionItem
                    key="backlog-item-split"
                    lists={lists}
                    taskCount={backlogTotal || 0}
                    tasks={tasksInBacklog.filter((task) => !task.parentId)}
                    allTasks={allVisibleTasks}
                    isLoading={isLoading}
                    fetchNextPage={fetchNextPage}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    error={error}
                    onRowClick={handleRowClick}
                    onUpdateTask={updateTask}
                    onDeleteTasks={deleteTasks}
                    selectedIds={selectedIds}
                    onSelect={handleSelectTask}
                    onMultiSelectChange={setSelectedIds}
                  />
                </div>
              </div>

              <Separator
                orientation="vertical"
                className="h-full bg-border/40 shrink-0"
              />

              <div
                id="sprint-list-section"
                className="flex-1 flex flex-col min-w-[450px] h-full overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-3 px-1 shrink-0">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-primary/40 rounded-full" />
                    Active Sprints
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6">
                  <SprintList
                    key="sprint-list-split"
                    sprints={visibleSprints}
                    tasks={tasksInSprints.filter((task) => !task.parentId)}
                    allTasks={allVisibleTasks}
                    onRowClick={handleRowClick}
                    onUpdateTask={updateTask}
                    selectedIds={selectedIds}
                    onSelect={handleSelectTask}
                    onMultiSelectChange={setSelectedIds}
                  />
                </div>
              </div>
            </div>
          )}
        </Accordion>
      </div>
    </DndContext>
  );
}
