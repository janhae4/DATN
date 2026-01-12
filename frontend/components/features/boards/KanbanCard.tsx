"use client"

import * as React from "react"
import { Task, User, List } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { PriorityPicker } from "@/components/shared/PriorityPicker"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

import { MoreHorizontal, ChevronRight, ChevronDown, GitCommit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EpicPicker } from "@/components/shared/color-picker/epic/EpicPicker"
import { AssigneePicker } from "@/components/shared/assignee/AssigneePicker"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import LabelTag from "@/components/shared/label/LabelTag"

import { useTaskLabels } from "@/hooks/useTaskLabel"
import { useProject } from "@/hooks/useProjects"
import { useTeamMembers } from "@/hooks/useTeam"
import SubtaskCard from "./KanbanSubCard"
import { ListCategoryEnum } from "@/types/common/enums"

interface KanbanCardProps {
  task: Task
  lists: List[]
}

export function KanbanCard({ task, lists }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      task: task,
      type: "KANBAN_CARD",
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition ?? "transform 200ms cubic-bezier(0.22, 0.61, 0.36, 1)",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "touch-none",
        isDragging ? "opacity-0" : "opacity-100"
      )}
    >
      <KanbanCardContent task={task} lists={lists} />
    </div>
  );
}

export function KanbanCardContent({ task, lists, className }: { task: Task; lists: List[]; className?: string }) {
  const {
    handleEpicChange,
    handlePriorityChange,
    setSelectedTask,
    handleAssigneeChange,
    allData
  } = useTaskManagementContext()

  const [isExpanded, setIsExpanded] = React.useState(false);
  const { taskLabels_data } = useTaskLabels(task.id);
  const { project } = useProject(task.projectId);
  const { data: members = [] } = useTeamMembers(project?.teamId || null);

  // Find subtasks
  const subtasks = React.useMemo(() => {
    return allData.filter(t => t.parentId === task.id);
  }, [allData, task.id]);

  const doneListId = React.useMemo(() => {
    return lists.find((l) => l.category === ListCategoryEnum.DONE)?.id ?? null;
  }, [lists]);
  const completedSubtasks = React.useMemo(() => {
    if (!doneListId) return 0;
    return subtasks.filter(t => t.listId === doneListId).length;
  }, [subtasks, doneListId]);

  const isCompleted = doneListId && task.listId === doneListId;

  return (
    <Card
      className={cn(
        "group/card relative cursor-grab border-border/40 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/50",
        className
      )}
    >
      <CardContent className="flex flex-col gap-2.5 ">
        {/* Header: Labels & Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {taskLabels_data && taskLabels_data.map((label) => (
              <LabelTag key={label.id} label={label} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">
              {task.id.slice(0, 8)}
            </span>
            <div onPointerDown={(e) => e.stopPropagation()} className="flex gap-2 items-center">
              <PriorityPicker
                priority={task.priority}
                onPriorityChange={(priority) => handlePriorityChange(task.id, priority)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-1 -mt-1 text-muted-foreground transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTask(task);
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p
            className={cn(
              "text-sm font-medium leading-snug line-clamp-3",
              isCompleted ? "line-through text-muted-foreground" : "text-foreground/90"
            )}
          >
            {task.title}
          </p>

          <div className="flex items-center justify-between mt-2">
            <div
              className={cn(
                "scale-90 origin-left transition-opacity duration-200 w-fit",
                !task.epicId && "opacity-0 group-hover/card:opacity-100 [&:has([data-state=open])]:opacity-100"
              )}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <EpicPicker
                value={task.epicId || null}
                onChange={(epicId) => handleEpicChange(task.id, epicId)}
              />
            </div>

            <div onPointerDown={(e) => e.stopPropagation()}>
              <AssigneePicker
                value={task.assigneeIds || []}
                users={members}
                onChange={(assigneeIds) => handleAssigneeChange(task.id, assigneeIds)}
              />
            </div>
          </div>
        </div>

        {/* --- Subtask Toggler Section --- */}
        {subtasks.length > 0 && (
          <div className="pt-2 border-t mt-1" onPointerDown={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1 text-xs text-muted-foreground hover:text-foreground w-full justify-between"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-1">
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <span>Subtasks</span>
              </div>
              <span className="text-[10px] bg-muted px-1.5 rounded-full">
                {completedSubtasks}/{subtasks.length}
              </span>
            </Button>

            {isExpanded && (
              <div className="flex flex-col gap-1.5 mt-2 ">
                {subtasks.map((subtask) => (
                  <SubtaskCard key={subtask.id} task={subtask} doneListId={doneListId} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}