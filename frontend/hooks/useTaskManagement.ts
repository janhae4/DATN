// hooks/useTaskManagement.ts
import * as React from "react"
import { Task } from "@/lib/types/task.type"
import { initialData } from "@/public/mock-data/task-data" 
import { DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"

export const useTaskManagement = () => {
  const [data, setData] = React.useState<Task[]>(initialData)
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [isAddingNewRow, setIsAddingNewRow] = React.useState(false)
  const [newRowTitle, setNewRowTitle] = React.useState("")
  const [newTaskPriority, setNewTaskPriority] = React.useState<Task["priority"]>(null)
  const [newTaskDueDate, setNewTaskDueDate] = React.useState<Date | null>(null)
  const [newTaskAssignees, setNewTaskAssignees] = React.useState<Task["assignees"]>([])
  const [newTaskStatus, setNewTaskStatus] = React.useState<Task["status"]>("todo")

  const updateTask = React.useCallback((taskId: string, updates: Partial<Task>) => {
    setData((currentData) =>
      currentData.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    )
    setSelectedTask(prevTask => 
      prevTask && prevTask.id === taskId ? { ...prevTask, ...updates } : prevTask
    )
  }, []) 

  const handleUpdateCell = React.useCallback((taskId: string, columnId: "title", value: string) => {
    updateTask(taskId, { [columnId]: value })
  }, [updateTask])

  const handleDescriptionChange = React.useCallback((taskId: string, description: string) => {
    updateTask(taskId, { description })
  }, [updateTask])

  const handleDateChange = React.useCallback((taskId: string, newDate: Date | undefined) => {
    updateTask(taskId, { due_date: newDate ? newDate.toISOString() : null })
  }, [updateTask])

  const handlePriorityChange = React.useCallback((taskId: string, priority: Task["priority"]) => {
    updateTask(taskId, { priority })
  }, [updateTask])

  const handleStatusChange = React.useCallback((taskId: string, status: Task["status"]) => {
    updateTask(taskId, { status })
  }, [updateTask])

  const handleToggleComplete = React.useCallback((taskId: string, isCompleted: boolean) => {
    updateTask(taskId, { isCompleted })
  }, [updateTask])

  const handleRowClick = React.useCallback((task: Task) => {
    setSelectedTask(task)
  }, [])
  
  const handleAddNewRow = React.useCallback(() => {
    if (!newRowTitle.trim()) {
      setIsAddingNewRow(false)
      return
    }
    const newTask: Task = {
      id: `TASK-${Date.now()}`,
      title: newRowTitle.trim(),
      description: "",
      isCompleted: false, 
      status: newTaskStatus, 
      priority: newTaskPriority,
      assignees: newTaskAssignees, 
      subtasks: [], 
      due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null,
      epic: null,
    }
    setData((prev) => [...prev, newTask])
    setNewRowTitle("")
    setNewTaskPriority(null)
    setNewTaskDueDate(null)
    setNewTaskAssignees([])
    setNewTaskStatus("todo")
    setIsAddingNewRow(false)
  }, [newRowTitle, newTaskPriority, newTaskDueDate, newTaskAssignees, newTaskStatus])

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddNewRow()
    if (e.key === "Escape") setIsAddingNewRow(false)
  }
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setData((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  return {
    data,
    selectedTask,
    isAddingNewRow,
    newRowTitle,
    newTaskPriority,
    newTaskDueDate,
    newTaskAssignees,
    newTaskStatus,
    dataIds: React.useMemo(() => data.map(({ id }) => id), [data]),
    
    // Hàm xử lý
    handleUpdateCell,
    handleDescriptionChange,
    handleDateChange,
    handlePriorityChange,
    handleStatusChange,
    handleToggleComplete,
    handleRowClick,
    handleAddNewRow,
    handleInputKeyDown,
    handleDragEnd,
    
    // Hàm set state 
    setNewRowTitle,
    setIsAddingNewRow,
    setSelectedTask,
    setNewTaskPriority,
    setNewTaskDueDate,
    setNewTaskAssignees,
    setNewTaskStatus,
  }
}