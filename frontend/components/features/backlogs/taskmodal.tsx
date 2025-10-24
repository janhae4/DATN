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
import { Task } from "@/lib/dto/task.type"
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar"
import { DatePicker } from "@/components/shared/DatePicker"
import { PriorityPicker } from "@/components/shared/PriorityPicker"
import StatusPicker from "@/components/shared/StatusPicker"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    CheckCircle2, Clock, AlertCircle, XCircle, User as UserIcon,
    CalendarIcon, FlagIcon, Network, AlignLeft, FileText,
    Upload, Tag, ChevronRight, Plus
} from "lucide-react"

// Import AttachmentsBox mới
import { AttachmentsBox } from "@/components/shared/AttachmentsBox"
import { db } from "@/public/mock-data/mock-data"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { Table, TableBody } from "@/components/ui/table"
import TaskTreeList from "./task/TaskTreeList"
import { AddNewTaskRow } from "./task/BacklogTaskRow"

type TaskDetailModalProps = {
    task: Task | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onStatusChange: (taskId: string, statusId: string) => void
    onDateChange: (taskId: string, newDate: Date | undefined) => void
    onPriorityChange: (taskId: string, priority: Task["priority"]) => void
    onTitleChange: (taskId: string, columnId: "title", value: string) => void
    onDescriptionChange: (taskId: string, description: string) => void
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

    const { data } = useTaskManagementContext()

    // Always call hooks to preserve hook order between renders.
    // Initialize to safe defaults and sync when "task" becomes available.
    const [title, setTitle] = React.useState<string>(task ? task.title : "")
    const [description, setDescription] = React.useState<string>(task ? task.description || "" : "")

    React.useEffect(() => {
        if (task) setTitle(task.title)
    }, [task])

    React.useEffect(() => {
        if (task) setDescription(task.description || "")
    }, [task])

    // Calculate subtasks using React.useMemo
    const subtasks = React.useMemo(
        () => task?.subtaskIds?.map(id => data.find(t => t.id === id)).filter(Boolean) as Task[] || [],
        [data, task?.subtaskIds]
    )

    const handleTitleBlur = () => {
        if (!task) return
        if (title.trim() && title.trim() !== task.title) {
            onTitleChange(task.id, "title", title.trim())
        } else {
            setTitle(task.title)
        }
    }

    const titleTextareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea based on content
    React.useEffect(() => {
        const textarea = titleTextareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
        }
    }, [title]);

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.blur();
        }
    }

    const handleDescriptionBlur = () => {
        if (!task) return
        if (description !== (task.description || "")) {
            onDescriptionChange(task.id, description.trim())
        }
    }

    const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && e.ctrlKey) {
            e.currentTarget.blur();
        }
    }

    // If there's no task selected, render nothing (sheet stays closed)
    if (!task) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6">
                <SheetHeader className="p-0" >
                    <SheetDescription className="pl-2">
                        ID: {task.id}
                    </SheetDescription>
                    <SheetTitle className="sr-only">Task Details: {task.title}</SheetTitle>
                    <Textarea
                        ref={titleTextareaRef}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        placeholder="Enter task title..."
                        className="!text-2xl hover:bg-muted/50 font-semibold border-none shadow-none focus-visible:ring-2 p-2 !bg-transparent resize-none overflow-hidden"
                        style={{ 
                            wordWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                            minHeight: '40px',
                            maxHeight: '200px'
                        }}
                    />

                </SheetHeader>

                {/* Khung thông tin chi tiết */}
                
                <div className="flex flex-col border px-4 py-2 rounded-xl">
                    <DetailRow icon={<Clock className="h-4 w-4" />} label="Status">
                        <div className="w-48">
                            <StatusPicker
                                statuses={db.statuses}
                                value={task.statusId || null}
                                onChange={(newStatusId: string) => onStatusChange(task.id, newStatusId)}
                            />
                        </div>
                    </DetailRow>

                    <DetailRow icon={<UserIcon className="h-4 w-4" />} label="Assignees">
                        {(() => {
                            const assignees = task.assigneeIds?.map(id => db.users.find(u => u.id === id)).filter((user): user is NonNullable<typeof user> => user !== undefined) || []
                            return assignees.length > 0 ? (
                                <div className="flex items-center -space-x-2">
                                    {assignees.map(assignee => (
                                        <Avatar key={assignee.id} className="h-7 w-7 border-2 border-background">
                                            <AvatarFallback className="text-xs">{assignee.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">Empty</span>
                            )
                        })()}
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

                    <DetailRow icon={<Network className="h-4 w-4" />} label="Epic">
                        {(() => {
                            const epic = task.epicId ? db.epics.find(e => e.id === task.epicId) : null
                            return epic ? (
                                <span className="text-sm">{epic.title}</span>
                            ) : (
                                <span className="text-sm text-muted-foreground">No epic</span>
                            )
                        })()}
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
                            Subtasks ({task.subtaskIds?.length || 0})
                        </h3>
                        <div className="min-h-[100px] border rounded-lg p-3 bg-muted/20">
                            {/* Render Add Subtask Row */}
                            <Table>
                                <TableBody>
                                    <AddNewTaskRow
                                        level={0}
                                        parentId={task.id}
                                        statuses={db.statuses}
                                    />
                                </TableBody>
                            </Table>

                            {/* Render Subtasks Tree */}
                            <Table>
                                <TaskTreeList
                                    topLevelTasks={subtasks}
                                    statuses={db.statuses}
                                />
                            </Table>
                        </div>
                    </div>

                    {/* Labels Section */}
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold mb-2">
                            <Tag className="h-5 w-5" />
                            Labels
                        </h3>
                        <div className="min-h-[60px] border-dashed border rounded p-3 w-full">
                            {task.labelIds?.length ? (
                                <div className="flex flex-wrap gap-2">
                                    {task.labelIds.map(labelId => {
                                        const label = db.labels.find(l => l.id === labelId)
                                        return label ? (
                                            <span
                                                key={labelId}
                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: label.color + '20',
                                                    color: label.color,
                                                    border: `1px solid ${label.color}40`
                                                }}
                                            >
                                                {label.name}
                                            </span>
                                        ) : null
                                    })}
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">No labels</span>
                            )}
                        </div>
                    </div>

                    {/* Attachment Section (NEW) */}
                    <AttachmentsBox />
                </div>
            </SheetContent>
        </Sheet>
    )
}