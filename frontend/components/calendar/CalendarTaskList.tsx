"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { projectService } from "@/services/projectService";
import { taskService } from "@/services/taskService";
import { Project, Task } from "@/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical, AlertCircle, Layers, ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Priority } from "@/types/common/enums";
import { Separator } from "@/components/ui/separator";

export default function CalendarTaskList() {
    const params = useParams();
    const teamId = params?.teamId as string;

    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);

    useEffect(() => {
        if (teamId) {
            fetchProjects();
        }
    }, [teamId]);

    useEffect(() => {
        if (selectedProjectId) {
            fetchTasks(selectedProjectId);
        } else {
            setTasks([]);
        }
    }, [selectedProjectId]);

    const fetchProjects = async () => {
        try {
            setIsLoadingProjects(true);
            const data = await projectService.getProjects(teamId);
            setProjects(data);
            if (data.length > 0) {
                setSelectedProjectId(data[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setIsLoadingProjects(false);
        }
    };

    const fetchTasks = async (projectId: string) => {
        try {
            setIsLoadingTasks(true);
            const data = await taskService.getTasks({ projectId });
            setTasks(data.data || []);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
        } finally {
            setIsLoadingTasks(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, task: Task) => {
        e.dataTransfer.setData("application/json", JSON.stringify(task));
        e.dataTransfer.setData("text/plain", JSON.stringify(task));
        e.dataTransfer.effectAllowed = "copy";
        localStorage.setItem("draggedTask", JSON.stringify(task));
    };

    // Style cho Priority: Dùng Dot indicator + Text màu nhẹ
    const getPriorityStyles = (priority?: string | null) => {
        switch (priority) {
            case Priority.URGENT:
                return { dot: "bg-red-600", badge: "text-red-600 bg-red-50 border-red-100" };
            case Priority.HIGH:
                return { dot: "bg-orange-500", badge: "text-orange-600 bg-orange-50 border-orange-100" };
            case Priority.MEDIUM:
                return { dot: "bg-yellow-500", badge: "text-yellow-600 bg-yellow-50 border-yellow-100" };
            case Priority.LOW:
                return { dot: "bg-emerald-500", badge: "text-emerald-600 bg-emerald-50 border-emerald-100" };
            default:
                return { dot: "bg-neutral-400", badge: "text-neutral-500 bg-neutral-100 border-neutral-200" };
        }
    };

    return (
        // Main Container: Sharp corners or minimal radius, strong borders, pure white
        <Card className="h-full flex flex-col border-neutral-200 shadow-sm bg-white rounded-none sm:rounded-lg overflow-hidden">

            <CardHeader className="p-5 pb-4 space-y-4 bg-white border-b border-neutral-100">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold tracking-tight text-neutral-950 flex items-center gap-2.5">
                        <div className="p-1.5 bg-neutral-950 rounded-md">
                            <ListTodo className="w-4 h-4 text-white" />
                        </div>
                        Backlog
                    </CardTitle>
                    <Badge variant="outline" className="text-xs font-mono font-medium text-neutral-500 border-neutral-200 bg-neutral-50 px-2.5 py-0.5 rounded-full">
                        {tasks.length} items
                    </Badge>
                </div>

                {isLoadingProjects ? (
                    <div className="h-10 w-full animate-pulse bg-neutral-100 rounded-md" />
                ) : (
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="w-full h-10 bg-white border-neutral-200 text-neutral-800 focus:ring-1 focus:ring-neutral-950 focus:border-neutral-950 rounded-md shadow-sm transition-all">
                            <div className="flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-neutral-500" />
                                <SelectValue placeholder="Select Project" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="border-neutral-200">
                            {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id} className="cursor-pointer focus:bg-neutral-100 focus:text-neutral-900">
                                    {project.name}
                                </SelectItem>
                            ))}
                            {projects.length === 0 && (
                                <div className="p-3 text-sm text-neutral-500 text-center italic">No projects found</div>
                            )}
                        </SelectContent>
                    </Select>
                )}
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative bg-neutral-50/50">
                <ScrollArea className="h-full px-4 py-4">
                    {isLoadingTasks ? (
                        <div className="flex flex-col gap-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 w-full animate-pulse bg-neutral-200/50 rounded-lg" />
                            ))}
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-60 text-neutral-400 text-sm">
                            <div className="bg-white border border-neutral-200 p-4 rounded-full mb-3 shadow-sm">
                                <AlertCircle className="w-6 h-6 text-neutral-300" />
                            </div>
                            <p className="font-semibold text-neutral-600">No tasks found</p>
                            <p className="text-xs text-neutral-400 mt-1">Select a project to view tasks</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 pb-4">
                            <div className="flex items-center justify-between px-1 mb-1">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                    Draggable Items
                                </span>
                            </div>

                            {tasks.map((task) => {
                                const priorityStyle = getPriorityStyles(task.priority);
                                return (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task)}
                                        className={cn(
                                            "group relative flex flex-col gap-2.5 p-3.5 rounded-lg border border-neutral-200 bg-white transition-all duration-200",
                                            "hover:border-neutral-400 hover:shadow-md cursor-grab active:cursor-grabbing",
                                            "active:scale-[0.98]"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-2.5">
                                                {/* Accent Dot */}
                                                <div className={cn("mt-1.5 w-2 h-2 rounded-full flex-shrink-0", priorityStyle.dot)} />
                                                <span className="font-medium text-sm text-neutral-800 leading-snug">
                                                    {task.title}
                                                </span>
                                            </div>
                                            <GripVertical className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 transition-colors flex-shrink-0 mt-0.5" />
                                        </div>


                                        <div className="flex items-center justify-between">
                                            {/* Priority Badge - The only colored element */}
                                            {task.priority && (
                                                <div className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-sm border", priorityStyle.badge)}>
                                                    {task.priority}
                                                </div>
                                            )}

                                            <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                                                {task.assigneeIds && task.assigneeIds.length > 0 ? (
                                                    <span className="text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                                                        {task.assigneeIds.length} ASSIGNEE{task.assigneeIds.length > 1 ? 'S' : ''}
                                                    </span>
                                                ) : (
                                                    <span className="italic">Unassigned</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}