"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Task, List, User } from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  Edit,
  ChevronRight,
  ChevronDown,
  Plus as PlusIcon,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Components
import { PriorityPicker } from "@/components/shared/PriorityPicker";
import { DatePicker } from "@/components/shared/DatePicker";
import { ListPicker } from "@/components/shared/list/ListPicker";
import { EpicPicker } from "@/components/shared/epic/EpicPicker";
import { AssigneePicker } from "@/components/shared/assignee/AssigneePicker";
import { LabelPopover } from "@/components/shared/label/LabelPopover";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LabelTag from "@/components/shared/label/LabelTag";
import { AddNewTaskRow } from "./AddNewTaskRow";

// Hooks & Services
import { UpdateTaskDto } from "@/services/taskService";
import { useTeamMembers } from "@/hooks/useTeam";
import { toast } from "sonner";
import { isEqual } from "lodash";
import { is } from "date-fns/locale";

interface BacklogTaskRowProps {
  task: Task;
  allTasks: Task[];
  lists: List[];
  isDraggable?: boolean;
  selected?: boolean;
  onRowClick?: (task: Task) => void;
  onSelect?: (taskId: string, checked: boolean) => void;
  onUpdateTask: (taskId: string, updates: UpdateTaskDto) => void;
  isSelectionDragging?: boolean;
  onStartSelection?: () => void;
  onMoveSelection?: () => void;
  level?: number;
}

export const BacklogTaskRow = React.memo(_BacklogTaskRow, (prev, next) => {
  if (prev.isSelectionDragging !== next.isSelectionDragging) return false;
  if (next.isSelectionDragging) return false;

  return (
    prev.task === next.task &&
    prev.allTasks === next.allTasks &&
    prev.selected === next.selected &&
    prev.isDraggable === next.isDraggable &&
    prev.level === next.level &&
    isEqual(prev.lists, next.lists)
  );
});

