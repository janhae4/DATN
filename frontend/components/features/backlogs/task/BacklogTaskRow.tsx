"use client";

import * as React from "react";
import { Task, List } from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PriorityPicker } from "@/components/shared/PriorityPicker";
import { DatePicker } from "@/components/shared/DatePicker";
import { ListPicker } from "@/components/shared/list/ListPicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, GripVertical, Edit, Plus } from "lucide-react";
import { getAssigneeInitial } from "@/lib/backlog-utils";
import { db } from "@/public/mock-data/mock-data";
import { LabelPopover } from "@/components/shared/label/LabelPopover";
import { cn } from "@/lib/utils";
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EpicPicker } from "@/components/shared/epic/EpicPicker";
import { AssigneePicker } from "@/components/shared/assignee/AssigneePicker";
import LabelTag from "@/components/shared/label/LabelTag";

interface BacklogTaskRowProps {
  task: Task;
  lists: List[];
  isDraggable?: boolean;
  onRowClick?: (task: Task) => void;
  selected?: boolean;
  onSelect?: (taskId: string, checked: boolean) => void;
}

export function BacklogTaskRow({
  task,
  lists,
  isDraggable = false,
  onRowClick,
  selected = false,
  onSelect,
}: BacklogTaskRowProps) {
  const {
    handleUpdateCell,
    handleListChange,
    handlePriorityChange,
    handleDateChange,
    handleLabelChange,
    handleRowClick: handleRowClickContext,
    handleEpicChange,
    handleAssigneeChange,
  } = useTaskManagementContext();

  // --- DND-KIT HOOK (Không thay đổi) ---
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({
    // <-- Đổi tên hook
    id: task.id,
    data: {
      task: task,
    },
    disabled: !isDraggable,
  });
  // --- END DND-KIT HOOK ---

  const stopPropagation = (e: React.MouseEvent | React.PointerEvent) =>
    e.stopPropagation();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [localTitle, setLocalTitle] = React.useState(task.title);

  // Sync local title when task title changes
  React.useEffect(() => {
    setLocalTitle(task.title);
  }, [task.title]);

  // Save title
  const handleTitleSave = () => {
    if (localTitle.trim() && localTitle !== task.title) {
      handleUpdateCell(task.id, "title", localTitle);
    } else {
      setLocalTitle(task.title); // Revert if empty or same
    }
    setIsEditingTitle(false);
  };

  // Cancel edit title
  const handleTitleCancel = () => {
    setLocalTitle(task.title);
    setIsEditingTitle(false);
  };
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      {...attributes}
      style={style}
      className={cn(
        "group cursor-pointer hover:bg-muted/50 transition-colors",
        isDragging && "opacity-40 bg-muted/50 border-dashed border-2 border-primary/20 grayscale"
      )}
      onClick={() => onRowClick?.(task) || handleRowClickContext?.(task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TableCell className="w-full">
        <div className="flex items-center gap-1 relative pr-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 rounded-md text-muted-foreground flex-shrink-0 cursor-grab",
              !isDraggable && "invisible",
              isDragging && "cursor-grabbing"
            )}
            {...listeners}
            onClick={stopPropagation}
          >
            <GripVertical className="h-4 w-4" />
          </Button>

          <Checkbox
            className="h-4 w-4 flex-shrink-0"
            checked={selected}
            onCheckedChange={(checked) => onSelect?.(task.id, !!checked)}
            onClick={stopPropagation}
            onPointerDown={stopPropagation}
          />

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
              <Button
                size="sm"
                className="h-7 px-3 text-xs shrink-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTitleSave();
                }}
              >
                Save
              </Button>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="px-2 text-sm truncate block text-left">
                    {task.title.length > 50
                      ? `${task.title.substring(0, 50)}...`
                      : task.title}
                  </span>
                </TooltipTrigger>
                {task.title.length > 50 && (
                  <TooltipContent>
                    <p className="max-w-xs">{task.title}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          )}

          {/* Label tags shown after title input */}
          {!isEditingTitle && (
            <div
              className="flex items-center gap-1 ml-2 flex-shrink-0 max-w-[10rem] overflow-x-hidden transition-transform duration-200 group-hover:-translate-x-[56px]"
              onPointerDown={stopPropagation}
              onClick={stopPropagation}
            >
              {(task.labelIds || []).slice(0, 2).map((labelId) => {
                const label = db.labels.find((l) => l.id === labelId);
                if (!label) return null;
                return <LabelTag key={label.id} label={label} />;
              })}
              {(task.labelIds || []).length > 2 && (
                <span className="text-xs border text-muted-foreground px-1.5 py-0.5 bg-muted rounded-full">
                  +{(task.labelIds || []).length - 2}
                </span>
              )}
            </div>
          )}

          {!isEditingTitle && (
            <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background pl-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    onPointerDown={stopPropagation}
                    onClick={stopPropagation}
                  >
                    <LabelPopover
                      initialSelectedLabelIds={task.labelIds || []}
                      onSelectionChange={(newLabels) => {
                        const newLabelIds = newLabels.map((l) => l.id);
                        handleLabelChange(task.id, newLabelIds);
                      }}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Label</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 cursor-pointer w-6 rounded-md text-muted-foreground flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rename</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="w-fit whitespace-nowrap">
        <div
          className={cn(
            "w-full h-full flex items-center",
            !task.epicId &&
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          )}
          onClick={(e) => {
            // Only stop propagation if clicking on the container div, not the EpicPicker
            if (e.target === e.currentTarget) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <EpicPicker
              value={task.epicId || null}
              onChange={(epicId) => {
                handleEpicChange(task.id, epicId);
              }}
            />
          </div>
        </div>
      </TableCell>

      <TableCell
        className="w-fit whitespace-nowrap"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          return false;
        }}
      >
        <div
          className="w-full h-full"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <ListPicker
            lists={lists}
            value={task.listId || null}
            onChange={(listId) => {
              if (listId) {
                handleListChange(task.id, listId);
              }
            }}
            disabled={false}
          />
        </div>
      </TableCell>

      {/*
       * * SỬA Ở ĐÂY: w-[110px] -> w-fit
       * */}
      <TableCell className="w-fit whitespace-nowrap">
        <div onPointerDown={stopPropagation} onClick={stopPropagation}>
          <PriorityPicker
            priority={task.priority}
            onPriorityChange={(p) => handlePriorityChange(task.id, p)}
          />
        </div>
      </TableCell>

      {/*
       * * SỬA Ở ĐÂY: w-[50px] -> w-fit
       * */}
      <TableCell className="w-fit text-center whitespace-nowrap">
        <div onPointerDown={stopPropagation} onClick={stopPropagation}>
          <AssigneePicker
            value={task.assigneeIds || []}
            onChange={(assigneeIds) => handleAssigneeChange(task.id, assigneeIds)}
          />
        </div>
      </TableCell>

      <TableCell className="w-[100px] whitespace-nowrap">
        <div onPointerDown={stopPropagation} onClick={stopPropagation}>
          <DatePicker
            date={task.dueDate ? new Date(task.dueDate) : undefined}
            onDateSelect={(date) => handleDateChange(task.id, date)}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
