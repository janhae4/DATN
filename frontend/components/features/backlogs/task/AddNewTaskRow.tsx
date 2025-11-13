"use client"

import * as React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PriorityPicker } from "@/components/shared/PriorityPicker"
import { DatePicker } from "@/components/shared/DatePicker"
import { StatusPicker } from "@/components/shared/status/StatusPicker"
import { UserCircle2Icon } from "lucide-react"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { Status } from "@/types/status.interface"

interface AddNewTaskRowProps {
  statuses: Status[]
  sprintId?: string
  onCancel?: () => void
}

export function AddNewTaskRow({ statuses, sprintId, onCancel }: AddNewTaskRowProps) {
  const {
    newRowTitle,
    setNewRowTitle,
    handleInputKeyDown,
    handleAddNewRow,
    newTaskPriority,
    newTaskStatus,
    setNewTaskPriority,
    newTaskDueDate,
    setNewTaskDueDate,
    setNewTaskStatus,
  } = useTaskManagementContext()

  // Helper function to prevent click propagation
  const stopPropagation = (e: React.MouseEvent | React.PointerEvent) =>
    e.stopPropagation()

  return (
    <TableRow onClick={stopPropagation} className="bg-muted/10 hover:bg-muted/20">
      <TableCell>
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            placeholder="Enter new task title..."
            value={newRowTitle}
            onChange={(e) => setNewRowTitle(e.target.value)}
            onPointerDown={stopPropagation}
            onClick={stopPropagation}
            onKeyDown={(e) => handleInputKeyDown(e, null, { sprintId, onCancel })}
            onBlur={() => handleAddNewRow(null, sprintId)}
            className="h-auto p-0 px-1 bg-transparent border-none shadow-none flex-grow focus-visible:ring-0 focus:ring-0 focus:border-none focus:outline-none"
          />
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              ×
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell className="w-[120px]">
        <div onPointerDown={stopPropagation} onClick={stopPropagation}>
          <StatusPicker
            statuses={statuses ?? []}
            value={newTaskStatus || null}
            onChange={setNewTaskStatus}
          />
        </div>
      </TableCell>
      <TableCell className="w-[110px]">
        <PriorityPicker
          priority={newTaskPriority}
          onPriorityChange={setNewTaskPriority}
        />
      </TableCell>
      <TableCell className="w-[50px]">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full p-0 hover:bg-muted/50 invisible"
        >
          <UserCircle2Icon className="h-5 w-5 text-muted-foreground" />
        </Button>
      </TableCell>
      <TableCell className="w-[100px]">
        <DatePicker 
          date={newTaskDueDate} 
          onDateSelect={(date) => setNewTaskDueDate(date ?? null)} 
        />
      </TableCell>
    </TableRow>
  )
}
