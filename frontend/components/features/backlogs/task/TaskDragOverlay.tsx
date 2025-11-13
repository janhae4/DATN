"use client"

import * as React from "react"
import { Task } from "@/types/task.type"
import { Status } from "@/types/status.interface"
import { PriorityPicker } from "@/components/shared/PriorityPicker"
import { DatePicker } from "@/components/shared/DatePicker"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserCircle2Icon, GripVertical } from "lucide-react"
import { getAssigneeInitial } from "@/lib/backlog-utils"
import { db } from "@/public/mock-data/mock-data"
import LabelTag from "@/components/shared/label/LabelTag"

interface TaskDragOverlayProps {
  task: Task
  statuses: Status[]
}

export function TaskDragOverlay({ task, statuses }: TaskDragOverlayProps) {
  const status = statuses.find(s => s.id === task.statusId)
  const assignee = task.assigneeIds?.[0] ? db.users.find(u => u.id === task.assigneeIds[0]) : null
  const labels = (task.labelIds || []).map(id => db.labels.find(l => l.id === id)).filter(Boolean) as any[]
  
  return (
    <div className="flex items-center w-full px-4 py-2 bg-background border rounded-md shadow-sm">
      {/* Drag Handle */}
      <div className="flex-shrink-0 mr-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Title and Labels */}
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{task.title}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {labels.map(label => (
            <LabelTag key={label.id} label={label} />
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="w-32 px-2">
        {status ? (
          <div className="flex items-center gap-2 text-sm">
            <span 
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: status.color }}
            />
            <span className="truncate">{status.name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No status</span>
        )}
      </div>

      {/* Priority */}
      <div className="w-24 px-2">
        <PriorityPicker 
          priority={task.priority} 
          onPriorityChange={() => {}}
          disabled={true}
        />
      </div>

      {/* Assignee */}
      <div className="w-16 flex justify-center">
        <Avatar className="h-6 w-6">
          {assignee ? (
            <AvatarFallback className="text-xs bg-primary/10">
              {getAssigneeInitial(assignee.id)}
            </AvatarFallback>
          ) : (
            <UserCircle2Icon className="h-5 w-5 text-muted-foreground" />
          )}
        </Avatar>
      </div>

      {/* Due Date */}
      <div className="w-32 px-2">
        <DatePicker 
          date={task.due_date ? new Date(task.due_date) : undefined}
          onDateSelect={() => {}}
          disabled={true}
        />
      </div>
    </div>
  )
}