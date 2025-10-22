// components/epic/EpicTaskColumns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Task } from "@/lib/types/task.type"
import { PriorityPicker } from "@/components/task/PriorityPicker"
import { DatePicker } from "@/components/task/DatePicker"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
} from "@/components/ui/select"
import {
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    User as UserIcon,
} from "lucide-react"

// Helper (Giữ nguyên)
const StatusDisplay = ({ status }: { status: Task["status"] }) => {
    const Icon = {
        todo: <Clock className="h-4 w-4 text-gray-500" />,
        in_progress: <AlertCircle className="h-4 w-4 text-blue-500" />,
        done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        canceled: <XCircle className="h-4 w-4 text-red-500" />,
    }[status]
    const Text = {
        todo: "Todo",
        in_progress: "In Progress",
        done: "Done",
        canceled: "Canceled",
    }[status]
    return <div className="flex items-center gap-2">{Icon}<span className="text-sm">{Text}</span></div>
}

export const getSimpleTaskColumns = (): ColumnDef<Task>[] => [
    {
        accessorKey: "title",
        header: "Task Name",
        // --- THAY ĐỔI: Chuyển từ font-medium sang font-normal ---
        cell: ({ row }) => <span className="font-normal">{row.original.title}</span>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <div className="flex justify-center">
                <StatusDisplay status={row.original.status} />
            </div>
        )
    },
    {
        accessorKey: "assignees",
        header: "Assignee",
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
                                <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6 border-2 border-background">
                                        <AvatarFallback className="text-xs">{assignee.avatarFallback}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent><p>{assignee.name}</p></TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </TooltipProvider>
            )
        }
    },
    {
        accessorKey: "due_date",
        header: "Due Date",
        cell: ({ row }) => (
            <div className="flex justify-center">
                <DatePicker
                    date={row.original.due_date}
                    onDateSelect={() => {}} // Read-only
                />
            </div>
        )
    },
    {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => (
            <div className="flex justify-center">
                <PriorityPicker
                    priority={row.original.priority}
                    onPriorityChange={() => {}} // Read-only
                />
            </div>
        )
    }
]