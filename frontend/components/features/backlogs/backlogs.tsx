// components/features/backlogs/backlogs.tsx
"use client"

import * as React from "react"
import { TaskDetailModal } from "./taskmodal"
import { statusesForProject1 } from "@/lib/backlog-utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { BookOpen, Rocket, Archive } from "lucide-react"
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
closestCenter
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { Task } from "@/types/task.type"
import { Epic } from "@/types/epic.type"
import { Sprint } from "@/types/sprint.type"
import { Badge } from "@/components/ui/badge"
import { db } from "@/public/mock-data/mock-data" 

import { BacklogTaskList } from "./task/backlogTaskList"
import { EpicList } from "./epic/epicList"
import { SprintList } from "./sprint/SprintLists"
import { TaskManagementProvider, useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { TaskDragOverlay } from "./task/TaskDragOverlay"
import { EpicPicker } from "@/components/shared/epic/EpicPicker"
import { BacklogFilterBar } from "./BacklogFilterBar"

export default function Backlogs() {
  return (
    <TaskManagementProvider>
      <BacklogsContent />
    </TaskManagementProvider>
  )
}

function BacklogsContent() {
  const {
    data,
    selectedTask,
    setSelectedTask,
    handleStatusChange,
    handleDateChange,
    handlePriorityChange,
    handleUpdateCell,
    handleReorderTask,
    handleEpicChange,
    handleSprintChange,
    handleDescriptionChange,
  } = useTaskManagementContext()

  const backlogTaskCount = React.useMemo(() => {
    return data.filter(task => !task.epicId && !task.sprintId).length
  }, [data])

  const epicsCount = React.useMemo(
    () => db.epics.filter((e: Epic) => e.projectId === "project-1").length,
    []
  )

  const activeSprintsCount = React.useMemo(() =>
    db.sprints.filter(
      s => s.projectId === "project-1" && s.status !== "completed"
    ).length,
    []
  )


  const [activeTask, setActiveTask] = React.useState<Task | null>(null)

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const task = active.data.current?.task as Task | undefined
    if (task) {
      setActiveTask(task)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)

    if (!over) {
      return
    }

    const task = active.data.current?.task as Task | undefined
    if (!task) {
      return
    }

    const dropType = over.data.current?.type

    // Handle dropping onto Epic
    if (dropType === "epic-drop-area") {
      const epic = over.data.current?.epic as Epic | undefined
      if (epic && task.epicId !== epic.id) {
        handleEpicChange(task.id, epic.id)
      }
      return
    }
    
    // Handle dropping onto Sprint
    if (dropType === "sprint-drop-area") {
      const sprint = over.data.current?.sprint as Sprint | undefined
      if (sprint && task.sprintId !== sprint.id) {
        handleSprintChange(task.id, sprint.id)
      }
      return
    }

    // Handle dropping onto Backlog (when dropping on the backlog area)
    if (over.id === 'backlog-drop-area' && task.sprintId) {
      handleSprintChange(task.id, null)
      return
    }

    // Handle reordering tasks
    const overTask = over.data.current?.task as Task | undefined
    if (task && overTask && task.id !== overTask.id) {
      // Allow reordering if:
      // 1. Both tasks are in the backlog (no sprintId)
      // 2. Both tasks are in the same sprint
      if ((!task.sprintId && !overTask.sprintId) || 
          (task.sprintId && task.sprintId === overTask.sprintId)) {
        handleReorderTask(task.id, overTask.id)
      }
    }
  }

  function handleDragCancel() {
    setActiveTask(null)
  }

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      collisionDetection={closestCenter}
    >
      {/* --- Drag Overlay (Không đổi) --- */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <TaskDragOverlay task={activeTask} statuses={statusesForProject1} />
        ) : null}
      </DragOverlay>

      <div className="flex flex-col gap-8 py-4">
        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open: boolean) => {
            if (!open) setSelectedTask(null)
          }}
          onStatusChange={handleStatusChange}
          onDateChange={handleDateChange}
          onPriorityChange={handlePriorityChange}
          onTitleChange={handleUpdateCell}
          onDescriptionChange={handleDescriptionChange}
        />


        <Accordion
          type="multiple"
          defaultValue={["backlog", "sprints", "epics"]}
          className="w-full flex flex-col gap-4 "
        >
          <BacklogFilterBar/>

          {/* Phần Backlog */}
          <AccordionItem value="backlog" className="rounded-lg border">
            <AccordionTrigger
              className="flex w-full items-center justify-between gap-4 rounded-lg  px-4 py-3 font-medium transition-all hover:bg-muted/50 hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-muted-foreground" />
                  <span>Backlog</span>
                </div>
                <Badge variant="secondary">{backlogTaskCount} tasks</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-1 border-t bg-muted/20">
              <BacklogTaskList
                statuses={statusesForProject1}
              />
            </AccordionContent>
          </AccordionItem>

            {/* Phần Sprints */}
        
              <SprintList />


        </Accordion>
        {/* --- KẾT THÚC NÂNG CẤP --- */}
      </div>
    </DndContext>
  )
}