"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ClipboardCheck,
    Loader2
} from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeam";
import { useAuth } from "@/contexts/AuthContext";
import { taskService } from "@/services/taskService";
import { MemberRole, Task } from "@/types";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLists } from "@/hooks/useList";
import { TaskDetailModal } from "../taskmodal";
import { TaskApprovalItem } from "./TaskApprovalItem";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function TaskApprovalModal() {
    const params = useParams();
    const teamId = params.teamId as string;
    const { user } = useAuth();
    const { data: teamMembers, isLoading: isLoadingMembers } = useTeamMembers(teamId);
    const queryClient = useQueryClient();
    const [open, setOpen] = React.useState(false);

    // Determine current user's role
    const currentUserRole = React.useMemo(() => {
        if (!user || !teamMembers) return null;

        // Try finding by userId first (consistent with other parts of the app)
        const member = teamMembers.find((m: any) => m.userId === user.id) ||
            teamMembers.find((m: any) => m.id === user.id);

        return member ? member.role : null;
    }, [user, teamMembers]);

    const memberMap = React.useMemo(() => {
        if (!teamMembers) return {};
        return teamMembers.reduce((acc: any, member: any) => {
            acc[member.id] = member;
            if (member.userId) acc[member.userId] = member;
            return acc;
        }, {});
    }, [teamMembers]);

    const canApprove = currentUserRole === MemberRole.OWNER || currentUserRole === MemberRole.ADMIN;

    const { data: pendingTasksData, isLoading: isLoadingTasks } = useQuery({
        queryKey: ['tasks', 'approval-pending', teamId],
        queryFn: () => taskService.getTasksByTeam({
            teamId,
            approvalStatus: 'PENDING',
            limit: 100
        }),
        enabled: !!teamId && canApprove && open,
    });

    const pendingTasks = pendingTasksData?.data || [];

    const updateTaskMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string, status: 'APPROVED' | 'REJECTED' }) =>
            taskService.updateTask(taskId, { approvalStatus: status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['tasks', 'approval-pending'] });
            toast.success("Task status updated");
        },
        onError: () => {
            toast.error("Failed to update task status");
        }
    });

    const handleUpdateStatus = (taskId: string, status: 'APPROVED' | 'REJECTED') => {
        updateTaskMutation.mutate({ taskId, status });
    };

    const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

    // Fetch lists needed for TaskDetailModal
    const { lists } = useLists(pendingTasks[0]?.projectId);

    // TaskDetailModal handlers
    const handleListChange = (taskId: string, listId: string) => {
        taskService.updateTask(taskId, { listId }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
    };
    const handleDateChange = (taskId: string, newDate: Date | undefined) => {
        taskService.updateTask(taskId, { dueDate: newDate ? newDate.toISOString() : undefined }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
    };
    const handlePriorityChange = (taskId: string, priority: Task["priority"]) => {
        taskService.updateTask(taskId, { priority }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
    };
    const handleAssigneeChange = (taskId: string, assigneeIds: string[]) => {
        taskService.updateTask(taskId, { assigneeIds }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
    };
    const handleTitleChange = (taskId: string, columnId: "title", value: string) => {
        taskService.updateTask(taskId, { title: value }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
    };
    const handleDescriptionChange = (taskId: string, description: string) => {
        taskService.updateTask(taskId, { description }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
    };
    const handleLabelsChange = (taskId: string, labelIds: string[]) => {
        taskService.updateTask(taskId, { labelIds }).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
    };

    if (isLoadingMembers) {
        return null;
    }

    if (!canApprove) {
        return null;
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" className="relative text-muted-foreground hover:text-foreground">
                                    <ClipboardCheck className="h-5 w-5" />
                                    {pendingTasks.length > 0 && (
                                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse border border-background" />
                                    )}
                                </Button>
                            </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Approvals</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-6 gap-6">
                    <DialogHeader className=" space-y-1">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            Task Approvals
                            {pendingTasks.length > 0 && (
                                <Badge variant="secondary" className="ml-2 px-2 py-0.5 text-xs font-normal">
                                    {pendingTasks.length} Pending
                                </Badge>
                            )}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Review and manage tasks generated from members.
                        </p>
                    </DialogHeader>

                    <div className="flex-1 min-h-[300px] max-h-[550px] pr-2">
                        {isLoadingTasks ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/60">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <span className="text-sm">Loading tasks...</span>
                            </div>
                        ) : pendingTasks.length === 0 ? (
                            <div className="flex flex-col h-100 items-center justify-center text-muted-foreground/60 gap-4">
                                <div className="p-4 rounded-full  bg-muted/50 border border-border/50">
                                    <ClipboardCheck className="h-10 w-10 opacity-50" />
                                </div>
                                <div className="text-center space-y-1">
                                    <h3 className="font-medium text-foreground">All caught up!</h3>
                                    <p className="text-sm">There are no tasks waiting for verification.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full pr-2 overflow-y-auto">
                                <div className="space-y-3 pb-2">
                                    {pendingTasks.map((task: Task) => (
                                        <div key={task.id} onClick={() => setSelectedTask(task)} className="cursor-pointer outline-none">
                                            <TaskApprovalItem
                                                task={task}
                                                memberMap={memberMap}
                                                onApprove={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdateStatus(task.id, 'APPROVED');
                                                }}
                                                onReject={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdateStatus(task.id, 'REJECTED');
                                                }}
                                                isUpdating={updateTaskMutation.isPending}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    open={!!selectedTask}
                    onOpenChange={(open) => !open && setSelectedTask(null)}
                    lists={lists || []}
                    onListChange={handleListChange}
                    onDateChange={handleDateChange}
                    onPriorityChange={handlePriorityChange}
                    onAssigneeChange={handleAssigneeChange}
                    onTitleChange={handleTitleChange}
                    onDescriptionChange={handleDescriptionChange}
                    onLabelsChange={handleLabelsChange}
                    updateTask={(taskId, updates) => taskService.updateTask(taskId, updates)}
                />
            )}
        </>
    );
}


