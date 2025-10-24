"use client"

import * as React from "react"
import { Task } from "@/lib/dto/task.type"
import { Status } from "@/lib/dto/status.interaface"
import { useDraggable } from "@dnd-kit/core"
import { TableCell, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PriorityPicker } from "@/components/shared/PriorityPicker"
import { DatePicker } from "@/components/shared/DatePicker"
import StatusPicker from "@/components/shared/StatusPicker"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserCircle2Icon, ChevronRight, GripVertical } from "lucide-react"
import { getAssigneeInitial } from "@/lib/utils/backlog-utils"
import { db } from "@/public/mock-data/mock-data"
import LabelTag from "@/components/ui/LabelTag"
import { cn } from "@/lib/utils"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"

interface BacklogTaskRowProps {
  task: Task
  statuses: Status[]
  level?: number
  hasSubtasks?: boolean
  isExpanded?: boolean
  onToggleExpand?: () => void
  isDraggable?: boolean
}

export function BacklogTaskRow({
  task,
  statuses,
  level = 0,
  hasSubtasks = false,
  isExpanded = false,
  onToggleExpand,
  isDraggable = false,
}: BacklogTaskRowProps) {
  const {
    handleUpdateCell,
    handleStatusChange,
    handlePriorityChange,
    handleDateChange,
    handleRowClick,
  } = useTaskManagementContext()

  // --- DND-KIT HOOK (Không thay đổi) ---
  const {
    attributes,
    listeners, // <-- Chúng ta sẽ di chuyển cái này
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: {
      task: task,
    },
    disabled: !isDraggable || level > 0,
  })
  // --- END DND-KIT HOOK ---

  const stopPropagation = (e: React.MouseEvent | React.PointerEvent) => e.stopPropagation()
  const isSubtask = level > 0
  const indentationStyle = { paddingLeft: `${level * 1.5 + 0.5}rem` }

  return (
    <TableRow
      ref={setNodeRef} // <-- Giữ nguyên ref
      {...attributes} // <-- Giữ nguyên attributes
      // {...listeners} // <-- XÓA DÒNG NÀY
      className={cn(
        "group cursor-pointer hover:bg-muted/50 transition-colors",
        isSubtask && "bg-muted/30 hover:bg-muted/40",
        isDragging && "opacity-30 bg-primary/10 blur-sm" // <-- Giữ nguyên style
      )}
      onClick={() => handleRowClick?.(task)} // <-- Giờ nó sẽ hoạt động
    >
      <TableCell style={indentationStyle} className="min-w-[300px]">
        <div className="flex items-center gap-1">
          
          {/* --- THÊM TAY CẦM KÉO THẢ (DRAG HANDLE) --- */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 rounded-md text-muted-foreground flex-shrink-0 cursor-grab",
              // Ẩn đi nếu không thể kéo (là subtask hoặc không trong backlog)
              (!isDraggable || level > 0) && "invisible", 
              isDragging && "cursor-grabbing"
            )}
            {...listeners} // <-- CHỈ ÁP DỤNG LISTENERS VÀO ĐÂY
            onClick={stopPropagation} // Ngăn sự kiện click của hàng
            // onPointerDown={stopPropagation} // Ngăn sự kiện click của hàng
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          {/* --- KẾT THÚC TAY CẦM KÉO THẢ --- */}

          <Checkbox 
            className="h-4 w-4 flex-shrink-0" 
            onClick={stopPropagation} 
            onPointerDown={stopPropagation} 
          />

          {/* MODIFICATION: Always show the toggle button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 rounded-md text-muted-foreground flex-shrink-0 transition-transform duration-200",
              isExpanded && "rotate-90",
              // Show with low opacity normally, full opacity when hovering the entire row for tasks without subtasks
              !hasSubtasks && "opacity-0 group-hover:opacity-100",
            )}
            aria-label="Toggle subtasks"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand?.()
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Input
            className="border-none bg-transparent h-auto px-2  shadow-none  focus-visible:ring-2 text-sm truncate flex-1 min-w-0"
            value={task.title}
            onChange={(e) => handleUpdateCell(task.id, "title", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleUpdateCell(task.id, "title", e.currentTarget.value)
                e.currentTarget.blur()
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                e.currentTarget.value = task.title // Revert on escape
                e.currentTarget.blur()
              }
            }}
            onPointerDown={stopPropagation}
            onClick={stopPropagation}
          />
          {/* Label tags shown after title input */}
          <div
            className="flex items-center gap-1 ml-2 flex-shrink-0 max-w-[10rem] overflow-x-auto"
            onPointerDown={stopPropagation}
            onClick={stopPropagation}
          >
            {(task.labelIds || []).map((labelId) => {
              const label = db.labels.find((l) => l.id === labelId)
              if (!label) return null
              return <LabelTag key={label.id} label={label} />
            })}
          </div>
        </div>
      </TableCell>

      <TableCell className="w-[120px]">
        <div onPointerDown={stopPropagation} onClick={stopPropagation}>
          <StatusPicker
            statuses={statuses}
            value={task.statusId || null}
            onChange={(statusId) => handleStatusChange(task.id, statusId)}
            disabled={false}
          />
        </div>
      </TableCell>

      <TableCell className="w-[110px]">
        <div onPointerDown={stopPropagation} onClick={stopPropagation}>
          <PriorityPicker priority={task.priority} onPriorityChange={(p) => handlePriorityChange(task.id, p)} />
        </div>
      </TableCell>

      <TableCell className="w-[50px] text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full p-0 hover:bg-muted/50"
          onPointerDown={stopPropagation}
          onClick={stopPropagation}
        >
          <Avatar className="h-6 w-6">
            {task.assigneeIds && task.assigneeIds.length > 0 ? (
              <AvatarFallback className="text-xs">{getAssigneeInitial(task.assigneeIds[0])}</AvatarFallback>
            ) : (
              <UserCircle2Icon className="h-5 w-5 text-muted-foreground" />
            )}
          </Avatar>
        </Button>
      </TableCell>

      <TableCell className="w-[100px]">
        <DatePicker date={task.due_date ? new Date(task.due_date) : undefined} onDateSelect={(date) => handleDateChange(task.id, date)} />
      </TableCell>
    </TableRow>
  )
}

