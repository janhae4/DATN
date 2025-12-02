"use client";

import * as React from "react";
import { Task, List, Label, TaskLabel, User } from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GripVertical, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

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
// DTO
import { UpdateTaskDto } from "@/services/taskService";
import LabelTag from "@/components/shared/label/LabelTag";
import { useTaskLabels } from "@/hooks/useTaskLabel";
import { useParams } from "next/navigation";
import { useTeamMembers } from "@/hooks/useTeam";

interface BacklogTaskRowProps {
  task: Task;
  lists: List[];
  isDraggable?: boolean;
  selected?: boolean;
  onRowClick?: (task: Task) => void;
  onSelect?: (taskId: string, checked: boolean) => void;
  onUpdateTask: (taskId: string, updates: UpdateTaskDto) => void;
}

export function BacklogTaskRow({
  task,
  lists,
  isDraggable = false,
  selected = false,
  onRowClick,
  onSelect,
  onUpdateTask,
}: BacklogTaskRowProps) {
  const { taskLabels_data } = useTaskLabels(task.id)

  // --- DND-KIT HOOK ---
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
    transform: CSS.Transform.toString(transform),
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

  // 1. Logic xử lý mảng
  const MAX_VISIBLE = 2;
  const labels = taskLabels_data || []; // Fallback array rỗng
  const visibleLabels = labels.slice(0, MAX_VISIBLE);
  const remainingCount = labels.length - MAX_VISIBLE;
  const hiddenLabels = labels.slice(MAX_VISIBLE);

  const teamId = useParams().teamId as string;
  // 2. Get Members of that Team
  const { data: members } = useTeamMembers(teamId);
  // 3. Map members to users for the picker (filter out any without user data)
// 3. Map members to users for the picker
  const teamUsers = React.useMemo(() => {
    // Ép kiểu (members as any[]) vì Interface TeamMember hiện tại chưa khai báo 'cachedUser'
    return ((members ?? []) as any[])
      .filter((m) => !!m.cachedUser) // Kiểm tra xem có cachedUser không
      .map((m) => ({
         ...m.cachedUser, // Lấy toàn bộ info (name, avatar,...) từ cachedUser
         id: m.userId     // Đảm bảo lấy đúng UserId (dù trong cachedUser thường cũng có id khớp)
      })) as User[];
  }, [members]);
  console.log("teamUsers", teamUsers);

  return (
    <TableRow
      ref={setNodeRef}
      {...attributes}
      style={style}
      className={cn(
        "group cursor-pointer hover:bg-muted/50 transition-colors",
        isDragging && "opacity-40 bg-muted/50 border-dashed border-2 border-primary/20 grayscale"
      )}
      onClick={() => onRowClick?.(task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* --- Title Column --- */}
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
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <span className="px-2 text-sm truncate block max-w-[400px]">
                {task.title}
              </span>
            </div>
          )}
          {!isEditingTitle && (
            <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pl-1">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-md cursor-pointer text-muted-foreground flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
              >
                <Edit className="h-3 w-3" />
              </Button>


            </div>
          )}

        </div>
      </TableCell>

      <TableCell>

        {/* Dùng flex để xếp các tag nằm ngang và có khoảng cách */}
        <div className="flex  items-center gap-2">

          {/* 1. Render các label được phép hiển thị */}
          {visibleLabels.map((label) => (
            <LabelTag key={label.id} label={label} onRemove={() => {
              const newLabelIds = labels
                .filter(l => l.id !== label.id)
                .map(l => l.id);
              onUpdateTask(task.id, { labelIds: newLabelIds });
            }} />
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
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-accent-foreground font-semibold mb-1">
                      Remaining labels:
                    </p>
                    {hiddenLabels.map((hiddenLabel) => (
                      <LabelTag key={hiddenLabel.id} label={hiddenLabel} />
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

        </div>
      </TableCell>

      {/* --- Label --- */}
      <TableCell className="w-fit whitespace-nowrap" onClick={stopPropagation}>
        <LabelPopover
          taskId={task.id}
          initialSelectedLabels={taskLabels_data}
          onSelectionChange={(labels) => onUpdateTask(task.id, { labelIds: labels.map(l => l.id) })}
        />
      </TableCell>

      {/* --- Epic --- */}
      <TableCell className="w-fit whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <EpicPicker
          value={task.epicId || null}
          onChange={(epicId) => onUpdateTask(task.id, { epicId: epicId === null ? null : epicId })}
        />
      </TableCell>

      {/* --- List --- */}
      <TableCell className="w-fit whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <ListPicker
          lists={lists}
          value={task.listId || null}
          onChange={(listId) => onUpdateTask(task.id, { listId })}
        />
      </TableCell>

      {/* --- Priority --- */}
      <TableCell className="w-fit whitespace-nowrap">
        <div onPointerDown={stopPropagation} onClick={stopPropagation}>
          <PriorityPicker
            priority={task.priority ?? undefined}
            onPriorityChange={(newPriority) => {
              onUpdateTask(task.id, { priority: newPriority ?? undefined })
            }}
          />
        </div>
      </TableCell>

      {/* --- Assignee --- */}
      <TableCell className="w-fit text-center whitespace-nowrap">
        <div onPointerDown={stopPropagation} onClick={stopPropagation}>
          <AssigneePicker
            // 1. Pass current assignees from Task
            value={task.assigneeIds || []}
            // 2. Pass Real Users fetched from hook
            users={teamUsers} 
            // 3. Call updateTask directly on change
            onChange={(newAssigneeIds) => {
              onUpdateTask(task.id, { assigneeIds: newAssigneeIds });
            }}
          />
        </div>
      </TableCell>

      {/* --- Date --- */}
      <TableCell className="w-[100px] whitespace-nowrap">
        <div onPointerDown={stopPropagation} onClick={stopPropagation}>
          <DatePicker
            date={task.dueDate ? new Date(task.dueDate) : undefined}
            onDateSelect={(date) =>
              onUpdateTask(task.id, { dueDate: date ? date.toISOString() : undefined })
            }
          />
        </div>
      </TableCell>
    </TableRow>
  );
}