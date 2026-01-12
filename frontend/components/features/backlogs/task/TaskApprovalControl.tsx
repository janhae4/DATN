import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, Trash2, X } from "lucide-react";
import { Task, User } from "@/types";
import { UpdateTaskDto } from "@/services/taskService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskApprovalControlProps {
    task: Task;
    currentRole: string | null;
    user: User | null;
    onUpdateTask: (taskId: string, updates: UpdateTaskDto) => void;
    onDeleteTask?: (taskId: string) => void;
    stopPropagation: (e: React.MouseEvent | React.PointerEvent) => void;
}

export function TaskApprovalControl({
    task,
    currentRole,
    user,
    onUpdateTask,
    onDeleteTask,
    stopPropagation,
}: TaskApprovalControlProps) {
    const isOwnerOrAdmin = currentRole === 'OWNER' || currentRole === 'ADMIN';

    // 1. PENDING STATE
    if (task.approvalStatus === 'PENDING') {
        if (isOwnerOrAdmin) {
            return (
                <div
                    className="flex items-center gap-1 bg-background border border-input shadow-sm rounded-full p-0.5 animate-in fade-in zoom-in duration-300"
                    onClick={stopPropagation}
                >
                    <ActionTooltip label="Approve">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-full text-muted-foreground hover:bg-foreground hover:text-background transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdateTask(task.id, { approvalStatus: 'APPROVED' });
                                toast.success("Task approved");
                            }}
                        >
                            <Check className="h-3.5 w-3.5" />
                        </Button>
                    </ActionTooltip>

                    {/* Subtle divider for separation */}
                    <div className="h-3 w-[1px] bg-border/60" />

                    <ActionTooltip label="Reject">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-full text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdateTask(task.id, { approvalStatus: 'REJECTED' });
                                toast.info("Task rejected");
                            }}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </ActionTooltip>
                </div>
            );
        }

        // Regular user view for Pending
        return (
            <ActionTooltip label="Waiting for admin/owner approval">
                <Badge
                    variant="outline"
                    className="font-mono font-normal text-[10px] h-6 px-2.5 text-muted-foreground border-border bg-background/50 cursor-help"
                >
                    pending
                </Badge>
            </ActionTooltip>
        );
    }

    // 2. REJECTED STATE
    if (task.approvalStatus === 'REJECTED') {
        return (
            <div className="flex items-center gap-2 group/rejected">
                <Badge
                    variant="secondary"
                    className="font-mono font-normal text-[10px] h-6 px-2.5 bg-muted text-muted-foreground hover:bg-muted"
                >
                    rejected
                </Badge>

                {user?.id === task.reporterId && (
                    <ActionTooltip label="Delete Task">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-full text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-all opacity-0 group-hover/rejected:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTask?.(task.id);
                            }}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </ActionTooltip>
                )}
            </div>
        );
    }

    // APPROVED STATE - don't show badge
    if (task.approvalStatus === 'APPROVED') {
        return null;
    }

    return null;
}

// Helper tailored for monochrome contrast
function ActionTooltip({ children, label }: { children: React.ReactNode; label: string }) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent
                    side="top"
                    className="text-xs font-medium px-2 py-1 bg-foreground text-background border-border"
                >
                    {label}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}