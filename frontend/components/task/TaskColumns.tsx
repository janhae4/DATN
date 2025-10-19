"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { PriorityPicker } from "./PriorityPicker"
import { Task } from "@/lib/types/task.type"
import { DatePicker } from "./DatePicker"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Network,
    PlusCircle,
    User as UserIcon,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
} from "lucide-react"

// 1. Cập nhật Type: Thêm handleRowClick, xóa logic edit inline
export type TaskColumnHandlers = {
    handleRowClick: (task: Task) => void
    handleUpdateCell: (taskId: string, columnId: "title", value: string) => void
    handleDateChange: (taskId: string, newDate: Date | undefined) => void
    handlePriorityChange: (taskId: string, priority: Task["priority"]) => void
    handleToggleComplete: (taskId: string, isCompleted: boolean) => void
    handleStatusChange: (taskId: string, status: Task["status"]) => void
}

// Hàm này tạo ra mảng columns
export const getTaskColumns = ({
    handleRowClick,
    handleUpdateCell,
    handleDateChange,
    handlePriorityChange,
    handleToggleComplete,
    handleStatusChange,
}: TaskColumnHandlers): ColumnDef<Task>[] => [
        {
            accessorKey: "title",
            header: "Name",
            cell: ({ row }) => {
                const task = row.original
                
                // 2. Xóa hết logic edit inline, thay bằng onClick để mở modal
                return (
                    <div className="flex justify-start items-center gap-2 flex-1">
                        <Checkbox
                            checked={task.isCompleted}
                            onCheckedChange={(checked) => handleToggleComplete(task.id, !!checked)}
                            onClick={(e) => e.stopPropagation()} // Ngăn việc click checkbox mở modal
                        />
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        className="truncate cursor-pointer hover:underline px-1 rounded"
                                        onClick={() => handleRowClick(task)} // 3. GỌI handleRowClick KHI CLICK
                                    >
                                        {task.title}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs break-words">{task.title}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {task.subtasks && task.subtasks.length > 0 && (
                            <span className="flex items-center gap-1 text-muted-foreground ml-auto">
                                <Network className="h-3 w-3" />
                                <span className="text-xs">{task.subtasks.length}</span>
                            </span>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            size: 140, 
            cell: ({ row }) => {
                const { status, id } = row.original
                const getStatusIcon = (status: Task["status"]) => {
                    switch (status) {
                        case "todo": return <Clock className="h-4 w-4 text-gray-500" />;
                        case "in_progress": return <AlertCircle className="h-4 w-4 text-blue-500" />;
                        case "done": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
                        case "canceled": return <XCircle className="h-4 w-4 text-red-500" />;
                        default: return <Clock className="h-4 w-4 text-gray-500" />;
                    }
                }
                const getStatusText = (status: Task["status"]) => {
                     switch (status) {
                        case "todo": return "Todo";
                        case "in_progress": return "In Progress";
                        case "done": return "Done";
                        case "canceled": return "Canceled";
                        default: return "Todo";
                    }
                }

                return (
                    <div className="flex justify-center">
                        <Select
                            value={status}
                            onValueChange={(newStatus: Task["status"]) => handleStatusChange(id, newStatus)}
                        >
                            <SelectTrigger className="w-auto h-8 border-none bg-transparent hover:bg-muted/50 shadow-none focus:ring-0">
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(status)}
                                    <span className="text-sm">{getStatusText(status)}</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todo"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-500" /><span>Todo</span></div></SelectItem>
                                <SelectItem value="in_progress"><div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-blue-500" /><span>In Progress</span></div></SelectItem>
                                <SelectItem value="done"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span>Done</span></div></SelectItem>
                                <SelectItem value="canceled"><div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /><span>Canceled</span></div></SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )
            },
        },
        {
            accessorKey: "assignees",
            header: "Assignee",
            size: 100,
            cell: ({ row }) => {
                const { assignees } = row.original
                if (!assignees || assignees.length === 0) {
                    return <div className="flex justify-center"><UserIcon className="h-5 w-5 text-muted-foreground/50" /></div>
                }
                return (
                    <TooltipProvider>
                        <div className="flex justify-center items-center -space-x-2">
                            {assignees.slice(0, 3).map((assignee) => (
                                <Tooltip key={assignee.id}>
                                    <TooltipTrigger asChild><Avatar className="h-6 w-6 border-2 border-background"><AvatarFallback className="text-xs">{assignee.avatarFallback}</AvatarFallback></Avatar></TooltipTrigger>
                                    <TooltipContent><p>{assignee.name}</p></TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </TooltipProvider>
                )
            },
        },
        {
            accessorKey: "due_date",
            header: "Due date",
            size: 120, 
            cell: ({ row }) => {
                const { due_date, id } = row.original
                return (
                    <div className="flex justify-center">
                        <DatePicker
                            date={due_date}
                            onDateSelect={(newDate) => handleDateChange(id, newDate)}
                        />
                    </div>
                )
            },
        },
        {
            accessorKey: "priority",
            header: "Priority",
            size: 100,
            cell: ({ row }) => {
                const { priority, id } = row.original
                return (
                    <div className="flex justify-center">
                        <PriorityPicker
                            priority={priority}
                            onPriorityChange={(newPriority) => handlePriorityChange(id, newPriority)}
                        />
                    </div>
                )
            },
        }
    ]


