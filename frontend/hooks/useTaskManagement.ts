// hooks/useTaskManagement.ts
import * as React from "react"
import { Task } from "@/types/task.type"
import { db } from "@/public/mock-data/mock-data" 
import { DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"

export interface TaskFilters {
  searchText: string
  assigneeIds: string[]
  priorities: (Task["priority"])[]
  statusIds: string[]
}

const INITIAL_FILTERS: TaskFilters = {
  searchText: "",
  assigneeIds: [],
  priorities: [],
  statusIds: [],
}

export const useTaskManagement = () => {
  const [data, setData] = React.useState<Task[]>(db.tasks)
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [filters, setFilters] = React.useState<TaskFilters>(INITIAL_FILTERS)
  const [isAddingNewRow, setIsAddingNewRow] = React.useState(false)
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

  const handleLabelChange = React.useCallback((taskId: string, labelIds: string[]) => {
    updateTask(taskId, { labelIds });
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
  
  const handleReorderTask = React.useCallback((activeId: string, overId: string) => {
    setData((items) => {
      const oldIndex = items.findIndex(item => item.id === activeId);
      const newIndex = items.findIndex(item => item.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) {
        return items;
      }
      
      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);
  // --- KẾT THÚC HÀM MỚI ---

  const handleAddNewRow = React.useCallback((parentId: string | null, sprintId?: string) => {
    if (!newRowTitle.trim()) {
      setIsAddingNewRow(false)
      setNewRowTitle("")
      return
    }

    const newTask: Task = {
      id: `TASK-${Date.now()}`,
      title: newRowTitle.trim(),
      description: "",
      statusId: newTaskStatus,
      priority: newTaskPriority,
      assigneeIds: newTaskAssignees,
      due_date: newTaskDueDate ? newTaskDueDate.toISOString() : null,
      projectId: db.projects[0]?.id || "project-1",
      sprintId: sprintId || null,
      epicId: parentId,
    }

    setData((prev) => [...prev, newTask])

    // Reset fields
    setNewRowTitle("")
    setNewTaskPriority(null)
    setNewTaskDueDate(null)
    setNewTaskAssignees([])
    setNewTaskStatus("todo")
    setIsAddingNewRow(false)
  }, [newRowTitle, newTaskPriority, newTaskDueDate, newTaskAssignees, newTaskStatus])

  const handleInputKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>, parentId: string | null, options?: { sprintId?: string, onCancel?: () => void }) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      handleAddNewRow(parentId, options?.sprintId)
    }
    if (e.key === "Escape") {
      setIsAddingNewRow(false)
      setNewRowTitle("") // Clear title on escape
      if (options?.onCancel) options.onCancel()
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

  // Filter tasks based on current filters
  const filteredData = React.useMemo(() => {
    const { searchText, assigneeIds, priorities, statusIds } = filters
    const lowerSearchText = searchText.toLowerCase()

    return data.filter((task) => {
      // Filter by search text (title, id)
      if (lowerSearchText) {
        const titleMatch = task.title.toLowerCase().includes(lowerSearchText)
        const idMatch = task.id.toLowerCase().includes(lowerSearchText)
        if (!titleMatch && !idMatch) return false
      }

      // Filter by Assignee
      if (assigneeIds.length > 0) {
        // Task must have at least one assignee in the filter list
        const hasAssignee = task.assigneeIds?.some((id) =>
          assigneeIds.includes(id)
        ) ?? false
        // If task has no assignee AND filter includes "Unassigned"
        const isUnassigned = (!task.assigneeIds || task.assigneeIds.length === 0) && assigneeIds.includes("unassigned")
        
        if (!hasAssignee && !isUnassigned) return false
      }

      // Filter by Priority
      if (priorities.length > 0 && task.priority) {
        if (!priorities.includes(task.priority)) return false
      }

      // Filter by Status
      if (statusIds.length > 0 && task.statusId) {
        if (!statusIds.includes(task.statusId)) return false
      }

      return true // Passed all filters
    })
  }, [data, filters])

  return {
    data: filteredData,
    allData: data,
    filters,
    setFilters,
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
    handleLabelChange,
    handleStatusChange,
    handleRowClick,
    handleAddNewRow,
    handleInputKeyDown,
    handleDragEnd,
    handleEpicChange,
    handleSprintChange,
    handleReorderTask,
    
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