"use client"

import * as React from "react"
import { useDroppable, useDndContext } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Archive } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BacklogTaskList } from "./task/backlogTaskList"
import { List, Task } from "@/types"

interface BacklogAccordionItemProps {
  lists: List[]
  taskCount: number
  tasks: Task[]
  isLoading?: boolean
  error?: any
  onRowClick: (task: Task) => void
  onUpdateTask: (taskId: string, updates: any) => void
  onDeleteTasks: (ids: string[]) => Promise<void> | void
}

export function BacklogAccordionItem({
  lists,
  taskCount,
  tasks,
  isLoading,
  error,
  onRowClick,
  onUpdateTask,
  onDeleteTasks,
}: BacklogAccordionItemProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'backlog-drop-area',
    data: {
      type: 'backlog-drop-area'
    }
  })

  const { over } = useDndContext()
  const isOverBacklog = isOver
  const isOverTaskInBacklog = over?.data?.current?.task && !over?.data?.current?.task?.sprintId
  const shouldHighlight = isOverBacklog || isOverTaskInBacklog
  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "w-full rounded-lg border bg-card transition-all duration-300 ease-in-out",
        shouldHighlight 
          ? "border-primary ring-4 ring-primary/10 shadow-xl  bg-primary/5 z-10" 
          : "hover:border-primary/50 hover:shadow-sm"
      )}
    >
      <AccordionItem 
        value="backlog" 
        className="border-0"
      >
        <AccordionTrigger
          className="flex w-full items-center justify-between gap-4 rounded-lg px-4 py-3 font-medium transition-all hover:bg-muted/50 hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-muted-foreground" />
              <span>Backlog</span>
            </div>
            <Badge variant="secondary">{taskCount} tasks</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-1 border-t bg-muted/20">
          <BacklogTaskList
            lists={lists}
            tasks={tasks}
            isLoading={isLoading}
            error={error}
            onRowClick={onRowClick}
            onUpdateTask={onUpdateTask}
            onDeleteTasks={onDeleteTasks}
          />
        </AccordionContent>
      </AccordionItem>
    </div>
  )
}
