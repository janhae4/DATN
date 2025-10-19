"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  Row, // Import Row type
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Plus,
  User as UserIcon,
  GripVertical, // --- THÊM MỚI: Icon cho drag handle ---
} from "lucide-react"

// --- THÊM MỚI: Imports từ dnd-kit ---
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
// --- Hết Imports dnd-kit ---

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select
} from "@/components/ui/select"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// --- Dữ liệu người dùng (Không đổi) ---
const users = [
  { id: "user-1", name: "Son Goku", avatarFallback: "SG" },
  { id: "user-2", name: "Jane Doe", avatarFallback: "JD" },
  { id: "user-3", name: "Alex Smith", avatarFallback: "AS" },
]

export type User = {
  id: string
  name: string
  avatarFallback: string
  avatarUrl?: string
}

export type Task = {
  id: string
  title: string
  status: "todo" | "in_progress" | "done" | "canceled"
  priority: "low" | "medium" | "high"
  assignees: User[]
}

const initialData: Task[] = [
  {
    id: "TASK-8782",
    title: "Thiết kế trang Dashboard",
    status: "in_progress",
    priority: "high",
    assignees: [users[0], users[1]],
  },
  {
    id: "TASK-7878",
    title: "Gọi điện cho khách hàng X",
    status: "todo",
    priority: "medium",
    assignees: [users[1]],
  },
  {
    id: "TASK-1234",
    title: "Nộp báo cáo tuần",
    status: "done",
    priority: "low",
    assignees: [],
  },
]

// --- THÊM MỚI: Component DraggableRow ---
// Đây là component sẽ bọc mỗi TableRow
const DraggableRow = ({ row }: { row: Row<Task> }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.original.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative",
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={row.getIsSelected() && "selected"}
    >
      {/* Render các cell như bình thường, 
        nhưng listeners và attributes sẽ được gán cho cell "drag-handle" 
        (được định nghĩa trong columns) 
      */}
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {cell.column.id === "drag-handle" ? (
            <Button
              variant="ghost"
              size="icon"
              {...attributes}
              {...listeners}
              className="cursor-grab"
            >
              <GripVertical className="h-4 w-4" />
            </Button>
          ) : (
            flexRender(cell.column.columnDef.cell, cell.getContext())
          )}
        </TableCell>
      ))}
    </TableRow>
  )
}