function _BacklogTaskRow({
  task,
  allTasks,
  lists,
  isDraggable = false,
  selected = false,
  onRowClick,
  onSelect,
  onUpdateTask,
  isSelectionDragging = false,
  onStartSelection,
  onMoveSelection,
  level = 0,
}: BacklogTaskRowProps) {
  const params = useParams();
  const teamId = params.teamId as string;

  const subTasks = React.useMemo(() => {
    return allTasks.filter((t) => t.parentId === task.id);
  }, [allTasks, task.id]);

  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = React.useState(false);

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExpanded) {
      setIsExpanded(false);
      setIsAddingSubtask(false);
    } else {
      if (subTasks.length > 0) {
        setIsExpanded(true);
        setIsAddingSubtask(false);
        return;
      }

      if (level < MAX_LEVEL) {
        setIsExpanded(true);
        setIsAddingSubtask(true);
      } else {
        toast.warning("Maximum nesting level reached.");
        setIsExpanded(false);
        setIsAddingSubtask(false);
      }
    }
  };

  const handleAddSubtaskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
    setIsAddingSubtask(true);
  };

  // 3. DND Hook
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({
    id: task.id,
    data: { task },
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const stopPropagation = (e: React.MouseEvent | React.PointerEvent) =>
    e.stopPropagation();

  const [isHovered, setIsHovered] = React.useState(false);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [localTitle, setLocalTitle] = React.useState(task.title);

  React.useEffect(() => {
    setLocalTitle(task.title);
  }, [task.title]);

  const handleTitleSave = () => {
    if (localTitle.trim() && localTitle !== task.title) {
      onUpdateTask(task.id, { title: localTitle });
    } else {
      setLocalTitle(task.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setLocalTitle(task.title);
    setIsEditingTitle(false);
  };

  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const startPos = React.useRef({ x: 0, y: 0 });
  const pointerIdRef = React.useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerIdRef.current = e.pointerId;

    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest('[role="checkbox"]')
    )
      return;

    startPos.current = { x: e.clientX, y: e.clientY };

    longPressTimer.current = setTimeout(() => {
      onStartSelection?.();
      if (navigator.vibrate) navigator.vibrate(50);

      const targetEl = e.currentTarget as HTMLElement;
      if (targetEl && targetEl.releasePointerCapture) {
        try {
          targetEl.releasePointerCapture(e.pointerId);
        } catch (e) { }
      }
    }, 400);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (longPressTimer.current) {
      const dx = Math.abs(e.clientX - startPos.current.x);
      const dy = Math.abs(e.clientY - startPos.current.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    onMoveSelection?.();
  };

  const MAX_VISIBLE = 2;
  const MAX_LEVEL = 4;
  const labels = task.taskLabels || [];
  const visibleLabels = labels.slice(0, MAX_VISIBLE);
  const remainingCount = labels.length - MAX_VISIBLE;
  const hiddenLabels = labels.slice(MAX_VISIBLE);

  const { data: teamMembers } = useTeamMembers(teamId);

  return (
    <>
      <TableRow
        ref={setNodeRef}
        {...attributes}
        style={{
          ...style,
          touchAction: isSelectionDragging ? "none" : "pan-y",
        }}
        className={cn(
          "group cursor-pointer hover:bg-muted/50 transition-colors select-none p-2",
          isDragging &&
          "opacity-40 bg-muted/50 border-dashed border-2 border-primary/20 grayscale",
          selected &&
          "bg-primary/5 hover:bg-primary/15 data-[state=selected]:bg-primary/5 rounded-lg p-10"
        )}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (isSelectionDragging) return;

          if (
            target.closest("button") ||
            target.closest("input") ||
            target.closest('[role="combobox"]') ||
            target.closest('[role="checkbox"]')
          ) {
            return;
          }
          onRowClick?.(task);
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerEnter={handlePointerEnter}
      >
        <TableCell className="w-full">
          <div
            className="flex items-center gap-1 relative"
            style={{ paddingLeft: `${level * 24}px` }}
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 rounded-md text-muted-foreground flex-shrink-0 cursor-grab",
                !isDraggable && "invisible",
                isDragging && "cursor-grabbing"
              )}
              {...listeners}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={stopPropagation}
            >
              <GripVertical className="h-4 w-4" />
            </Button>

            <div
              className="p-1 flex items-center justify-center"
              onMouseDown={stopPropagation}
              onClick={stopPropagation}
            >
              <Checkbox
                className="h-4 w-4 flex-shrink-0"
                checked={selected}
                onCheckedChange={(checked) => {
                  onSelect?.(task.id, !!checked);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Nút Toggle kiêm Create Subtask */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 p-0 hover:bg-muted text-muted-foreground transition-all",
                subTasks.length > 0 || isAddingSubtask
                  ? "opacity-100 w-6"
                  : "opacity-0 w-0 overflow-hidden group-hover:w-6 group-hover:opacity-100"
              )}
              onClick={handleToggleExpand}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Input
                  autoFocus
                  className="border-none bg-white h-auto px-2 shadow-none focus-visible:ring-2 text-sm flex-1 min-w-0"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleTitleSave();
                    } else if (e.key === "Escape") {
                      handleTitleCancel();
                    }
                  }}
                  onBlur={handleTitleSave}
                  onPointerDown={stopPropagation}
                  onClick={stopPropagation}
                />
              </div>
            ) : (
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="px-2 text-sm truncate block max-w-[200px]">
                  {task.title}
                </span>

                {/* Badge đếm số subtask (chỉ hiện khi đang đóng) */}
                {!isExpanded && subTasks.length > 0 && (
                  <div className="flex items-center text-[10px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-sm border">
                    <Network className="w-3 h-3 mr-1" />
                    {subTasks.length}
                  </div>
                )}
              </div>
            )}
          </div>
        </TableCell>

        {/* --- CÁC CỘT KHÁC (GIỮ NGUYÊN) --- */}
        <TableCell></TableCell>

        <TableCell
          className="w-fit whitespace-nowrap"
          onClick={stopPropagation}
        >
          <div className="flex justify-end gap-2">
            {" "}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100">
              {!isEditingTitle && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-md cursor-pointer text-muted-foreground flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              <LabelPopover
                taskId={task.id}
                initialSelectedLabels={labels}
                onSelectionChange={(newLabels: any[]) =>
                  onUpdateTask(task.id, {
                    labelIds: newLabels.map((l: any) => l.id),
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              {visibleLabels.map((label: any) => (
                <LabelTag
                  key={label.id}
                  label={label}
                  onRemove={() => {
                    const newLabelIds = labels
                      .filter((l: any) => l.id !== label.id)
                      .map((l: any) => l.id);
                    onUpdateTask(task.id, { labelIds: newLabelIds });
                  }}
                />
              ))}
              {remainingCount > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80 px-2"
                      >
                        +{remainingCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="p-2 bg-background">
                      <div className="flex flex-col gap-1">
                        {hiddenLabels.map((hiddenLabel: any) => (
                          <LabelTag key={hiddenLabel.id} label={hiddenLabel} />
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </TableCell>

        <TableCell
          className="w-fit whitespace-nowrap"
          onClick={stopPropagation}
        >
          <EpicPicker
            value={task.epicId || null}
            onChange={(epicId) =>
              onUpdateTask(task.id, { epicId: epicId === null ? null : epicId })
            }
          />
        </TableCell>

        <TableCell
          className="w-fit whitespace-nowrap"
          onClick={stopPropagation}
        >
          <ListPicker
            lists={lists}
            value={task.listId || null}
            onChange={(listId) => onUpdateTask(task.id, { listId })}
          />
        </TableCell>

        <TableCell className="w-fit whitespace-nowrap">
          <div onPointerDown={stopPropagation} onClick={stopPropagation}>
            <PriorityPicker
              priority={task.priority ?? undefined}
              onPriorityChange={(newPriority) => {
                onUpdateTask(task.id, { priority: newPriority ?? undefined });
              }}
            />
          </div>
        </TableCell>

        <TableCell className="w-fit text-center whitespace-nowrap">
          <div onPointerDown={stopPropagation} onClick={stopPropagation}>
            <AssigneePicker
              value={task.assigneeIds || []}
              users={teamMembers || []}
              onChange={(newAssigneeIds) => {
                onUpdateTask(task.id, { assigneeIds: newAssigneeIds });
              }}
            />
          </div>
        </TableCell>

        <TableCell className="w-[100px] whitespace-nowrap">
          <div onPointerDown={stopPropagation} onClick={stopPropagation}>
            <DatePicker
              date={task.dueDate ? new Date(task.dueDate) : undefined}
              onDateSelect={(date) =>
                onUpdateTask(task.id, {
                  dueDate: date ? date.toISOString() : undefined,
                })
              }
            />
          </div>
        </TableCell>
      </TableRow>

      {/* --- RENDER SUBTASKS & CREATE ROW (NESTED) --- */}
      {isExpanded && (
        <>
          {/* Render danh sách task con */}
          {subTasks.map((subtask) => (
            <BacklogTaskRow
              key={subtask.id}
              task={subtask}
              lists={lists}
              isDraggable={false}
              selected={selected}
              onRowClick={onRowClick}
              onSelect={onSelect}
              onUpdateTask={onUpdateTask}
              allTasks={allTasks}
              isSelectionDragging={isSelectionDragging}
              onStartSelection={onStartSelection}
              onMoveSelection={onMoveSelection}
              level={level + 1} // Tăng level để thụt sâu hơn
            />
          ))}

          {/* 1. Form tạo subtask mới (Nếu đang trong chế độ thêm) */}
          {isAddingSubtask ? (
            <AddNewTaskRow
              lists={lists}
              sprintId={task.sprintId || undefined}
              parentId={task.id}
              epicId={task.epicId}
              onCancel={() => setIsAddingSubtask(false)}
              isSubtask={true}
            />
          ) : (
            /* 2. Nút "Create Task" (Nếu không ở chế độ thêm VÀ đã có task con) */
            subTasks.length > 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10} className="p-y-2 border-0">
                  <div
                    className="flex items-center"
                    style={{ paddingLeft: `${(level + 1) * 24 + 48}px` }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-transparent -ml-2"
                      onClick={() => setIsAddingSubtask(true)}
                    >
                      <PlusIcon className="mr-1 h-3 w-3" />
                      Create Task
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          )}
        </>
      )}
    </>
  );
}
