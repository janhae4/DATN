"use client"

import * as React from "react"
import { Task } from "@/lib/dto/task.type"
import { Status } from "@/lib/dto/status.interaface"
import { PriorityPicker } from "@/components/shared/PriorityPicker"
import { DatePicker } from "@/components/shared/DatePicker"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserCircle2Icon, GripVertical } from "lucide-react"
import { getAssigneeInitial } from "@/lib/utils/backlog-utils"
import { db } from "@/public/mock-data/mock-data"
import LabelTag from "@/components/ui/LabelTag"

interface TaskDragOverlayProps {
  task: Task
  statuses: Status[]
}

export function TaskDragOverlay({ task, statuses }: TaskDragOverlayProps) {
  const status = statuses.find(s => s.id === task.statusId)
  const assignee = task.assigneeIds?.[0] ? db.users.find(u => u.id === task.assigneeIds[0]) : null
  const labels = (task.labelIds || []).map(id => db.labels.find(l => l.id === id)).filter(Boolean) as any[]
  
  return (
    <div 
      className="flex items-center gap-4 p-2 pr-4 rounded-lg shadow-xl bg-background border"
    >
      {/* Drag Handle Icon */}
      <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />

      {/* Title + Labels */}
      <div className="flex-1 flex flex-col min-w-0">
        <span className="text-sm font-medium truncate">{task.title}</span>
        <div className="flex items-center gap-1 mt-1 overflow-x-auto">
          {labels.map(label => (
            <LabelTag key={label.id} label={label} />
          ))}
        </div>
      </div>

      <div className="w-[120px] flex-shrink-0">
        {status ? (
          <div className="flex items-center gap-2 text-sm border rounded-md px-2 py-1 bg-muted/30">
             <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <span className="truncate">{status.name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No Status</span>
        )}
      </div>
      
      {/* Priority (Static) */}
      <div className="w-[110px] flex-shrink-0">
         <PriorityPicker 
            priority={task.priority} 
            onPriorityChange={() => {}} // No-op
            disabled={true} // Render as static
          />
      </div>

      {/* Assignee (Static) */}
      <div className="w-[50px] flex-shrink-0 flex justify-center">
         <Avatar className="h-6 w-6">
            {assignee ? (
              <AvatarFallback className="text-xs">{getAssigneeInitial(assignee.id)}</AvatarFallback>
            ) : (
              <UserCircle2Icon className="h-5 w-5 text-muted-foreground" />
            )}
          </Avatar>
      </div>
      
      {/* Date (Static) */}
       <div className="w-[100px] flex-shrink-0">
         <DatePicker 
            date={task.due_date ? new Date(task.due_date) : undefined} 
            onDateSelect={() => {}} // No-op
            disabled={true} // Render as static
          />
      </div>
    </div>
  )
}