// --- THAY ĐỔI: Cập nhật 'columns' để thêm "drag-handle" ---
export const columns: ColumnDef<Task>[] = [
  // --- CỘT MỚI: Drag Handle ---
  {
    id: "drag-handle",
    header: undefined,
    cell: () => (
      <div />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // Cột Select
  {
    id: "select",
    header: undefined,
    cell: () => (
      <div />
    ),
  },
  // Cột Status
  {
    accessorKey: "status",
  },
  // Cột Title
  {
    accessorKey: "title",
  },
  // Cột Priority
  {
    accessorKey: "priority",
  },
  // Cột Assignees
  {
    accessorKey: "assignees",
    header: "Assignees",
    cell: ({ row }) => {
      const assignees = row.original.assignees
      if (!assignees || assignees.length === 0) {
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Avatar className="h-8 w-8 border-dashed border">
              <AvatarFallback>
                <UserIcon className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span>Unassigned</span>
          </div>
        )
      }
      return (
        <TooltipProvider>
          <div className="flex items-center space-x-[-8px]">
            {assignees.map((assignee) => (
              <Tooltip key={assignee.id}>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarFallback>{assignee.avatarFallback}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{assignee.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      )
    },
  },
  // Cột Actions
  {
    id: "actions",
  },
]

export function TaskDataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  
  // State cho data
  const [data, setData] = React.useState<Task[]>(initialData)
  
  // State cho hàng mới (không đổi)
  const [isAddingNewRow, setIsAddingNewRow] = React.useState(false)
  const [newRow, setNewRow] = React.useState<{
    title: string
    status: Task["status"]
    priority: Task["priority"]
    assigneeIds: string[]
  }>({
    title: "",
    status: "todo",
    priority: "medium",
    assigneeIds: [],
  })

  // --- THÊM MỚI: Logic kéo-thả ---
  
  // 1. Cảm biến (Sensors)
  // Kích hoạt kéo khi click chuột (MouseSensor) hoặc chạm (TouchSensor)
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 2. Hàm xử lý khi kéo xong
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active.id !== over?.id) {
      setData((currentData) => {
        const oldIndex = currentData.findIndex((task) => task.id === active.id)
        const newIndex = currentData.findIndex((task) => task.id === over?.id)
        
        // Sử dụng arrayMove để tạo mảng mới đã sắp xếp
        return arrayMove(currentData, oldIndex, newIndex)
      })
    }
  }
  
  // 3. Lấy danh sách ID cho SortableContext
  const dataIds = React.useMemo(() => data.map((task) => task.id), [data])

  // Hàm thêm hàng mới (không đổi)
  const handleAddNewRow = () => { /* ... (code không đổi) ... */ }
  const handleNewRowChange = (field: keyof typeof newRow, value: string | string[]) => { /* ... (code không đổi) ... */ }

  const table = useReactTable({
    data,
    columns,
    // --- THÊM MỚI: Cung cấp `getRowId` ---
    // Điều này giúp dnd-kit và react-table hiểu nhau
    getRowId: (row) => row.id,
    
    // ... (phần còn lại không đổi) ...
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>

            {/* --- THAY ĐỔI: Dùng SortableContext và DraggableRow --- */}
            <TableBody>
              <SortableContext
                items={dataIds}
                strategy={verticalListSortingStrategy}
              >
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    // Dùng DraggableRow thay vì TableRow
                    <DraggableRow key={row.id} row={row} />
                  ))
                ) : (
                  !isAddingNewRow && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )
                )}
              </SortableContext>
              
              {/* --- Hàng thêm mới (Giữ nguyên logic) --- */}
              {/* Hàng này nằm ngoài SortableContext nên không thể kéo-thả */}
              {isAddingNewRow ? (
                <TableRow className="bg-muted/50">
                  <TableCell /> {/* drag-handle */}
                  <TableCell /> {/* select */}
                  
                  {/* Select Status */}
                  <TableCell>
                    <Select
                      value={newRow.status}
                      onValueChange={(value) =>
                        handleNewRowChange("status", value)
                      }
                    >
                      {/* ... (Select options) ... */}
                    </Select>
                  </TableCell>
                  
                  {/* Input Title */}
                  <TableCell>
                    <Input
                      placeholder="Tên công việc mới..."
                      value={newRow.title}
                      onChange={(e) =>
                        handleNewRowChange("title", e.target.value)
                      }
                    />
                  </TableCell>
                  
                  {/* Select Priority */}
                  <TableCell>
                    <Select
                      value={newRow.priority}
                      onValueChange={(value) =>
                        handleNewRowChange("priority", value)
                      }
                    >
                      {/* ... (Select options) ... */}
                    </Select>
                  </TableCell>
                  
                  {/* Multi-Select Assignee */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        {/* ... (Dropdown trigger) ... */}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {/* ... (Dropdown options) ... */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  
                  {/* Nút Save/Cancel */}
                  <TableCell className="flex items-center gap-2">
                    <Button onClick={handleAddNewRow} size="sm">
                      Save
                    </Button>
                    <Button
                      onClick={() => setIsAddingNewRow(false)}
                      variant="ghost"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                // Hàng "Add new task"
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="cursor-pointer text-muted-foreground hover:bg-muted/50"
                    onClick={() => setIsAddingNewRow(true)}
                  >
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Add new task
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DndContext>

      <div className="flex items-center justify-end space-x-2 py-4">
        {/* ... (Pagination không đổi) ... */}
      </div>
    </div>
  )
}