"use client"

import * as React from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table"
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus, CalendarIcon, FlagIcon, User as UserIcon, Clock } from "lucide-react"

// Import từ các file đã chia nhỏ
import { Task } from "@/lib/types/task.type"
import { initialData } from "../task/task-data"
import { getTaskColumns, TaskColumnHandlers } from "../task/TaskColumns"
import { DraggableRow } from "../task/DraggableRow"
// *** 1. IMPORT MODAL MỚI ***
import { TaskDetailModal } from "./taskmodal"


export function TaskDataTable() {
  const [data, setData] = React.useState<Task[]>(initialData)
  
  // *** 2. THÊM STATE MỚI CHO MODAL ***
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)

  const [isAddingNewRow, setIsAddingNewRow] = React.useState(false)
  const [newRowTitle, setNewRowTitle] = React.useState("")


  // --- CÁC HÀM XỬ LÝ (HANDLERS) ---
  const updateTask = React.useCallback((taskId: string, updates: Partial<Task>) => {
    setData((currentData) =>
      currentData.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    )
    // Cập nhật cả task đang được chọn trong modal (nếu có)
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

  // *** 3. THÊM HANDLER ĐỂ MỞ MODAL ***
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
      isCompleted: false, status: "todo", priority: null,
      assignees: [], subtasks: [], due_date: null,
    }
    setData((prev) => [...prev, newTask])
    setNewRowTitle("")
    setIsAddingNewRow(false)
  }, [newRowTitle])

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddNewRow()
    if (e.key === "Escape") setIsAddingNewRow(false)
  }

  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}))
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
  const dataIds = React.useMemo(() => data.map(({ id }) => id), [data])


  // --- KHỞI TẠO BẢNG ---
  const columns = React.useMemo(
    () => getTaskColumns({
      // *** 4. TRUYỀN PROP MỚI VÀO ***
      handleRowClick, 
      handleUpdateCell,
      handleDateChange,
      handlePriorityChange,
      handleToggleComplete,
      handleStatusChange,
    }),
    [
      handleRowClick,
      handleUpdateCell,
      handleDateChange,
      handlePriorityChange,
      handleToggleComplete,
      handleStatusChange,
    ]
  )

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
  })


  // --- RENDER ---
  return (
    <div className="w-full">
      {/* <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}> */}
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} style={{
                      width: header.getSize() !== 150 ? `${header.getSize()}px` : 'auto', // 150 is default size
                    }}
                      className={
                        header.id.includes("assignee") ||
                          header.id.includes("due_date") ||
                          header.id.includes("priority") ||
                          header.id.includes("status") ||
                          header.id.includes("add_column")
                          ? "text-center"
                          : ""
                      }>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                {table.getRowModel().rows.map((row) => (
                  <DraggableRow key={row.id} row={row} />
                ))}
              </SortableContext>
              {isAddingNewRow ? (
                <TableRow className="bg-muted/50">
                    <TableCell className="py-1">
                      <div className="flex items-center gap-2">
                        <Input placeholder="Tên công việc mới..." value={newRowTitle} onChange={(e) => setNewRowTitle(e.target.value)} onKeyDown={handleInputKeyDown} autoFocus className="h-8 border-none focus-visible:ring-0 shadow-none"/>
                      </div>
                    </TableCell>
                    <TableCell className="text-center"><Clock className="h-5 w-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell className="text-center"><UserIcon className="h-5 w-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell className="text-center"><CalendarIcon className="h-5 w-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell className="text-center"><FlagIcon className="h-5 w-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell />
                  </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="cursor-pointer text-muted-foreground hover:bg-muted/50 h-10" onClick={() => setIsAddingNewRow(true)}>
                    <div className="flex items-center px-2"><Plus className="h-4 w-4 mr-2" />Add Task</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      {/* </DndContext> */}

      {/* *** 5. RENDER MODAL *** */}
      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null)
          }
        }}
        onStatusChange={handleStatusChange}
        onDateChange={handleDateChange}
        onPriorityChange={handlePriorityChange}
        onTitleChange={handleUpdateCell}
        onDescriptionChange={handleDescriptionChange}
      />
    </div>
  )
}
