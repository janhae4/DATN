"use client";

import * as React from "react";
import { KanbanCard, KanbanCardContent } from "./KanbanCard";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  DropAnimation,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  CollisionDetection,
} from "@dnd-kit/core";
import { Task } from "@/types";
import { List } from "@/types";
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext";
import { useList } from "@/hooks/useList";
import { KanbanColumn } from "./KanbanColumn";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { ListCategoryEnum } from "@/types/common/enums";

import { KanbanMinimap } from "./KanbanMinimap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Plus, X, Circle, Clock, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BacklogFilterBar } from "../backlogs/BacklogFilterBar";
import { TaskDetailModal } from "../backlogs/taskmodal";

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
    handleListChange, 
    projectId,
    selectedTask,
    setSelectedTask,
    handleUpdateCell,
    handleDescriptionChange,
    handleDateChange,
    handlePriorityChange,
    handleAssigneeChange
  } = useTaskManagementContext();
  const { lists, createList, reorderLists, fetchLists, deleteList, updateList } = useList(projectId);

  const [items, setItems] = React.useState<Task[]>(data);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = React.useState<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isAddingList, setIsAddingList] = React.useState(false);
  const [newListName, setNewListName] = React.useState("");
  const [newListCategory, setNewListCategory] = React.useState<ListCategoryEnum>(ListCategoryEnum.TODO);

  React.useEffect(() => {
    setItems(data);
  }, [data]);

  const handleAddList = async () => {
    if (!newListName.trim()) return;

    await createList({
      name: newListName,
      category: newListCategory,
    });

    // Reset state
    setNewListName("");
    setNewListCategory(ListCategoryEnum.TODO);
    setIsAddingList(false);
  };

  const handleMoveList = async (listId: string, direction: "left" | "right") => {
    const currentIndex = lists.findIndex((l) => l.id === listId);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "left" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= lists.length) return;

    const newLists = [...lists];
    const [movedList] = newLists.splice(currentIndex, 1);
    newLists.splice(targetIndex, 0, movedList);

    // Update positions
    const updatedLists = newLists.map((list, index) => ({
      ...list,
      position: index + 1
    }));

    await reorderLists(updatedLists);
  };

  const handleDeleteList = async (listId: string) => {
    if (confirm("Are you sure you want to delete this list?")) {
      await deleteList(listId);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

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

  const columnIds = React.useMemo(() => lists.map((s) => s.id), [lists]);

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

    const activeTask = active.data.current?.task as Task;
    const overTask = over.data.current?.task as Task;

    const overContainerId =
      over.data.current?.type === "KANBAN_COLUMN" ? overId : overTask?.listId;

    if (overContainerId) {
      setOverColumnId(overContainerId as string);
    }

    if (!activeTask || !overContainerId) return;

    // Check if the item is already in the target list in our local state
    const currentItem = items.find((i) => i.id === active.id);
    if (currentItem && currentItem.listId !== overContainerId) {
      setItems((prev) => {
        return prev.map((t) =>
          t.id === active.id ? { ...t, listId: overContainerId as string } : t
        );
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);
    setOverColumnId(null);

    if (!over) {
      // Reset items to data if cancelled
      setItems(data);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Calculate final position and list
    const overContainerId =
      over.data.current?.type === "KANBAN_COLUMN"
        ? overId
        : over.data.current?.task?.listId;

    if (overContainerId) {
      // Commit the change
      const originalTask = data.find((t) => t.id === activeId);
      if (originalTask && originalTask.listId !== overContainerId) {
        handleListChange(activeId, overContainerId as string);

        // Confetti logic
        const targetList = lists.find((l) => l.id === overContainerId);
        if (targetList?.category === ListCategoryEnum.DONE) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#10B981", "#34D399", "#6EE7B7", "#059669"], // Green shades
          });
        }
      }
    }
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
      }}
    >
      <div className="h-full w-full min-w-0 overflow-hidden relative group/board flex flex-col">
        <div className="px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <BacklogFilterBar showCreateSprint={false} showStatusFilter={false} />
        </div>
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent pb-2"
        >
          <div className="flex h-full gap-6 w-max px-4 pt-4">
            {lists.map((list) => (
              <KanbanColumn
                key={list.id}
                list={list}
                tasks={tasksByList[list.id] || []}
                allLists={lists}
                onListUpdate={fetchLists}
                onMoveLeft={() => handleMoveList(list.id, "left")}
                onMoveRight={() => handleMoveList(list.id, "right")}
                onDeleteList={() => handleDeleteList(list.id)}
                onUpdateLimit={(limit) => updateList(list.id, { limited: limit })}
              />
            ))}
            <div className=" shrink-0">
              {isAddingList ? (
                <div className=" w-80">
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
                      className="bg-background "
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
                        <SelectItem value={ListCategoryEnum.DONE}>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Done</span>
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
                      <X className="" />
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
              rotate: 4,
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
            <KanbanCardContent task={activeTask} className="cursor-grabbing" />
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
      />
    </DndContext>
  );
}
