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
} from "@dnd-kit/core"
import {
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, CalendarIcon, FlagIcon, User as UserIcon, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { getTaskColumns } from "../task/TaskColumns"
import { DraggableRow } from "../task/DraggableRow"
import { TaskDetailModal } from "./taskmodal"

import { useTaskManagement } from "@/hooks/useTaskManagement"
import { Task } from "@/lib/types/task.type"
import { Button } from "../ui/button"
import { PriorityPicker } from "./PriorityPicker"
import { DatePicker } from "./DatePicker"


export function TaskDataTable() {

  const {
    data,
    selectedTask,
    isAddingNewRow,
    newRowTitle,
    newTaskPriority,
    newTaskDueDate,
    newTaskAssignees,
    newTaskStatus,
    dataIds,
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
    setNewRowTitle,
    setIsAddingNewRow,
    setSelectedTask,
    setNewTaskPriority,
    setNewTaskDueDate,
    setNewTaskAssignees,
    setNewTaskStatus,
  } = useTaskManagement()


  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}))

  const columns = React.useMemo(
    () => getTaskColumns({
      handleDateChange,
      handlePriorityChange,
      handleStatusChange,
      handleRowClick,
      handleUpdateCell,
    }),
    [
      handleRowClick,
      handleUpdateCell,
      handleDateChange,
      handlePriorityChange,
      handleStatusChange,
    ]
  )

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full">

      <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
        <AccordionItem value="item-1" className="border-b-0">

          <AccordionTrigger className="px-4 items-center py-2 bg-muted/50 hover:no-underline transition-all">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">Backlog</span>
              <span className="text-md text-muted-foreground">({data.length} work items)</span>
            </div>
          </AccordionTrigger>

          <AccordionContent className="p-2 bg-muted/50">
            {/* <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}> */}

            <div className="overflow-hidden border bg-white">
              <Table>


                <TableBody>
                  <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} handleRowClick={handleRowClick} />
                    ))}
                  </SortableContext>
                  {isAddingNewRow ? (
                    <TableRow className="hover:bg-white">
                      {/* 1. Dùng colSpan để gộp tất cả các cột */}
                      <TableCell colSpan={columns.length} className="py-1">

                        {/* 2. Dùng 1 div flex cha để căn chỉnh Input (trái) và Icons (phải) */}
                        <div className="flex w-full items-center gap-4 ">

                          {/* 3. Input: Dùng flex-1 để chiếm hết không gian còn lại */}
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              placeholder="Tên công việc mới..."
                              value={newRowTitle}
                              onChange={(e) => setNewRowTitle(e.target.value)}
                              onKeyDown={handleInputKeyDown}
                              autoFocus
                              className="h-8 border-none focus-visible:ring-0 shadow-none bg-transparent"
                            />
                          </div>

                   

                          <div className="flex-shrink-0 flex items-center gap-3 text-muted-foreground/50">
                            <Button
                              variant={newRowTitle.trim().length > 0 ? "default" : "ghost"}
                              size="sm"
                              onClick={handleAddNewRow}
                            >
                              Create
                            </Button>
                          </div>
                        </div>
                      </TableCell>
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>


      {/* Modal được giữ bên ngoài Accordion */}
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