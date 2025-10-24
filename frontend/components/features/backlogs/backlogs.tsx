// components/features/backlogs/backlogs.tsx
"use client"

import * as React from "react"
import { TaskDetailModal } from "./taskmodal"
import { statusesForProject1 } from "@/lib/utils/backlog-utils"
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
import { Task } from "@/lib/dto/task.type"
import { Epic } from "@/lib/dto/epic.type"
import { Sprint } from "@/lib/dto/sprint.type"
import { Badge } from "@/components/ui/badge" // <-- 1. IMPORT BADGE
import { db } from "@/public/mock-data/mock-data" // <-- 2. IMPORT DB

import { BacklogTaskList } from "./task/backlogTaskList"
import { EpicList } from "./epic/epicList"
import { SprintList } from "./sprint/sprintList"
import { TaskManagementProvider, useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { TaskDragOverlay } from "./task/TaskDragOverlay"
import { cn } from "@/lib/utils"

export default function Backlogs() {
  return (
    <TaskManagementProvider>
      <BacklogsContent />
    </TaskManagementProvider>
  )
}

function BacklogsContent() {
  const {
    data, // <-- 3. LẤY DATA TỪ CONTEXT
    selectedTask,
    setSelectedTask,
    handleStatusChange,
    handleDateChange,
    handlePriorityChange,
    handleUpdateCell,
    handleDescriptionChange,
    handleEpicChange,
    handleSprintChange,
  } = useTaskManagementContext()

  // --- 4. TÍNH TOÁN SỐ LƯỢNG CHO MỖI MỤC ---
  const backlogTaskCount = React.useMemo(() => {
    // Logic: Task "Backlog" là task chưa được gán cho Sprint hoặc Epic
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
  // --- KẾT THÚC TÍNH TOÁN ---


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
    if (!over) {
      setActiveTask(null)
      return
    }
    const task = active.data.current?.task as Task | undefined
    if (!task) {
      setActiveTask(null)
      return
    }
    const dropType = over.data.current?.type
    if (dropType === "epic-drop-area") {
      const epic = over.data.current?.epic as Epic | undefined
      if (epic && task.epicId !== epic.id) {
        handleEpicChange(task.id, epic.id)
      }
    }
    else if (dropType === "sprint-drop-area") {
      const sprint = over.data.current?.sprint as Sprint | undefined
      if (sprint && task.sprintId !== sprint.id) {
        handleSprintChange(task.id, sprint.id)
      }
    }
    setActiveTask(null)
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
        {/* --- Task detail modal (Không đổi) --- */}
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

        {/* --- BẮT ĐẦU NÂNG CẤP UI ACCORDION --- */}
        <Accordion
          type="multiple"
          defaultValue={["backlog", "sprints", "epics"]}
          className="w-full flex flex-col gap-4 "
        >
          {/* Phần Backlog */}
          <AccordionItem value="backlog" className="rounded-lg border">
            <AccordionTrigger
              className="flex w-full items-center justify-between gap-4 rounded-lg px-4 py-3 font-medium transition-all hover:bg-muted/50 hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-muted/50"
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

          {/* Phần Epics */}
          <AccordionItem value="epics" className="rounded-lg ">
            <AccordionTrigger
              className="flex w-full border items-center justify-between gap-4 rounded-lg px-4 py-3 font-medium transition-all hover:bg-muted/50 hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <span>Epics</span>
                </div>
                <Badge variant="secondary">{epicsCount} epics</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="py-2">
              <EpicList
                statuses={statusesForProject1}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Phần Sprints */}
          <AccordionItem value="sprints" className="rounded-lg  ">
            <AccordionTrigger
              className="border flex w-full items-center justify-between gap-4 rounded-lg px-4 py-3 font-medium transition-all hover:bg-muted/50 hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-muted-foreground" />
                  <span>Sprints</span>
                </div>
                <Badge variant="secondary">{activeSprintsCount} sprints</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="py-2">
              <SprintList />
            </AccordionContent>
          </AccordionItem>


        </Accordion>
        {/* --- KẾT THÚC NÂNG CẤP --- */}
      </div>
    </DndContext>
  )
}