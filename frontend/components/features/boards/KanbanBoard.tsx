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
import { calculateNewPositionForTask, calculatePosition } from "@/lib/position-utils";
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
    data,
    allData, // Đảm bảo context trả về allData (toàn bộ task chưa filter)
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
    handleListChange
  } = useTaskManagementContext();

  const { lists, createList, deleteList, updateList } = useLists(projectId);
  const { updateTask } = useTasks(projectId);

  const [items, setItems] = React.useState<Task[]>(data);
  const [filters, setFilters] = React.useState<TaskFilters>({
    searchText: "",
    assigneeIds: [],
    priorities: [],
    listIds: [],
    epicIds: [],
    labelIds: [],
    sprintIds: [],
  });

  // --- Subtask Resolution State ---
  const [isResolveDialogOpen, setIsResolveDialogOpen] = React.useState(false);
  const [pendingSubtasks, setPendingSubtasks] = React.useState<Task[]>([]);
  const [pendingMove, setPendingMove] = React.useState<{
    task: Task;
    overContainerId: string;
    newPosition: number;
    isMovedColumn: boolean;
  } | null>(null);

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
    () => filterTasksByFilters(data, filters),
    [data, filters, filterTasksByFilters]
  );

  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = React.useState<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isAddingList, setIsAddingList] = React.useState(false);
  const [newListName, setNewListName] = React.useState("");
  const [newListCategory, setNewListCategory] = React.useState<ListCategoryEnum>(ListCategoryEnum.TODO);
  const [UILists, setUILists] = React.useState<List[]>(lists);

  // Sync items with filtered data
  React.useEffect(() => {
    if (activeSprint) {
      setItems(
        filteredTasks.filter((t) =>
          // Chỉ hiện task thuộc sprint này VÀ là task cha (parentId null/undefined)
          t.sprintId === activeSprint.id && !t.parentId
        )
      );
    } else {
      setItems([]);
    }
  }, [filteredTasks, activeSprint]);

  // Sync UILists with server lists
  React.useEffect(() => {
    if (lists && lists.length > 0) {
      setUILists(lists);
    }
  }, [lists]);

  const handleAddList = async () => {
    if (!newListName.trim()) return;
    if (newListCategory === ListCategoryEnum.DONE) return;

    await createList({
      name: newListName,
      category: newListCategory,
      position: UILists.length + 1,
      projectId,
    });

    setNewListName("");
    setNewListCategory(ListCategoryEnum.TODO);
    setIsAddingList(false);
  };

  const handleMoveList = async (listId: string, direction: "left" | "right") => {
    const currentIndex = UILists.findIndex((l) => l.id === listId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= UILists.length) return;

    const newLists = [...UILists];
    const [movedList] = newLists.splice(currentIndex, 1);
    newLists.splice(targetIndex, 0, movedList);

    const prevItem = newLists[targetIndex - 1];
    const nextItem = newLists[targetIndex + 1];
    const newPosition = calculatePosition(prevItem?.position, nextItem?.position);

    setUILists(newLists);
    await updateList(listId, { position: newPosition });
  };

  const handleDeleteList = async (listId: string) => {
    const target = lists.find((l) => l.id === listId);
    if (target?.category === ListCategoryEnum.DONE) {
      toast.warning("The Done list cannot be deleted.");
      return;
    }
    if (confirm("Are you sure you want to delete this list?")) {
      await deleteList(listId);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  const tasksByList = React.useMemo(() => {
    const grouped: { [key: string]: Task[] } = {};
    lists.forEach((list) => { grouped[list.id] = []; });
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
    const overContainerId = over.data.current?.type === "KANBAN_COLUMN" ? overId : overTask?.listId;

    if (overContainerId) setOverColumnId(overContainerId as string);

    if (!active.data.current?.task || !overContainerId) return;

    const currentItem = items.find((i) => i.id === active.id);
    if (currentItem && currentItem.listId !== overContainerId) {
      setItems((prev) => prev.map((t) =>
        t.id === active.id ? { ...t, listId: overContainerId as string } : t
      ));
    }
  };

  // Helper thực hiện di chuyển Task
  const executeMoveTask = (task: Task, targetListId: string, newPosition: number, isMovedColumn: boolean) => {
    setItems((prev) => {
      const newItems = prev.filter(t => t.id !== task.id);
      const updatedTask = {
        ...task,
        listId: targetListId,
        position: newPosition
      };
      return [...newItems, updatedTask];
    });

    updateTask(task.id, {
      listId: targetListId,
      position: newPosition
    });

    const targetList = lists.find((l) => l.id === targetListId);
    if (targetList?.category === ListCategoryEnum.DONE && isMovedColumn) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumnId(null);

    if (!over) {
      // Nếu thả ra ngoài, revert lại state gốc
      setItems(filteredTasks.filter((t) => t.sprintId === activeSprint?.id && !t.parentId));
      return;
    }

    const activeTask = active.data.current?.task as Task;
    const overId = over.id as string;

    const overContainerId =
      over.data.current?.type === "KANBAN_COLUMN"
        ? overId
        : over.data.current?.task?.listId;

    if (overContainerId && activeTask) {
      const targetListTasks = tasksByList[overContainerId] || [];
      const newPosition = calculateNewPositionForTask(activeTask.id, overId, targetListTasks);

      const isMovedColumn = activeTask.listId !== overContainerId;
      const isMovedPosition = activeTask.position !== newPosition;

        // --- CHECK SUBTASKS LOGIC ---
        // 1. Tìm thông tin List đích
        const targetList = lists.find(l => l.id === overContainerId);
        const isTargetDone = targetList?.category === ListCategoryEnum.DONE;

        // Debug log để kiểm tra
        console.log("Dragging to:", targetList?.name, "Category:", targetList?.category);

        if (isTargetDone ) {
          console.log("--------------------------------")
          // 2. Tìm tất cả subtasks (dùng allData vì subtask không hiển thị trên board)
          const subtasks = allData.filter(t => t.parentId === activeTask.id);

          // 3. Lấy danh sách ID của các cột DONE
          const doneListIds = lists
            .filter(l => l.category === ListCategoryEnum.DONE)
            .map(l => l.id);

          console.log("doneListIds: --------", doneListIds)
          // 4. Lọc ra các subtask CHƯA hoàn thành (không nằm trong cột DONE)
          const unfinishedSubtasks = subtasks.filter(t =>
            !t.listId || !doneListIds.includes(t.listId)
          );

          if (unfinishedSubtasks.length > 0) {
            console.log("Unfinished subtasks found:", unfinishedSubtasks);
            // STOP: Lưu state và hiện Dialog
            setPendingSubtasks(unfinishedSubtasks);
            setPendingMove({
              task: activeTask,
              overContainerId, // Đây chính là ID của cột DONE vừa thả vào
              newPosition,
              isMovedColumn
            });
            setIsResolveDialogOpen(true);
            return; // Return sớm để chặn executeMoveTask
          }
        }
        // -----------------------------

        executeMoveTask(activeTask, overContainerId, newPosition, isMovedColumn);
      
    }
  };

  const handleConfirmResolve = async () => {
    if (!pendingMove) return;

    // 1. Tìm cột DONE đích thực (để chắc chắn)
    // Nếu overContainerId là cột DONE thì dùng luôn, hoặc tìm cột DONE đầu tiên của project
    const doneList = lists.find(l => l.category === ListCategoryEnum.DONE);
    const targetDoneListId = doneList?.id || pendingMove.overContainerId;

    // 2. Update tất cả subtasks vào cột DONE này
    const promises = pendingSubtasks.map(subtask =>
      updateTask(subtask.id, { listId: targetDoneListId })
    );

    // Chờ server update xong
    await Promise.all(promises);

    // 3. Di chuyển Task Cha vào cột đích (pendingMove.overContainerId)
    executeMoveTask(
      pendingMove.task,
      pendingMove.overContainerId,
      pendingMove.newPosition,
      pendingMove.isMovedColumn
    );

    // 4. Cleanup
    setIsResolveDialogOpen(false);
    setPendingMove(null);
    setPendingSubtasks([]);
    toast.success(`Moved task and resolved ${pendingSubtasks.length} subtasks.`);
  };

  const handleCancelResolve = () => {
    setIsResolveDialogOpen(false);
    setPendingMove(null);
    setPendingSubtasks([]);
    // Revert items về state ban đầu để task cha "bay" về chỗ cũ
    setItems(filteredTasks.filter((t) => t.sprintId === activeSprint?.id && !t.parentId));
  };

  const handleIgnoreResolve = () => {
    if (!pendingMove) return;

    // Chỉ di chuyển task cha, bỏ qua subtasks
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
        setItems(filteredTasks.filter((t) => t.sprintId === activeSprint?.id && !t.parentId));
      }}
    >
      <div className="h-full w-full min-w-0 relative group/board flex flex-col">
        <div className="py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <BacklogFilterBar
            showCreateSprint={false}
            showStatusFilter={false}
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>
        <div
          ref={scrollContainerRef}
          className="flex-1 w-full overflow-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent pb-2"
        >
          <div className="flex w-max gap-6 pt-4">
            {!activeSprint && (
              <KanbanSprintSelection sprints={sprints} onStartSprint={startSprint} />
            )}
            {UILists.map((list) => (
              <KanbanColumn
                key={list.id}
                projectId={projectId}
                list={list}
                sprintId={activeSprint?.id || ""}
                tasks={tasksByList[list.id] || []}
                allLists={UILists}
                onMoveLeft={() => handleMoveList(list.id, "left")}
                onMoveRight={() => handleMoveList(list.id, "right")}
                onDeleteList={() => handleDeleteList(list.id)}
                onUpdateLimit={(limit) => updateList(list.id, { limited: limit })}
                onListUpdate={() => { }}
              />
            ))}
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
                      onValueChange={(value) => setNewListCategory(value as ListCategoryEnum)}
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
                    <Button variant="outline" className="cursor-pointer" onClick={handleAddList} size="icon">
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
            <KanbanCardContent task={activeTask} lists={lists} className="cursor-grabbing" />
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