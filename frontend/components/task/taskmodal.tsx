// components/task/TaskDetailModal.tsx
"use client"

import * as React from "react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Task } from "@/lib/types/task.type"
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select"
import { DatePicker } from "./DatePicker"
import { PriorityPicker } from "./PriorityPicker"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    CheckCircle2, Clock, AlertCircle, XCircle, User as UserIcon,
    CalendarIcon, FlagIcon, Network, AlignLeft, FileText,
    Upload
} from "lucide-react"

// Import AttachmentsBox mới
import { AttachmentsBox } from "./AttachmentsBox"

type TaskDetailModalProps = {
    task: Task | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onStatusChange: (taskId: string, status: Task["status"]) => void
    onDateChange: (taskId: string, newDate: Date | undefined) => void
    onPriorityChange: (taskId: string, priority: Task["priority"]) => void
    onTitleChange: (taskId: string, columnId: "title", value: string) => void
    onDescriptionChange: (taskId: string, description: string) => void
}

// Helper render Status (lấy từ TaskColumns)
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

    return (
        <div className="flex items-center gap-2">
            {Icon}
            <span className="text-sm">{Text}</span>
        </div>
    )
}

// Helper Row (Đã tăng chiều rộng cột label)
const DetailRow = ({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) => (
    <div className="grid grid-cols-[120px_1fr] items-center gap-4 py-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {icon}
            {label}
        </div>
        <div>{children}</div>
    </div>
)

export function TaskDetailModal({
    task,
    open,
    onOpenChange,
    onStatusChange,
    onDateChange,
    onPriorityChange,
    onTitleChange,
    onDescriptionChange
}: TaskDetailModalProps) {

    // Early return if no task
    if (!task) {
        return null
    }

    const [title, setTitle] = React.useState(task.title)
    const [description, setDescription] = React.useState(task.description || "")

    React.useEffect(() => {
        setTitle(task.title)
    }, [task.title])

    React.useEffect(() => {
        setDescription(task.description || "")
    }, [task.description])

    const handleTitleBlur = () => {
        if (title.trim() && title.trim() !== task.title) {
            onTitleChange(task.id, "title", title.trim())
        } else {
            setTitle(task.title);
        }
    }

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.currentTarget.blur();
        }
    }

    const handleDescriptionBlur = () => {
        if (description !== (task.description || "")) {
            onDescriptionChange(task.id, description.trim())
        }
    }

    const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && e.ctrlKey) {
            e.currentTarget.blur();
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6">
                <SheetHeader className="p-2" >
                    <SheetDescription>
                        ID: {task.id}
                    </SheetDescription>
                    <SheetTitle className="sr-only">Task Details: {task.title}</SheetTitle>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        // Dùng !text-2xl và !bg-transparent để override CSS mặc định của Input
                        className="!text-2xl font-semibold border-none shadow-none focus-visible:ring-0 p-0 h-auto !bg-transparent"
                    />

                </SheetHeader>

                {/* Khung thông tin chi tiết */}
                <div className="flex flex-col border px-4 py-2 rounded-xl">
                    <DetailRow icon={<Clock className="h-4 w-4" />} label="Status">
                        <Select
                            value={task.status}
                            onValueChange={(newStatus: Task["status"]) => onStatusChange(task.id, newStatus)}
                        >
                            <SelectTrigger className="w-48 h-8">
                                <StatusDisplay status={task.status} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todo"><StatusDisplay status="todo" /></SelectItem>
                                <SelectItem value="in_progress"><StatusDisplay status="in_progress" /></SelectItem>
                                <SelectItem value="done"><StatusDisplay status="done" /></SelectItem>
                                <SelectItem value="canceled"><StatusDisplay status="canceled" /></SelectItem>
                            </SelectContent>
                        </Select>
                    </DetailRow>

                    <DetailRow icon={<UserIcon className="h-4 w-4" />} label="Assignees">
                        {task.assignees && task.assignees.length > 0 ? (
                            <div className="flex items-center -space-x-2">
                                {task.assignees.map(a => (
                                    <Avatar key={a.id} className="h-7 w-7 border-2 border-background">
                                        <AvatarFallback className="text-xs">{a.avatarFallback}</AvatarFallback>
                                    </Avatar>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground">Empty</span>
                        )}
                    </DetailRow>

                    <DetailRow icon={<CalendarIcon className="h-4 w-4" />} label="Due Date">
                        <DatePicker
                            date={task.due_date}
                            onDateSelect={(newDate) => onDateChange(task.id, newDate)}
                        />
                    </DetailRow>

                    <DetailRow icon={<FlagIcon className="h-4 w-4" />} label="Priority">
                        <PriorityPicker
                            priority={task.priority}
                            onPriorityChange={(newPriority) => onPriorityChange(task.id, newPriority)}
                        />
                    </DetailRow>
                </div>


                <div className="flex flex-col gap-6 mt-6">
                    {/* Description Section */}
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold mb-2">
                            <AlignLeft className="h-5 w-5" />
                            Description
                        </h3>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleDescriptionBlur}
                            onKeyDown={handleDescriptionKeyDown}
                            placeholder="Write a description for your task..."
                            className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            rows={4}
                        />
                    </div>

                    {/* Subtasks Section */}
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold mb-2">
                            <Network className="h-5 w-5" />
                            Subtasks ({task.subtasks?.length || 0})
                        </h3>
                        <div className="text-sm text-muted-foreground min-h-[60px] border-dashed border rounded p-3 w-full">
                            Add subtasks...
                        </div>
                    </div>

                    {/* Attachment Section (NEW) */}
                    <AttachmentsBox />
                </div>
            </SheetContent>
        </Sheet>
    )
}