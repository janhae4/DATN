"use client";

import * as React from "react";
import { KanbanCard, KanbanCardContent } from "./KanbanCard";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  DropAnimation,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
} from "@dnd-kit/core";
import { Task } from "@/types";
import { List } from "@/types";
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext";
import { useLists } from "@/hooks/useList";
import { useTasks } from "@/hooks/useTasks";
import { KanbanColumn } from "./KanbanColumn";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { ListCategoryEnum } from "@/types/common/enums";
import {
  calculateNewPositionForTask,
  calculatePosition,
} from "@/lib/position-utils";
import { KanbanMinimap } from "./KanbanMinimap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Plus, X, Circle, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BacklogFilterBar, TaskFilters } from "../backlogs/BacklogFilterBar";
import { TaskDetailModal } from "../backlogs/taskmodal";

import { KanbanSprintSelection } from "./KanbanSprintSelection";
import { toast } from "sonner";
import { ResolveSubtasksDialog } from "./ResolveSubtasksDialog";
import { GetTasksParams } from "@/services/taskService";
import { useDebounce } from "@/hooks/useDebounce";

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

const collisionDetectionStrategy: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return rectIntersection(args);
};

export function KanbanBoard() {
  const {
    allData,
    projectId,
    selectedTask,
    setSelectedTask,
    handleUpdateCell,
    handleDescriptionChange,
    handleDateChange,
    handlePriorityChange,
    handleAssigneeChange,
    activeSprint,
    sprints,
    startSprint,
    handleListChange,
  } = useTaskManagementContext();

  const { lists, createList, deleteList, updateList } = useLists(projectId);

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

  const apiParams: GetTasksParams = React.useMemo(
    () => ({
      projectId,
      search: debouncedSearch,
      assigneeIds:
        filters.assigneeIds.length > 0 ? filters.assigneeIds : undefined,
      priority: filters.priorities.length > 0 ? filters.priorities : undefined,
      statusId: filters.listIds.length > 0 ? filters.listIds : undefined,
      epicId: filters.epicIds.length > 0 ? filters.epicIds : undefined,
      labelIds: filters.labelIds.length > 0 ? filters.labelIds : undefined,
      // Automatically filter by active sprint, or use manual filter if set
      sprintId: filters.sprintIds.length > 0
        ? filters.sprintIds
        : activeSprint
          ? [activeSprint.id]
          : undefined,
      limit: 50,
    }),
    [projectId, debouncedSearch, filters, activeSprint]
  );

  const {
    tasks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    updateTask,
    createTasks,
    suggestTaskByAi,
  } = useTasks(apiParams);

  const items = React.useMemo(() => {
    return tasks.filter((t) => !t.parentId);
  }, [tasks]);


  // --- Subtask Resolution State ---
  const [isResolveDialogOpen, setIsResolveDialogOpen] = React.useState(false);
  const [pendingSubtasks, setPendingSubtasks] = React.useState<Task[]>([]);
  const [pendingMove, setPendingMove] = React.useState<{
    task: Task;
    overContainerId: string;
    newPosition: number;
    isMovedColumn: boolean;
  } | null>(null);

  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = React.useState<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isAddingList, setIsAddingList] = React.useState(false);
  const [newListName, setNewListName] = React.useState("");
  const [newListCategory, setNewListCategory] =
    React.useState<ListCategoryEnum>(ListCategoryEnum.TODO);


  const handleAddList = async () => {
    if (!newListName.trim()) return;
    if (newListCategory === ListCategoryEnum.DONE) return;

    await createList({
      name: newListName,
      category: newListCategory,
      position: lists.length + 1,
      projectId,
    });

    setNewListName("");
    setNewListCategory(ListCategoryEnum.TODO);
    setIsAddingList(false);
  };

  const handleMoveList = React.useCallback(async (
    listId: string,
    direction: "left" | "right"
  ) => {
    const currentIndex = lists.findIndex((l) => l.id === listId);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "left" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= lists.length) return;

    const newLists = [...lists];
    const [movedList] = newLists.splice(currentIndex, 1);
    newLists.splice(targetIndex, 0, movedList);

    const prevItem = newLists[targetIndex - 1];
    const nextItem = newLists[targetIndex + 1];
    const newPosition = calculatePosition(
      prevItem?.position,
      nextItem?.position
    );

    await updateList(listId, { position: newPosition });
  }, [lists, updateList]);

  const handleDeleteList = React.useCallback(async (listId: string) => {
    const target = lists.find((l) => l.id === listId);
    if (target?.category === ListCategoryEnum.DONE) {
      toast.warning("The Done list cannot be deleted.");
      return;
    }
    if (confirm("Are you sure you want to delete this list?")) {
      await deleteList(listId);
    }
  }, [lists, deleteList]);

  const tasksByList = React.useMemo(() => {
    const grouped: { [key: string]: Task[] } = {};
    lists.forEach((list) => {
      grouped[list.id] = [];
    });

    items.forEach((task) => {
      const listId = task.listId || lists[0]?.id;
      if (listId && grouped[listId]) {
        grouped[listId].push(task);
      } else if (lists[0]?.id) {
        grouped[lists[0].id].push(task);
      }
    });
    return grouped;
  }, [items, lists]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "KANBAN_CARD") {
      setActiveTask(active.data.current.task as Task);
      setOverColumnId(active.data.current.task.listId);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;
    if (!overId || active.id === overId) return;

    const overTask = over.data.current?.task as Task;
    const overContainerId =
      over.data.current?.type === "KANBAN_COLUMN" ? overId : overTask?.listId;

    if (overContainerId) setOverColumnId(overContainerId as string);

    if (!active.data.current?.task || !overContainerId) return;

    // Optimistic update removed - will update when API call completes
  };

  const executeMoveTask = (
    task: Task,
    targetListId: string,
    newPosition: number,
    isMovedColumn: boolean
  ) => {
    // Optimistic update removed - will update when API call completes

    updateTask(task.id, {
      listId: targetListId,
      position: newPosition,
    });

    const targetList = lists.find((l) => l.id === targetListId);
    if (targetList?.category === ListCategoryEnum.DONE && isMovedColumn) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const checkAndHandleSubtasks = (
    activeTask: Task,
    overContainerId: string,
    newPosition: number,
    isMovedColumn: boolean
  ) => {
    const targetList = lists.find((l) => l.id === overContainerId);
    const isTargetDone = targetList?.category === ListCategoryEnum.DONE;

    if (!isTargetDone) return false;

    // Logic: Kiểm tra subtask trong allData (Context) vì API GetTasks có thể bị filter ẩn mất subtask
    const subtasks = allData.filter((t) => t.parentId === activeTask.id);
    const doneListIds = lists
      .filter((l) => l.category === ListCategoryEnum.DONE)
      .map((l) => l.id);

    const unfinishedSubtasks = subtasks.filter(
      (t) => !t.listId || !doneListIds.includes(t.listId)
    );

    if (unfinishedSubtasks.length > 0) {
      setPendingSubtasks(unfinishedSubtasks);
      setPendingMove({
        task: activeTask,
        overContainerId,
        newPosition,
        isMovedColumn,
      });
      setIsResolveDialogOpen(true);
      return true;
    }

    return false;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumnId(null);

    // No need to revert - items is derived from tasks
    if (!over) {
      return;
    }

    const activeTaskData = active.data.current?.task as Task;
    const overId = over.id as string;
    const overContainerId =
      over.data.current?.type === "KANBAN_COLUMN"
        ? overId
        : over.data.current?.task?.listId;

    if (overContainerId && activeTaskData) {
      const targetListTasks = tasksByList[overContainerId] || [];
      const newPosition = calculateNewPositionForTask(
        activeTaskData.id,
        overId,
        targetListTasks
      );

      const isMovedColumn = activeTaskData.listId !== overContainerId;

      const hasPendingSubtasks = checkAndHandleSubtasks(
        activeTaskData,
        overContainerId,
        newPosition,
        isMovedColumn
      );

      if (!hasPendingSubtasks) {
        executeMoveTask(
          activeTaskData,
          overContainerId,
          newPosition,
          isMovedColumn
        );
      }
    }
  };

  const handleConfirmResolve = async () => {
    if (!pendingMove) return;

    const doneList = lists.find((l) => l.category === ListCategoryEnum.DONE);
    const targetDoneListId = doneList?.id || pendingMove.overContainerId;

    const promises = pendingSubtasks.map((subtask) =>
      updateTask(subtask.id, { listId: targetDoneListId })
    );

    await Promise.all(promises);

    executeMoveTask(
      pendingMove.task,
      pendingMove.overContainerId,
      pendingMove.newPosition,
      pendingMove.isMovedColumn
    );

    setIsResolveDialogOpen(false);
    setPendingMove(null);
    setPendingSubtasks([]);
    toast.success(
      `Moved task and resolved ${pendingSubtasks.length} subtasks.`
    );
  };

  const handleCancelResolve = () => {
    setIsResolveDialogOpen(false);
    setPendingMove(null);
    setPendingSubtasks([]);
    // No need to revert - items is derived from tasks
  };

  const handleIgnoreResolve = () => {
    if (!pendingMove) return;
    executeMoveTask(
      pendingMove.task,
      pendingMove.overContainerId,
      pendingMove.newPosition,
      pendingMove.isMovedColumn
    );
    setIsResolveDialogOpen(false);
    setPendingMove(null);
    setPendingSubtasks([]);
    toast.success("Task moved. Subtasks left unchanged.");
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveTask(null);
        setOverColumnId(null);
        // No need to revert - items is derived from tasks
      }}
    >
      <div className="h-full w-full min-w-0 relative group/board flex flex-col">
        <div className="py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <BacklogFilterBar
            showCreateSprint={false}
            showStatusFilter={false}
            filters={filters}
            createTasks={createTasks}
            suggestTaskByAi={suggestTaskByAi}
            onFilterChange={setFilters}
          />
        </div>
        <div
          ref={scrollContainerRef}
          className="flex-1 w-full overflow-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent pb-2"
        >
          <div className="flex h-full gap-4 py-4 pr-4">
            {!activeSprint && (
              <KanbanSprintSelection
                sprints={sprints}
                onStartSprint={startSprint}
              />
            )}
            {lists.map((list) => {
              const handleMoveLeftForList = () => handleMoveList(list.id, "left");
              const handleMoveRightForList = () => handleMoveList(list.id, "right");
              const handleDeleteForList = () => handleDeleteList(list.id);
              const handleUpdateLimitForList = (limit: number | null) => updateList(list.id, { limited: limit });

              return (
                <KanbanColumn
                  key={list.id}
                  projectId={projectId}
                  list={list}
                  sprintId={activeSprint?.id || ""}
                  tasks={tasksByList[list.id] || []}
                  hasNextPage={!!hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  fetchNextPage={fetchNextPage}
                  allLists={lists}
                  onMoveLeft={handleMoveLeftForList}
                  onMoveRight={handleMoveRightForList}
                  onDeleteList={handleDeleteForList}
                  onUpdateLimit={handleUpdateLimitForList}
                  onListUpdate={() => { }}
                />
              );
            })}
            <div className="shrink-0">
              {isAddingList ? (
                <div className="w-80">
                  <div className="bg-secondary p-3 rounded-xl space-y-2">
                    <Input
                      autoFocus
                      placeholder="Enter list name..."
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddList();
                        if (e.key === "Escape") setIsAddingList(false);
                      }}
                      className="bg-background"
                    />
                    <Select
                      value={newListCategory}
                      onValueChange={(value) =>
                        setNewListCategory(value as ListCategoryEnum)
                      }
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ListCategoryEnum.TODO}>
                          <div className="flex items-center gap-2">
                            <Circle className="h-4 w-4 text-muted-foreground" />
                            <span>To Do</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={ListCategoryEnum.IN_PROGRESS}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span>In Progress</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      className="cursor-pointer"
                      onClick={handleAddList}
                      size="icon"
                    >
                      <Check />
                    </Button>
                    <Button
                      variant="outline"
                      className="cursor-pointer"
                      size="icon"
                      onClick={() => setIsAddingList(false)}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => setIsAddingList(true)}
                >
                  <Plus />
                </Button>
              )}
            </div>
          </div>
        </div>
        <KanbanMinimap
          scrollContainerRef={scrollContainerRef}
          itemsCount={lists.length + 1}
        />
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? (
          <motion.div
            initial={{
              rotate: 0,
              scale: 1,
              boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)",
            }}
            animate={{
              rotate: 0,
              scale: 1.05,
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              cursor: "grabbing",
            }}
            exit={{
              rotate: 0,
              scale: 1,
              boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
          >
            <KanbanCardContent
              task={activeTask}
              lists={lists}
              className="cursor-grabbing"
            />
          </motion.div>
        ) : null}
      </DragOverlay>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onListChange={handleListChange}
        onDateChange={handleDateChange}
        onPriorityChange={handlePriorityChange}
        onAssigneeChange={handleAssigneeChange}
        onTitleChange={handleUpdateCell}
        onDescriptionChange={handleDescriptionChange}
        onTaskSelect={setSelectedTask}
        updateTask={updateTask}
        lists={lists}
      />

      <ResolveSubtasksDialog
        open={isResolveDialogOpen}
        onOpenChange={setIsResolveDialogOpen}
        subtasks={pendingSubtasks}
        onConfirm={handleConfirmResolve}
        onCancel={handleCancelResolve}
        onIgnoreAndComplete={handleIgnoreResolve}
      />
    </DndContext>
  );
}
