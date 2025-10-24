// hooks/useTaskManagement.ts
import * as React from "react"
import { Task } from "@/lib/dto/task.type"
import { db } from "@/public/mock-data/mock-data" 
import { DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"

export const useTaskManagement = () => {
  const [data, setData] = React.useState<Task[]>(db.tasks)
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  
  // State for top-level "Create Task" button
  const [isAddingNewRow, setIsAddingNewRow] = React.useState(false)
  // State for adding an inline subtask
  const [addingSubtaskTo, setAddingSubtaskTo] = React.useState<string | null>(null)

  const [newRowTitle, setNewRowTitle] = React.useState("")
  const [newTaskPriority, setNewTaskPriority] = React.useState<Task["priority"]>(null)
  const [newTaskDueDate, setNewTaskDueDate] = React.useState<Date | null>(null)
  const [newTaskAssignees, setNewTaskAssignees] = React.useState<string[]>([])
  const [newTaskStatus, setNewTaskStatus] = React.useState<string>("todo")

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

  const handleStatusChange = React.useCallback((taskId: string, statusId: string) => {
    updateTask(taskId, { statusId })
  }, [updateTask])

  const handleRowClick = React.useCallback((task: Task) => {
    setSelectedTask(task)
  }, [])

  const handleEpicChange = React.useCallback((taskId: string, epicId: string | null) => {
    updateTask(taskId, { epicId })
  }, [updateTask])

  // --- THÊM HÀM MỚI ---
  const handleSprintChange = React.useCallback((taskId: string, sprintId: string | null) => {
    // Khi gán task vào sprint, chúng ta cũng nên xóa nó khỏi epic
    // (TUỲ CHỌN: Xóa dòng sau nếu bạn muốn task thuộc cả hai)
    updateTask(taskId, { sprintId: sprintId, epicId: null })
  }, [updateTask])
  // --- KẾT THÚC HÀM MỚI ---

  // Modified to accept an optional parentId
  const handleAddNewRow = React.useCallback((parentId: string | null = null) => {
    if (!newRowTitle.trim()) {
      setIsAddingNewRow(false)
      setAddingSubtaskTo(null) // Close subtask adder on blur
      setNewRowTitle("") // Clear title on blur if empty
      return
    }

    const newTask: Task = {
      id: `TASK-${Date.now()}`,
      title: newRowTitle.trim(),
      description: "",
      statusId: newTaskStatus,
      priority: newTaskPriority,
      assigneeIds: newTaskAssignees,
      subtaskIds: [],
      due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null,
      projectId: db.projects[0]?.id || "project-1", 
      sprintId: null,
      epicId: null,
    }

    if (parentId) {
        // This is a SUBTASK
        setData((prev) => {
            const parentTask = prev.find(t => t.id === parentId);
            if (parentTask) {
                // Inherit properties from parent
                newTask.sprintId = parentTask.sprintId;
                newTask.epicId = parentTask.epicId;
                newTask.projectId = parentTask.projectId;
            }

            // Add new task to data AND update parent's subtaskIds
            const updatedData = prev.map(task => 
                task.id === parentId 
                ? { ...task, subtaskIds: [...(task.subtaskIds || []), newTask.id] } 
                : task
            );
            return [...updatedData, newTask];
        });
    } else {
        // This is a TOP-LEVEL task
        setData((prev) => [...prev, newTask]);
    }

    // Reset fields
    setNewRowTitle("")
    setNewTaskPriority(null)
    setNewTaskDueDate(null)
    setNewTaskAssignees([])
    setNewTaskStatus("todo")
    setIsAddingNewRow(false)
    setAddingSubtaskTo(null)

  }, [newRowTitle, newTaskPriority, newTaskDueDate, newTaskAssignees, newTaskStatus])

  const handleInputKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>, parentId: string | null = null) => {
    if (e.key === "Enter") {
        e.preventDefault(); // Prevent form submission
        handleAddNewRow(parentId)
    }
    if (e.key === "Escape") {
        setIsAddingNewRow(false)
        setAddingSubtaskTo(null)
        setNewRowTitle("") // Clear title on escape
    }
  }, [handleAddNewRow])
  
  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event
    
    if (active.id !== over?.id) {
      // Check if we're dropping onto an epic
      if (over?.data?.current?.type === "epic-drop-area") {
        const epicId = over.data.current.epic.id
        updateTask(active.id as string, { epicId })
      } else if (over?.data?.current?.type === "sprint-drop-area") {
        // Check if we're dropping onto a sprint
        const sprintId = over.data.current.sprint.id
        handleSprintChange(active.id as string, sprintId)
      } else {
        // Default behavior: reorder within the same list
        setData((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id)
          const newIndex = items.findIndex((item) => item.id === over?.id)
          return arrayMove(items, oldIndex, newIndex)
        })
      }
    }
  }, [updateTask, handleSprintChange])

  return {
    data,
    selectedTask,
    isAddingNewRow, // For top-level
    addingSubtaskTo, // For inline subtask
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
    handleRowClick,
    handleAddNewRow,
    handleInputKeyDown,
    handleDragEnd,
    handleEpicChange,
    handleSprintChange,
    
    // Hàm set state 
    setNewRowTitle,
    setIsAddingNewRow,
    setAddingSubtaskTo, // Export this
    setSelectedTask,
    setNewTaskPriority,
    setNewTaskDueDate,
    setNewTaskAssignees,
    setNewTaskStatus,
  }
}