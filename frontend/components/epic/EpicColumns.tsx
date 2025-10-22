// components/epic/EpicColumns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Epic } from "@/lib/types/epic.type"
import { Task } from "@/lib/types/task.type" 
import { PriorityPicker } from "@/components/task/PriorityPicker" 
import { DatePicker } from "@/components/task/DatePicker" 
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Clock, AlertCircle, CheckCircle2, XCircle, User as UserIcon, FileText, MoreHorizontal, Trash2 } from "lucide-react"

// --- THAY ĐỔI: Import từ component UI của bạn ---
import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu" // Đã sửa
import { Button } from "@/components/ui/button"

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


export const getEpicColumns = (
  handleStatusChange: (id: string, status: Task["status"]) => void,
  handlePriorityChange: (id: string, priority: Task["priority"]) => void,
  handleDateChange: (id: string, key: "start_date" | "due_date", date: Date | undefined) => void,
  // --- THAY ĐỔI: Thêm handler cho modal ---
  handleOpenModal: (epic: Epic) => void
): ColumnDef<Epic>[] => [
    {
        accessorKey: "title",
        header: "Epic Name",
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },

    
  {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        size: 50, 
        cell: ({ row }) => {
            const epic = row.original

            return (
                <div className="flex justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7" 
                                onClick={(e) => e.stopPropagation()} 
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // --- THAY ĐỔI: Gọi handler đã truyền vào ---
                                    handleOpenModal(epic);
                                }}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                <span>View/Edit Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("Delete", epic.id);
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Epic</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    }
]