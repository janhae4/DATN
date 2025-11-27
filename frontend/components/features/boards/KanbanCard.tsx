"use client"

import * as React from "react"
import { Task } from "@/types"
import { List } from "@/types"
import { Label } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PriorityPicker } from "@/components/shared/PriorityPicker"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { db } from "@/public/mock-data/mock-data"

import { getAssigneeInitial } from "@/lib/backlog-utils"

import { Calendar, Paperclip, MoreHorizontal } from "lucide-react"
import { formatDate } from "@/lib/backlog-utils"
import { Button } from "@/components/ui/button"
import { AvatarImage } from "@/components/ui/avatar"
import { EpicPicker } from "@/components/shared/epic/EpicPicker"
import { AssigneePicker } from "@/components/shared/assignee/AssigneePicker"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { LabelTag } from "@/components/shared/label/LabelTag"

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

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "touch-none",
        isDragging ? "opacity-0" : "opacity-100" // Hide original card when dragging
      )}
    >
      <KanbanCardContent task={task} />
    </div>
  );
}

export function KanbanCardContent({ task, className }: { task: Task, className?: string }) {
  const { handleEpicChange, handlePriorityChange, setSelectedTask, handleAssigneeChange } = useTaskManagementContext()
  const firstAssigneeId = task.assigneeIds?.[0];
  const assignee = firstAssigneeId ? db.users.find(u => u.id === firstAssigneeId) : null;
  const labels = (task.labelIds || []).map(id => db.labels.find(l => l.id === id)).filter(Boolean) as Label[]

  return (
    <Card
      className={cn(
        "group/card relative cursor-grab border-border/40 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/50",
        className
      )}
    >
      <CardContent className="flex flex-col gap-2.5">
        {/* Header: Labels & Actions */}
        {labels.length > 0 ? (
          <div className="flex items-start justify-between gap-2 min-h-[20px]">
            <div className="flex flex-wrap gap-1.5">
              {labels.map((label) => (
                <LabelTag key={label.id} label={label} />
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-1 -mt-1 text-muted-foreground opacity-0 group-hover/card:opacity-100 transition-opacity"
              onClick={() => setSelectedTask(task)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground opacity-0 group-hover/card:opacity-100 transition-opacity"
            onClick={() => setSelectedTask(task)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}

        {/* Content */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">
              {task.id.slice(0, 8)}
            </span>
            <div onPointerDown={(e) => e.stopPropagation()}>
              <PriorityPicker
                priority={task.priority}
                onPriorityChange={(priority) => handlePriorityChange(task.id, priority)}
              />
            </div>
          </div>
          <p className="text-sm font-medium leading-snug text-foreground/90 line-clamp-3">
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
                onChange={(assigneeIds) => handleAssigneeChange(task.id, assigneeIds)}
              />
            </div>
          </div>
        </div>

   
      </CardContent>
    </Card>
  );
}
