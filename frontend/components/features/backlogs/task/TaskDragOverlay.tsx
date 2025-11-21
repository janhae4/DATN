"use client"

import * as React from "react"
import { Task, List } from "@/types"
import { GripVertical } from "lucide-react"

interface TaskDragOverlayProps {
  task: Task
  lists: List[]
}

export function TaskDragOverlay({ task }: TaskDragOverlayProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-background border rounded-lg shadow-xl cursor-grabbing scale-105 ring-1 ring-primary/20 w-[300px]">
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm font-medium truncate">{task.title}</span>
    </div>
  )
}