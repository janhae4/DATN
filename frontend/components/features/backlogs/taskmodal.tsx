"use client"

import * as React from "react"
import { useModal } from "@/hooks/useModal"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Task } from "@/types/task.type"
import { db } from "@/public/mock-data/mock-data"
import { TaskTitle } from "./TaskTitle"
import { TaskDescription } from "./TaskDescription"
import { TaskMetaBox } from "./TaskMetaBox"
import { TaskLabels } from "./TaskLabels"
import { AttachmentsBox } from "@/components/shared/AttachmentsBox"

type TaskDetailModalProps = {
    task: Task | null
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onStatusChange: (taskId: string, statusId: string) => void
    onDateChange: (taskId: string, newDate: Date | undefined) => void
    onPriorityChange: (taskId: string, priority: Task["priority"]) => void
    onTitleChange: (taskId: string, columnId: "title", value: string) => void
    onDescriptionChange: (taskId: string, description: string) => void
}

export function TaskDetailModal({
    task: initialTask,
    open: propOpen = false,
    onOpenChange: propOnOpenChange,
    onStatusChange,
    onDateChange,
    onPriorityChange,
    onTitleChange,
    onDescriptionChange
}: TaskDetailModalProps) {
    const { isOpen, onOpenChange } = useModal(propOpen)
    const modalOpen = propOnOpenChange ? propOpen : isOpen
    const handleOpenChange = propOnOpenChange || onOpenChange

    // Local state for form fields
    const [task, setTask] = React.useState(initialTask)
    const [title, setTitle] = React.useState(initialTask?.title || '')
    const [description, setDescription] = React.useState(initialTask?.description || '')

    // Update local state when initialTask changes
    React.useEffect(() => {
        if (initialTask) {
            setTask(initialTask)
            setTitle(initialTask.title)
            setDescription(initialTask.description || '')
        }
    }, [initialTask])

    // Get statuses for the current project
    const statuses = React.useMemo(
        () => db.statuses.filter(s => s.projectId === task?.projectId).sort((a, b) => a.order - b.order),
        [task?.projectId]
    )

    // Get assignee initials
    const getAssigneeInitial = (assigneeId: string): string => {
        const user = db.users.find(u => u.id === assigneeId);
        return user ? user.name.charAt(0).toUpperCase() : "U";
    }

    // Don't render anything if no task is selected
    if (!task) return null

    // Handler functions
    const handleStatusChange = (statusId: string) => onStatusChange(task.id, statusId)
    const handleTaskDateChange = (date: Date | undefined) => onDateChange(task.id, date)
    const handleTaskPriorityChange = (priority: Task["priority"]) => onPriorityChange(task.id, priority)
    const handleTaskTitleChange = (title: string) => onTitleChange(task.id, "title", title)
    const handleTaskDescriptionChange = (description: string) => onDescriptionChange(task.id, description)

    return (
        <Sheet open={modalOpen} onOpenChange={handleOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6">
                <SheetHeader className="p-0">
                    <SheetDescription className="pl-2">
                        ID: {task.id}
                    </SheetDescription>
                    <SheetTitle className="sr-only">Task Details: {task.title}</SheetTitle>
                    <TaskTitle
                        title={title}
                        onTitleChange={setTitle}
                        onBlur={() => handleTaskTitleChange(title)}
                    />
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Description */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Description</h3>
                        <TaskDescription
                            description={description}
                            onDescriptionChange={setDescription}
                            onBlur={() => handleTaskDescriptionChange(description)}
                        />
                    </div>

                    {/* Task Meta Information */}
                    <TaskMetaBox
                        task={task}
                        statuses={statuses}
                        onStatusChange={handleStatusChange}
                        onDateChange={handleTaskDateChange}
                        onPriorityChange={handleTaskPriorityChange}
                        getAssigneeInitial={getAssigneeInitial}
                    />

                    {/* Labels Section */}
                    <TaskLabels labelIds={task.labelIds || []} />

                    {/* Attachment Section */}
                    <AttachmentsBox />
                </div>  
            </SheetContent>
        </Sheet>
    )
}