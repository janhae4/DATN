"use client";

import * as React from "react";
import { Task } from "@/types";
import { List } from "@/types";
import { UpdateTaskDto } from "@/services/taskService";

import { KanbanCard } from "./KanbanCard";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  Plus,
  MoreHorizontal,
  ArrowLeft,
  ArrowRight,
  Pencil,
  Circle,
  Clock,
  CheckCircle2,
  Trash2,
  Settings2,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanAddNewCard } from "./KanbanAddNewCard";
import { motion, AnimatePresence } from "framer-motion";
import { ListCategoryEnum } from "@/types/common/enums";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { ListEditDialog } from "@/components/shared/list/ListEditDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInView } from "react-intersection-observer";

interface KanbanColumnProps {
  projectId: string;
  list: List;
  tasks: Task[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  sprintId: string;
  allLists: List[];
  onListUpdate?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onDeleteList?: () => void;
  onUpdateLimit?: (limit: number | null) => void;
}

export function KanbanColumn({
  projectId,
  list,
  tasks,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  sprintId,
  allLists,
  onListUpdate,
  onMoveLeft,
  onMoveRight,
  onDeleteList,
  onUpdateLimit,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: list.id,
    data: {
      type: "KANBAN_COLUMN",
      list: list,
    },
  });

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      console.log("Load more triggered for list:", list.name);
      fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasNextPage, isFetchingNextPage]);

  const [isAdding, setIsAdding] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [limitInput, setLimitInput] = React.useState(
    list.limited?.toString() || ""
  );

  const prevLimitedRef = React.useRef(list.limited);

  React.useEffect(() => {
    if (prevLimitedRef.current !== list.limited) {
      setLimitInput(list.limited?.toString() || "");
      prevLimitedRef.current = list.limited;
    }
  }, [list.limited]);

  const handleSaveLimit = () => {
    const limit = parseInt(limitInput);
    if (!isNaN(limit) && limit > 0) {
      onUpdateLimit?.(limit);
    } else {
      onUpdateLimit?.(null);
    }
    setIsMenuOpen(false);
  };

  const taskIds = React.useMemo(() => tasks.map((t) => t.id), [tasks]);
  const isDoneColumn = list.category === ListCategoryEnum.DONE;

  const hasLimit = typeof list.limited === "number" && list.limited > 0;
  const isLimitExceeded = hasLimit && tasks.length > list.limited!;

  const currentIndex = allLists.findIndex((l) => l.id === list.id);
  const nextList = allLists[currentIndex + 1];
  const isNextDone = nextList?.category === ListCategoryEnum.DONE;
  const isFirst = allLists[0]?.id === list.id;
  const isLast = allLists[allLists.length - 1]?.id === list.id;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group flex flex-col w-80 flex-shrink-0 bg-secondary rounded-xl border border-transparent h-full max-h-full transition-colors duration-200 overflow-hidden",
        isOver
          ? isDoneColumn
            ? "bg-green-500/10 border-green-500/30 ring-2 ring-green-500/20"
            : "bg-secondary/60 border-primary/20 ring-2 ring-primary/10"
          : isLimitExceeded
            ? "bg-red-500/5 border-red-500/20"
            : ""
      )}
    >
      <div className="flex bg-secondary px-4 pt-4 pb-3 z-20 items-center justify-between shrink-0 border-b border-border/10">
        <div className="flex items-center gap-2.5">
          {list.category === ListCategoryEnum.TODO && (
            <Circle className="h-4 w-4 text-muted-foreground" />

          )}
          {list.category === ListCategoryEnum.IN_PROGRESS && (
            <Clock className="h-4 w-4 text-blue-500" />
          )}
          {list.category === ListCategoryEnum.DONE && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <h3 className="font-semibold text-sm text-foreground/90">
            {list.name}
          </h3>

          <Badge
            variant="secondary"
            className={cn(
              "ml-1 px-1.5 py-0 h-5 text-[10px] font-bold text-muted-foreground bg-background shadow-sm",
              isLimitExceeded && "text-destructive bg-destructive/10"
            )}
          >
            {tasks.length}
            {/* Chỉ hiện limit nếu có */}
            {hasLimit ? ` / ${list.limited}` : ""}
          </Badge>

          {/* Chỉ hiện icon cảnh báo nếu quá limit */}
          {isLimitExceeded && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-destructive-foreground bg-destructive border-destructive">
                <p>WIP Limit Exceeded! This column has too many tasks.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new task</p>
            </TooltipContent>
          </Tooltip>

          {!isDoneColumn && (
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>actions</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled={isFirst} onClick={onMoveLeft}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Move Left
                </DropdownMenuItem>
                <DropdownMenuItem disabled={isLast || isNextDone} onClick={onMoveRight}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Move Right
                </DropdownMenuItem>

                {!isDoneColumn && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Settings2 className="mr-2 h-4 w-4" />
                      Set Limit
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="p-3 w-60">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="limit"
                            className="text-xs font-medium flex items-center gap-2"
                          >
                            WIP Limit
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[200px]" side="right">
                                <p>Work In Progress (WIP) limits restrict the maximum number of tasks allowed in this column to prevent bottlenecks.</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="limit"
                              type="number"
                              value={limitInput}
                              onChange={(e) => setLimitInput(e.target.value)}
                              className="h-8"
                              placeholder="No limit"
                              min="1"
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                            <Button
                              size="sm"
                              onClick={handleSaveLimit}
                              className="h-8"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Leave empty to remove limit.
                        </p>
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                <ListEditDialog
                  projectId={projectId}
                  lists={allLists}
                  initialListId={list.id}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                </ListEditDialog>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onDeleteList}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-2 pb-5 flex flex-col gap-2 relative">
        {/* Add Button / Form at TOP for better visibility and to avoid overlap */}
        <AnimatePresence mode="wait">
          {isAdding && (
            <motion.div
              key="add-new-card"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full shrink-0"
            >
              <KanbanAddNewCard
                listId={list.id}
                projectId={projectId}
                sprintId={sprintId}
                onCancel={() => setIsAdding(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content (Task List) */}

        {/* 1. SortableContext CHỈ bọc danh sách Task */}
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {/* 2. SỬA QUAN TRỌNG: Thay h-full bằng min-h-[50px] */}
          {/* h-full có thể gây lỗi tính toán chiều cao khi scroll */}
          {/* min-h-[50px] tạo ra vùng đệm để thả task vào khi list rỗng */}
          <div className="flex flex-col gap-2.5 min-h-[50px]">
            {tasks.map((task) => (
              <KanbanCard key={task.id} task={task} lists={allLists} />
            ))}
          </div>
        </SortableContext>

        {/* --- CÁC PHẦN DƯỚI ĐÂY ĐƯA RA NGOÀI SORTABLE CONTEXT --- */}

        {/* Empty State - Chỉ để hiển thị visual, không tham gia logic Drag */}
        {tasks.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-muted-foreground/10 rounded-lg bg-background/20 text-muted-foreground/50 min-h-[150px] mt-2">
            <span className="text-sm font-medium">No tasks</span>
            <span className="text-xs">Drop tasks here</span>
          </div>
        )}

        {/* Loader Infinite Scroll */}
        {tasks.length > 0 && (
          <div
            ref={ref} // ref của useInView
            className="py-4 w-full flex justify-center items-center h-10 shrink-0"
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : hasNextPage ? (
              <span className="text-xs text-muted-foreground">
                Loading more...
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/50">
              </span>
            )}
          </div>
        )}

        {/* Global Create Button at bottom (only show when not adding at top) */}
        {!isAdding && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsAdding(true)}
                className="flex hover:bg-background/20 transition-all cursor-pointer duration-200 items-center gap-2 p-2 rounded-lg border-2 border-dashed border-muted-foreground/10 hover:border-primary/30 text-xs font-medium text-muted-foreground/60 hover:text-primary w-full text-left mt-auto shrink-0"
              >
                <Plus className="h-4 w-4" />
                Create task
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to add a new task to this list</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
