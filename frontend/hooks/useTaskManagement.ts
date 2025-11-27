// hooks/useTaskManagement.ts
import * as React from "react"
import { Task, Sprint, Epic, Label } from "@/types"
import { useTasks } from "@/hooks/useTasks"
import { useSprints } from "@/hooks/useSprints"
import { useEpics } from "@/hooks/useEpics"
import { useLabels } from "@/hooks/useLabels"
import { DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"

export interface TaskFilters {
  searchText: string
  assigneeIds: string[]
  priorities: (Task["priority"])[]
  listIds: string[]
  epicIds: string[]
  labelIds: string[]
  sprintIds: string[]
}

const INITIAL_FILTERS: TaskFilters = {
  searchText: "",
  assigneeIds: [],
  priorities: [],
  listIds: [],
  epicIds: [],
  labelIds: [],
  sprintIds: [],
}

import { SprintStatus } from "@/types/common/enums"

export const useTaskManagement = (projectId: string = "project-phoenix-1") => {
  const { tasks: serverTasks, createTask: serverCreateTask, updateTask: serverUpdateTask } = useTasks(projectId)
  const { sprints: serverSprints, updateSprint: serverUpdateSprint } = useSprints(projectId)
  const { epics: serverEpics } = useEpics(projectId)
  const { labels: serverLabels } = useLabels()

  const [data, setData] = React.useState<Task[]>([])
  const [sprints, setSprints] = React.useState<Sprint[]>([])
  const [epics, setEpics] = React.useState<Epic[]>([])
  const [labels, setLabels] = React.useState<Label[]>([])
  
  // Sync data from server
  React.useEffect(() => {
    setData(serverTasks)
  }, [serverTasks])

  React.useEffect(() => {
    setSprints(serverSprints)
  }, [serverSprints])

  React.useEffect(() => {
    setEpics(serverEpics)
  }, [serverEpics])

  React.useEffect(() => {
    setLabels(serverLabels)
  }, [serverLabels])

  const activeSprint = React.useMemo(() => {
    return sprints.find(s => s.status === SprintStatus.ACTIVE) || null
  }, [sprints])

  const startSprint = React.useCallback(async (sprintId: string) => {
    // Deactivate other sprints if any (though logic says only one active)
    // For now just activate the target sprint
    const sprint = sprints.find(s => s.id === sprintId)
    if (sprint) {
      // Optimistic update
      setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, status: SprintStatus.ACTIVE } : s))
      await serverUpdateSprint(sprintId, { status: SprintStatus.ACTIVE })
    }
  }, [sprints, serverUpdateSprint])

  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [filters, setFilters] = React.useState<TaskFilters>(INITIAL_FILTERS)
  const [isAddingNewRow, setIsAddingNewRow] = React.useState(false)
  const [newRowTitle, setNewRowTitle] = React.useState("")
  const [newTaskPriority, setNewTaskPriority] = React.useState<Task["priority"]>(null)
  const [newTaskDueDate, setNewTaskDueDate] = React.useState<Date | null>(null)
  const [newTaskAssignees, setNewTaskAssignees] = React.useState<string[]>([])
  const [newTaskListId, setNewTaskListId] = React.useState<string>("todo")

  const updateTask = React.useCallback((taskId: string, updates: Partial<Task>) => {
    // Optimistic update
    setData((currentData) =>
      currentData.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    )
    setSelectedTask(prevTask => 
      prevTask && prevTask.id === taskId ? { ...prevTask, ...updates } : prevTask
    )
    // Server update
    serverUpdateTask(taskId, updates)
  }, [serverUpdateTask]) 

  const handleUpdateCell = React.useCallback((taskId: string, columnId: "title", value: string) => {
    updateTask(taskId, { [columnId]: value })
  }, [updateTask])

  const handleDescriptionChange = React.useCallback((taskId: string, description: string) => {
    updateTask(taskId, { description })
  }, [updateTask])

  const handleDateChange = React.useCallback((taskId: string, newDate: Date | undefined) => {
    updateTask(taskId, { dueDate: newDate ? newDate.toISOString() : null })
  }, [updateTask])

  const handlePriorityChange = React.useCallback((taskId: string, priority: Task["priority"]) => {
    updateTask(taskId, { priority })
  }, [updateTask])

  const handleLabelChange = React.useCallback((taskId: string, labelIds: string[]) => {
    updateTask(taskId, { labelIds });
  }, [updateTask])

  const handleAssigneeChange = React.useCallback((taskId: string, assigneeIds: string[]) => {
    updateTask(taskId, { assigneeIds });
  }, [updateTask])

  const handleListChange = React.useCallback((taskId: string, listId: string) => {
    updateTask(taskId, { listId })
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
      listId: newTaskListId, 
      priority: newTaskPriority,
      assigneeIds: newTaskAssignees,
      dueDate: newTaskDueDate ? newTaskDueDate.toISOString() : null,
      projectId: projectId,
      sprintId: sprintId || null,
      epicId: parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Optimistic update
    setData((prev) => [...prev, newTask])
    
    // Server update
    serverCreateTask(newTask)

    // Reset fields
    setNewRowTitle("")
    setNewTaskPriority(null)
    setNewTaskDueDate(null)
    setNewTaskAssignees([])
    setNewTaskListId("todo")
    setIsAddingNewRow(false)
  }, [newRowTitle, newTaskPriority, newTaskDueDate, newTaskAssignees, newTaskListId, projectId, serverCreateTask])

  const handleInputKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>, parentId: string | null, options?: { sprintId?: string, onCancel?: () => void }) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      handleAddNewRow(parentId, options?.sprintId)
      if (options?.onCancel) options.onCancel()
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

  // --- DELETE TASK ---
  const handleDeleteTask = React.useCallback((taskId: string) => {
    setData((prev) => prev.filter((task) => task.id !== taskId));
    // Optionally, call server delete if available
    // serverDeleteTask(taskId);
  }, []);
  // --- END DELETE TASK ---

  // Filter tasks based on current filters
  const filteredData = React.useMemo(() => {
    const { searchText, assigneeIds, priorities, listIds } = filters
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
      if (listIds.length > 0 && task.listId) {
        if (!listIds.includes(task.listId)) return false
      }

      // Filter by Epic
      if (filters.epicIds.length > 0) {
        if (!task.epicId || !filters.epicIds.includes(task.epicId)) return false
      }

      // Filter by Label
      if (filters.labelIds.length > 0) {
        if (!task.labelIds || !task.labelIds.some(id => filters.labelIds.includes(id))) return false
      }

      // Filter by Sprint
      if (filters.sprintIds.length > 0) {
        if (!task.sprintId || !filters.sprintIds.includes(task.sprintId)) return false
      }

      return true // Passed all filters
    })
  }, [data, filters])

  return {
    data: filteredData,
    allData: data,
    sprints,
    epics,
    labels,
    filters,
    setFilters,
    selectedTask,
    isAddingNewRow, 
    newRowTitle,
    newTaskPriority,
    newTaskDueDate,
    newTaskAssignees,
    newTaskListId,
    dataIds: React.useMemo(() => data.map(({ id }) => id), [data]),
    
    activeSprint,
    startSprint,
    
    // Hàm xử lý
    handleUpdateCell,
    handleDescriptionChange,
    handleDateChange,
    handlePriorityChange,
    handleLabelChange,
    handleAssigneeChange,
    handleListChange,
    handleRowClick,
    handleAddNewRow,
    handleInputKeyDown,
    handleDragEnd,
    handleEpicChange,
    handleSprintChange,
    handleReorderTask,
    handleDeleteTask,
    
    // Hàm set state 
    setNewRowTitle,
    setIsAddingNewRow,
    setSelectedTask,
    setNewTaskPriority,
    setNewTaskDueDate,
    setNewTaskAssignees,
    setNewTaskListId,
    projectId,
  }
}