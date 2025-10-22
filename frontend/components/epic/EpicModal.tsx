"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Epic } from "@/lib/types/epic.type"
import { Task } from "@/lib/types/task.type" // Cần cho Status/Priority
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
import { DatePicker } from "@/components/task/DatePicker"
import { PriorityPicker } from "@/components/task/PriorityPicker"
import { Input } from "@/components/ui/input"
import {
    CheckCircle2, Clock, AlertCircle, XCircle, User as UserIcon,
    CalendarIcon, FlagIcon, AlignLeft, Network,
} from "lucide-react"

// --- PROPS INTERFACE (Đã cập nhật) ---
// Thêm các handlers để component này có thể cập nhật dữ liệu
interface EpicModalProps {
    epic: Epic | null
    isOpen: boolean
    onClose: () => void
    // Giả sử Epic cũng có các handlers tương tự Task
    onStatusChange: (epicId: string, status: Task["status"]) => void
    onDateChange: (epicId: string, key: "start_date" | "due_date", newDate: Date | undefined) => void
    onPriorityChange: (epicId: string, priority: Task["priority"]) => void
    onTitleChange: (epicId: string, title: string) => void
    // Giả sử Epic có thể có mô tả (description)
    onDescriptionChange: (epicId: string, description: string) => void
}

// --- HELPER COMPONENTS (Tái sử dụng từ TaskModal/EpicColumns) ---

// Helper render Status
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

// Helper Row (Giống TaskDetailModal)
const DetailRow = ({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) => (
    <div className="grid grid-cols-[120px_1fr] items-center gap-4 py-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {icon}
            {label}
        </div>
        <div>{children}</div>
    </div>
)

// --- MAIN COMPONENT ---

export function EpicModal({
    epic,
    isOpen,
    onClose,
    onStatusChange,
    onDateChange,
    onPriorityChange,
    onTitleChange,
    onDescriptionChange
}: EpicModalProps) {
    if (!epic) return null

    // State cho các trường có thể chỉnh sửa
    const [title, setTitle] = React.useState(epic.title)
    // Giả sử epic có description, nếu không, bạn có thể xóa state này
    const [description, setDescription] = React.useState((epic as any).description || "")

    React.useEffect(() => {
        setTitle(epic.title)
        setDescription((epic as any).description || "")
    }, [epic])

    const handleTitleBlur = () => {
        if (title.trim() && title.trim() !== epic.title) {
            onTitleChange(epic.id, title.trim())
        } else {
            setTitle(epic.title) // Reset nếu tiêu đề rỗng hoặc không đổi
        }
    }

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") e.currentTarget.blur()
    }

    const handleDescriptionBlur = () => {
        if (description !== ((epic as any).description || "")) {
            onDescriptionChange(epic.id, description.trim())
        }
    }
    
    const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && e.ctrlKey) {
            e.currentTarget.blur();
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="w-full sm:max-w-lg overflow-y-auto p-6">
                <DialogHeader className="p-2">
                    <DialogDescription>
                        ID: {epic.id}
                    </DialogDescription>
                    <DialogTitle className="sr-only">Epic Details: {epic.title}</DialogTitle>
                    {/* Tiêu đề có thể chỉnh sửa */}
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        className="!text-2xl font-semibold border-none shadow-none focus-visible:ring-0 p-0 h-auto !bg-transparent"
                    />
                </DialogHeader>

                {/* Khung thông tin chi tiết (Giống TaskDetailModal) */}
                <div className="flex flex-col border px-4 py-2 rounded-xl">
                    <DetailRow icon={<Clock className="h-4 w-4" />} label="Status">
                        <Select
                            value={epic.status}
                            onValueChange={(newStatus: Task["status"]) => onStatusChange(epic.id, newStatus)}
                        >
                            <SelectTrigger className="w-48 h-8">
                                <StatusDisplay status={epic.status} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todo"><StatusDisplay status="todo" /></SelectItem>
                                <SelectItem value="in_progress"><StatusDisplay status="in_progress" /></SelectItem>
                                <SelectItem value="done"><StatusDisplay status="done" /></SelectItem>
                                <SelectItem value="canceled"><StatusDisplay status="canceled" /></SelectItem>
                            </SelectContent>
                        </Select>
                    </DetailRow>

                    <DetailRow icon={<UserIcon className="h-4 w-4" />} label="Owner">
                        {epic.owner ? (
                            <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7 border-2 border-background">
                                    <AvatarFallback className="text-xs">{epic.owner.avatarFallback}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{epic.owner.name}</span>
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground">Empty</span>
                        )}
                    </DetailRow>

                    <DetailRow icon={<CalendarIcon className="h-4 w-4" />} label="Start Date">
                        <DatePicker
                            date={epic.start_date}
                            onDateSelect={(newDate) => onDateChange(epic.id, "start_date", newDate)}
                        />
                    </DetailRow>

                    <DetailRow icon={<CalendarIcon className="h-4 w-4" />} label="Due Date">
                        <DatePicker
                            date={epic.due_date}
                            onDateSelect={(newDate) => onDateChange(epic.id, "due_date", newDate)}
                        />
                    </DetailRow>

                    <DetailRow icon={<FlagIcon className="h-4 w-4" />} label="Priority">
                        <PriorityPicker
                            priority={epic.priority}
                            onPriorityChange={(newPriority) => onPriorityChange(epic.id, newPriority)}
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
                            placeholder="Write a description for this epic..."
                            className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            rows={4}
                        />
                    </div>

                    {/* Tasks Section (Placeholder) */}
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold mb-2">
                            <Network className="h-5 w-5" />
                            Tasks
                        </h3>
                        <div className="text-sm text-muted-foreground min-h-[60px] border-dashed border rounded p-3 w-full">
                            Khu vực này có thể dùng để hiển thị danh sách các Task liên quan.
                        </div>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    )
}