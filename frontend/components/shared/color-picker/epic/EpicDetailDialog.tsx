"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Flag, Circle, CircleEllipsis, CheckCircle2, XCircle,
    LayoutList, ListTodo, AlertCircle,
    Plus, Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Epic, EpicStatus, Priority, ListCategoryEnum, Task } from "@/types"
import { useTasks } from "@/hooks/useTasks"
import { useEpics } from "@/hooks/useEpics"
import { ColorPicker } from "../ColorPicker"
import { DateRangePicker } from "../../DateRangePicker"
import { DateRange } from "react-day-picker"
import { toast } from "sonner"
import { listService } from "@/services/listService"
import { TaskDetailModal } from "../../../features/backlogs/taskmodal"

// Maps status/priority (Reused for consistency)
const statusMap: Record<EpicStatus, { label: string; icon: React.ElementType; color: string }> = {
    [EpicStatus.TODO]: { label: "To do", icon: Circle, color: "text-neutral-500" },
    [EpicStatus.IN_PROGRESS]: { label: "In Progress", icon: CircleEllipsis, color: "text-blue-500" },
    [EpicStatus.DONE]: { label: "Done", icon: CheckCircle2, color: "text-green-500" },
    [EpicStatus.CANCELED]: { label: "Canceled", icon: XCircle, color: "text-red-500" },
}

const priorityMap: Record<Priority, { label: string; icon: React.ElementType; color: string }> = {
    [Priority.HIGH]: { label: "High", icon: Flag, color: "text-red-500" },
    [Priority.MEDIUM]: { label: "Medium", icon: Flag, color: "text-yellow-500" },
    [Priority.LOW]: { label: "Low", icon: Flag, color: "text-blue-500" },
    [Priority.URGENT]: { label: "Urgent", icon: Flag, color: "text-red-600" },
}
const statusOptions = Object.values(EpicStatus)
const priorityOptions = Object.values(Priority)

interface EpicDetailDialogProps {
    epic: Epic | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EpicDetailDialog({ epic, open, onOpenChange }: EpicDetailDialogProps) {
    const params = useParams();
    const projectId = params.projectId as string;
    const teamId = params.teamId as string;
    const { tasks: epicTasks, createTask, isLoading: isTasksLoading, updateTask } = useTasks({
        projectId,
        teamId: teamId,
        epicId: epic?.id ? [epic.id] : undefined
    });
    const { updateEpic } = useEpics(projectId);

    // Fetch lists to identify which list is "TODO"
    const { data: lists } = useQuery({
        queryKey: ['lists', projectId],
        queryFn: () => listService.getLists(projectId),
        enabled: !!projectId && open, // Only fetch when dialog is open
    });

    // Form States
    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [status, setStatus] = React.useState<EpicStatus>(EpicStatus.TODO);
    const [priority, setPriority] = React.useState<Priority>(Priority.MEDIUM);
    const [color, setColor] = React.useState("#E06B80");
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

    // New Task State
    const [newTaskTitle, setNewTaskTitle] = React.useState("");
    const [isCreatingTask, setIsCreatingTask] = React.useState(false);
    const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

    const handleUpdateTask = (taskId: string, updates: any) => {
        updateTask(taskId, updates);
    };

    // Init form when epic changes
    React.useEffect(() => {
        if (epic) {
            setTitle(epic.title);
            setDescription(epic.description || "");
            setStatus(epic.status as EpicStatus);
            setPriority(epic.priority as Priority);
            setColor(epic.color || "#E06B80");
            setDateRange({
                from: epic.startDate ? new Date(epic.startDate) : undefined,
                to: epic.dueDate ? new Date(epic.dueDate) : undefined,
            });
        }
    }, [epic]);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !epic) return;

        // Find Todo list
        const todoList = lists?.find(l => l.category === ListCategoryEnum.TODO) || lists?.[0];

        if (!todoList) {
            toast.error("Waiting for project lists to load...");
            return;
        }

