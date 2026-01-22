// hooks/useTaskManagement.ts
import * as React from "react"
import { Task, Sprint, Epic, Label } from "@/types"
import { useTasks } from "@/hooks/useTasks"
import { useSprints } from "@/hooks/useSprints"
import { useEpics } from "@/hooks/useEpics"
import { useLabels } from "@/hooks/useLabels"
import { DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { SprintStatus } from "@/types/common/enums"
import { BaseTaskFilterDto } from "@/services/taskService"

export interface TaskFilters {
  searchText: string
  assigneeIds: string[]
  priorities: (Task["priority"])[]
  listIds: string[]
  epicIds: string[]
  labelIds: string[]
  sprintIds: string[]
}

const INITIAL_FILTERS: BaseTaskFilterDto = {
  search: "",
  assigneeIds: [],
  priority: [],
  statusId: [],
  epicId: [],
  labelIds: [],
  sprintId: [],
  isCompleted: false,
  sortBy: [],
  sortOrder: "ASC",
  page: 1,
  limit: 10,
}

export const useTaskManagement = (projectId: string = "project-phoenix-1", teamId: string = "team-1") => {
  const { tasks: serverTasks, createTask: serverCreateTask, updateTask: serverUpdateTask, isLoading: isTaskLoading } = useTasks({
    ...INITIAL_FILTERS,
    projectId,
    teamId
  })
  const { sprints: serverSprints, updateSprint: serverUpdateSprint } = useSprints(projectId, teamId);
  const { epics: serverEpics, updateEpic } = useEpics(projectId)
  const { labels: serverLabels } = useLabels(projectId)

  const [data, setData] = React.useState<Task[]>([])
  const [sprints, setSprints] = React.useState<Sprint[]>([])
  const [epics, setEpics] = React.useState<Epic[]>([])
  const [labels, setLabels] = React.useState<Label[]>([])

  const stableServerTasks = React.useMemo(() => serverTasks, [JSON.stringify(serverTasks)])
  const stableServerSprints = React.useMemo(() => serverSprints, [JSON.stringify(serverSprints)])
  const stableServerEpics = React.useMemo(() => serverEpics, [JSON.stringify(serverEpics)])
  const stableServerLabels = React.useMemo(() => serverLabels, [JSON.stringify(serverLabels)])

  React.useEffect(() => {
    setData(stableServerTasks || [])
  }, [stableServerTasks])

  React.useEffect(() => {
    setSprints(stableServerSprints || [])
  }, [stableServerSprints])

  React.useEffect(() => {
    setEpics(stableServerEpics || [])
  }, [stableServerEpics])

  React.useEffect(() => {
    setLabels(stableServerLabels || [])
  }, [stableServerLabels])

  const activeSprint = React.useMemo(() => {
    return sprints.find(s => s.status === SprintStatus.ACTIVE) || null
  }, [sprints])

  const startSprint = React.useCallback(async (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId)
    if (sprint) {
      // Optimistic update
      setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, status: SprintStatus.ACTIVE } : s))
      await serverUpdateSprint(sprintId, { status: SprintStatus.ACTIVE })
    }
  }, [sprints, serverUpdateSprint])

  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [filters, setFilters] = React.useState<BaseTaskFilterDto>(INITIAL_FILTERS)
  const [isAddingNewRow, setIsAddingNewRow] = React.useState(false)
  const [newRowTitle, setNewRowTitle] = React.useState("")
  const [newTaskPriority, setNewTaskPriority] = React.useState<Task["priority"]>(null)
  const [newTaskDueDate, setNewTaskDueDate] = React.useState<Date | null>(null)
  const [newTaskAssignees, setNewTaskAssignees] = React.useState<string[]>([])
  const [newTaskListId, setNewTaskListId] = React.useState<string>("todo")

  const updateTask = React.useCallback((taskId: string, updates: Partial<Task>) => {
    setData((currentData) =>
      currentData.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    )
    setSelectedTask(prevTask =>
      prevTask && prevTask.id === taskId ? { ...prevTask, ...updates } : prevTask
    )
    // Server update
    return serverUpdateTask(taskId, updates)
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
    return updateTask(taskId, { assigneeIds });
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

  const handleSprintChange = React.useCallback((taskId: string, sprintId: string | null) => {
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
      teamId: teamId,
      labelIds: [],
    }

    setData((prev) => [...prev, newTask])


    setNewRowTitle("")
    setNewTaskPriority(null)
    setNewTaskDueDate(null)
    setNewTaskAssignees([])
    setNewTaskListId("todo")
    setIsAddingNewRow(false)
  }, [newRowTitle, newTaskPriority, newTaskDueDate, newTaskAssignees, newTaskListId, projectId, serverCreateTask])

  const handleInputKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>, parentId: string | null, options?: { sprintId?: string, onCancel?: () => void }) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddNewRow(parentId, options?.sprintId)
      if (options?.onCancel) options.onCancel()
    }
    if (e.key === "Escape") {
      setIsAddingNewRow(false)
      setNewRowTitle("")
      if (options?.onCancel) options.onCancel()
    }
  }, [handleAddNewRow])

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      if (over?.data?.current?.type === "epic-drop-area") {
        const epicId = over.data.current.epic.id
        updateTask(active.id as string, { epicId })
      } else if (over?.data?.current?.type === "sprint-drop-area") {
        const sprintId = over.data.current.sprint.id
        handleSprintChange(active.id as string, sprintId)
      } else {
        setData((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id)
          const newIndex = items.findIndex((item) => item.id === over?.id)
          return arrayMove(items, oldIndex, newIndex)
        })
      }
    }
  }, [updateTask, handleSprintChange])

  const handleDeleteTask = React.useCallback((taskId: string) => {
    setData((prev) => prev.filter((task) => task.id !== taskId));
  }, []);


  return {
    data,
    allData: data,
    sprints,
    isTaskLoading,
    epics,
    updateEpic,
    labels,
    filters,
    teamId,
    setFilters,
    createTask: serverCreateTask,
    selectedTask,
    setSelectedTask,
    isAddingNewRow,
    setIsAddingNewRow,
    newRowTitle,
    setNewRowTitle,
    newTaskPriority,
    setNewTaskPriority,
    newTaskDueDate,
    setNewTaskDueDate,
    newTaskAssignees,
    setNewTaskAssignees,
    newTaskListId,
    setNewTaskListId,
    dataIds: data.map((t) => t.id),
    projectId,
    activeSprint,
    startSprint,
    handleUpdateCell,
    handleDescriptionChange,
    handleDateChange,
    handlePriorityChange,
    handleListChange,
    handleRowClick,
    handleAddNewRow,
    handleInputKeyDown,
    handleDragEnd,
    handleEpicChange,
    handleSprintChange,
    handleLabelChange,
    handleAssigneeChange,
    handleReorderTask,
    handleDeleteTask,
    updateTask,
  }
}