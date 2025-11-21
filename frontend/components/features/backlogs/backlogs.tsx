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
  pointerWithin
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { Task } from "@/types"
import { Epic } from "@/types"
import { Sprint } from "@/types"
import { Badge } from "@/components/ui/badge"

import { BacklogAccordionItem } from "./BacklogAccordionItem"
import { TaskManagementProvider, useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { TaskDragOverlay } from "./task/TaskDragOverlay"
import { BacklogFilterBar } from "./BacklogFilterBar"
import { SprintList } from "./sprint/sprintLists"

export default function Backlogs() {
  const {
    data,
    selectedTask,
    setSelectedTask,
    handleListChange,
    handleDateChange,
    handlePriorityChange,
    handleUpdateCell,
    handleReorderTask,
    handleEpicChange,
    handleSprintChange,
    handleDescriptionChange,
    handleAssigneeChange,
    sprints,
  } = useTaskManagementContext()

  const backlogTaskCount = React.useMemo(() => {
    return data.filter(task => !task.epicId && !task.sprintId).length
  }, [data])

 

  const activeSprintsCount = React.useMemo(() =>
    sprints.filter(
      s => s.status !== "completed"
    ).length,
    [sprints]
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

    // Handle dropping onto another Task (Reorder or Move to Sprint/Backlog)
    const overTask = over.data.current?.task as Task | undefined
    if (overTask) {
      // If dropping onto a task in a different context (Sprint vs Backlog, or Sprint A vs Sprint B)
      if (task.sprintId !== overTask.sprintId) {
         handleSprintChange(task.id, overTask.sprintId || null)
         return
      }

      // If same context, reorder
      if (task.id !== overTask.id) {
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
      collisionDetection={pointerWithin}
    >
      {/* --- Drag Overlay (Không đổi) --- */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <TaskDragOverlay task={activeTask} lists={statusesForProject1} />
        ) : null}
      </DragOverlay>

      <div className="flex flex-col gap-8 py-4">
        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open: boolean) => {
            if (!open) setSelectedTask(null)
          }}
          onListChange={handleListChange}
          onDateChange={handleDateChange}
          onPriorityChange={handlePriorityChange}
          onAssigneeChange={handleAssigneeChange}
          onTitleChange={handleUpdateCell}
          onDescriptionChange={handleDescriptionChange}
        />


        <Accordion
          type="multiple"
          defaultValue={["backlog", "sprints", "epics"]}
          className="w-full flex flex-col gap-4 "
        >
          <BacklogFilterBar />

          {/* Phần Backlog */}
          <BacklogAccordionItem 
            lists={statusesForProject1} 
            taskCount={backlogTaskCount} 
          />

            {/* Phần Sprints */}
        
              <SprintList />


        </Accordion>
        {/* --- KẾT THÚC NÂNG CẤP --- */}
      </div>
    </DndContext>
  )
}