        setIsCreatingTask(true);
        try {
            await createTask({
                projectId,
                title: newTaskTitle.trim(),
                epicId: epic.id,
                priority: Priority.MEDIUM,
                listId: todoList.id,
            });
            setNewTaskTitle("");
            toast.success("Task created");
        } catch (error) {
            console.error("Failed to create task", error);
            toast.error("Failed to create task");
        } finally {
            setIsCreatingTask(false);
        }
    }

    if (!epic) return null;

    // Helper to render select options
    const renderOption = (Icon: React.ElementType, label: string, colorClass: string) => (
        <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", colorClass)} />
            <span className="capitalize">{label}</span>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogTitle className="sr-only">Epic Details: {epic.title}</DialogTitle>
                {/* Header Section */}
                <DialogHeader className="p-6 pb-4 border-b bg-background shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-5 flex-1 w-full">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        className={cn("mt-2 h-6 w-6 rounded-full shrink-0 ring-4 ring-offset-2 transition-all hover:scale-105 focus:outline-none cursor-pointer")}
                                        style={{ backgroundColor: color, borderColor: color }}
                                    />
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-3" align="start">
                                    <ColorPicker color={color} onChange={(c) => {
                                        setColor(c);
                                        updateEpic(epic.id, {
                                            title, description, status, priority, color: c,
                                            startDate: dateRange?.from?.toISOString(),
                                            dueDate: dateRange?.to?.toISOString(),
                                        }).catch(() => toast.error("Failed to update color"));
                                    }} />
                                </PopoverContent>
                            </Popover>

                            <div className="space-y-3 flex-1 w-full relative group/header">
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={() => {
                                        if (title !== epic.title) {
                                            updateEpic(epic.id, {
                                                title, description, status, priority, color,
                                                startDate: dateRange?.from?.toISOString(),
                                                dueDate: dateRange?.to?.toISOString(),
                                            }).then(() => toast.success("Title updated"))
                                                .catch(() => toast.error("Failed to update title"));
                                        }
                                    }}
                                    className="text-2xl font-bold h-auto px-2 -ml-2 py-1 border-transparent bg-transparent hover:bg-muted/50 focus:bg-background focus:border-input focus:ring-1 focus:ring-primary/20 transition-all rounded-md w-full"
                                    placeholder="Epic Title"
                                />

                                <div className="flex items-center gap-3 text-sm pt-1">
                                    <Select value={status} onValueChange={(v: EpicStatus) => {
                                        setStatus(v);
                                        updateEpic(epic.id, {
                                            title, description, status: v, priority, color,
                                            startDate: dateRange?.from?.toISOString(),
                                            dueDate: dateRange?.to?.toISOString(),
                                        }).then(() => toast.success("Status updated"))
                                            .catch(() => toast.error("Failed to update status"));
                                    }}>
                                        <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs border-0 bg-muted hover:bg-muted/80 focus:ring-0 rounded-full px-3 transition-colors">
                                            <div className="flex items-center gap-2">
                                                {statusMap[status]?.icon && React.createElement(statusMap[status].icon, { className: cn("h-3.5 w-3.5", statusMap[status].color) })}
                                                <span className="font-medium">{statusMap[status]?.label}</span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map((s) => (
                                                <SelectItem key={s} value={s}>
                                                    {renderOption(statusMap[s].icon, statusMap[s].label, statusMap[s].color)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={priority} onValueChange={(v: Priority) => {
                                        setPriority(v);
                                        updateEpic(epic.id, {
                                            title, description, status, priority: v, color,
                                            startDate: dateRange?.from?.toISOString(),
                                            dueDate: dateRange?.to?.toISOString(),
                                        }).then(() => toast.success("Priority updated"))
                                            .catch(() => toast.error("Failed to update priority"));
                                    }}>
                                        <SelectTrigger className="h-8 w-auto min-w-[110px] text-xs border-0 bg-muted hover:bg-muted/80 focus:ring-0 rounded-full px-3 transition-colors">
                                            <div className="flex items-center gap-2">
                                                {priorityMap[priority]?.icon && React.createElement(priorityMap[priority].icon, { className: cn("h-3.5 w-3.5", priorityMap[priority].color) })}
                                                <span className="font-medium">{priorityMap[priority]?.label}</span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {priorityOptions.map((p) => (
                                                <SelectItem key={p} value={p}>
                                                    {renderOption(priorityMap[p].icon, priorityMap[p].label, priorityMap[p].color)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Column: Description & Tasks */}
                    <div className="flex-1 border-r flex flex-col bg-muted/30 min-w-0">
                        <div className="flex-1 p-6 overflow-y-auto" >
                            <div className="space-y-8 ">
                                {/* Description */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                                        <LayoutList className="w-4 h-4 text-muted-foreground" />
                                        Description
                                    </div>
                                    <div className="bg-background rounded-lg border border-transparent hover:border-muted transition-colors focus-within:bg-background focus-within:border-primary/20 focus-within:shadow-sm group/desc">
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            onBlur={() => {
                                                if (description !== epic.description) {
                                                    updateEpic(epic.id, {
                                                        title, description, status, priority, color,
                                                        startDate: dateRange?.from?.toISOString(),
                                                        dueDate: dateRange?.to?.toISOString(),
                                                    }).then(() => toast.success("Description updated"))
                                                        .catch(() => toast.error("Failed to update description"));
                                                }
                                            }}
                                            className="border-0 bg-transparent focus-visible:ring-0 min-h-[120px] resize-none p-4 text-sm leading-relaxed placeholder:text-slate-400"
                                            placeholder="Add a more detailed description..."
                                        />
                                    </div>
                                </div>

                                {/* Linked Tasks */}
                                <div className="space-y-3">
                                    <div className="flex  items-center justify-between">
                                        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                                            <ListTodo className="w-4 h-4 text-muted-foreground" />
                                            Linked Tasks
                                            <Badge variant="secondary" className="h-5 px-1.5 min-w-[20px] justify-center">{epicTasks.length}</Badge>
                                        </div>
                                    </div>

                                    {/* Create Task Input */}
                                    <form onSubmit={handleCreateTask} className="relative group">
                                        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            placeholder="Add a new task to this epic..."
                                            className="pl-9 bg-background shadow-sm border-dashed border-input focus:border-solid focus:border-primary transition-all"
                                            disabled={isCreatingTask}
                                        />
                                        {newTaskTitle && (
                                            <Button
                                                type="submit"
                                                size="sm"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
                                                disabled={isCreatingTask}
                                            >
                                                {isCreatingTask ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                                            </Button>
                                        )}
                                    </form>

                                    {epicTasks.length > 0 ? (
                                        <div className="grid gap-2">
                                            {epicTasks.map(task => (
                                                <div
                                                    key={task.id}
                                                    onClick={() => setSelectedTask(task)}
                                                    className="group flex items-center gap-3 p-3 text-sm bg-card border rounded-lg shadow-sm hover:border-primary/50 transition-colors cursor-pointer"
                                                >
                                                    <div className={cn("w-2 h-2 rounded-full shrink-0",
                                                        task.priority === 'urgent' ? 'bg-red-500' :
                                                            task.priority === 'high' ? 'bg-orange-500' :
                                                                task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-400'
                                                    )} />
                                                    <span className="font-medium text-foreground leading-snug flex-1 truncate">{task.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/20 text-muted-foreground">
                                            <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                                            <p className="text-sm font-medium">No tasks linked</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Meta Info */}
                    <div className="w-[280px] shrink-0 bg-card flex flex-col border-l">
                        <div className="p-5 space-y-8">
                            {/* Date Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                    Date Range
                                </div>
                                <div className="space-y-2">
                                    <DateRangePicker
                                        range={dateRange}
                                        onRangeSelect={(range) => {
                                            setDateRange(range);
                                            updateEpic(epic.id, {
                                                title, description, status, priority, color,
                                                startDate: range?.from?.toISOString(),
                                                dueDate: range?.to?.toISOString(),
                                            }).then(() => toast.success("Date range updated"))
                                                .catch(() => toast.error("Failed to update dates"));
                                        }}
                                        align="start"
                                    />
                                </div>
                            </div>

                            {/* Additional Info / Stats */}
                            <div className="pt-4 border-t space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Tasks Count</span>
                                    <span className="font-medium">{epicTasks.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Completed</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
            <TaskDetailModal
                task={selectedTask}
                open={!!selectedTask}
                onOpenChange={(open) => !open && setSelectedTask(null)}
                lists={lists || []}
                onListChange={(id, listId) => handleUpdateTask(id, { listId })}
                onDateChange={(id, date) => handleUpdateTask(id, { dueDate: date?.toISOString() })}
                onPriorityChange={(id, p) => handleUpdateTask(id, { priority: p })}
                onAssigneeChange={(id, assigneeIds) => handleUpdateTask(id, { assigneeIds })}
                onTitleChange={(id, _, value) => handleUpdateTask(id, { title: value })}
                onDescriptionChange={(id, desc) => handleUpdateTask(id, { description: desc })}
                onLabelsChange={(id, labels) => handleUpdateTask(id, { labelIds: labels })}
                updateTask={handleUpdateTask}
            />
        </Dialog >
    )
}