// --- AddNewTaskRow Component ---
interface AddNewTaskRowProps {
  level: number
  parentId: string | null
  statuses: Status[]
}

export function AddNewTaskRow({
  level,
  parentId,
  statuses,
}: AddNewTaskRowProps) {
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
    e.stopPropagation();

  // MODIFICATION: Add indentation style based on level
  const indentationStyle = { paddingLeft: `${level * 1.5 + 0.5}rem` };
  // This width should match the combined width of the Chevron button (6) + gap (1) + Checkbox (4) = 24px + 4px + 16px = 44px
  const spacerWidth = "44px";

  return (
    <TableRow onClick={stopPropagation} className="bg-muted/10 hover:bg-muted/20">
      {/* MODIFICATION: Apply indentation style */}
      <TableCell style={indentationStyle}>
        <div className="flex items-center gap-1">
          {/* MODIFICATION: Add an invisible spacer to align the input. */}
          <div className="flex-shrink-0" style={{ width: spacerWidth }} />

          <Input
            autoFocus
            placeholder="Enter new task title..."
            value={newRowTitle}
            onChange={(e) => setNewRowTitle(e.target.value)}
            onPointerDown={stopPropagation}
            onClick={stopPropagation}
            onKeyDown={(e) => handleInputKeyDown(e, parentId)}
            onBlur={() => handleAddNewRow(parentId)} // Save when blurring
            className="h-auto p-0 px-1 bg-transparent border-none shadow-none flex-grow focus-visible:ring-0 focus:ring-0 focus:border-none focus:outline-none"
          />

        </div>
      </TableCell>
      {/* Other cells */}
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
          {/* Placeholder */}
          <UserCircle2Icon className="h-5 w-5 text-muted-foreground" />
        </Button>
      </TableCell>
      <TableCell className="w-[100px]">
        <DatePicker date={newTaskDueDate} onDateSelect={(date) => setNewTaskDueDate(date ?? null)} />
      </TableCell>
    </TableRow>
  );
}