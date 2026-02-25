import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Task } from "@/types";
import { format } from "date-fns";
import { ArrowUpRight, Calendar, CheckCircle2, Clock, Flag, XCircle } from "lucide-react";
import React from 'react';

// Helper for priority colors - matching TaskApprovalItem
const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
        case 'urgent': return "text-red-500 fill-red-500/10";
        case 'high': return "text-orange-500 fill-orange-500/10";
        case 'medium': return "text-yellow-500 fill-yellow-500/10";
        case 'low': return "text-blue-500 fill-blue-500/10";
        default: return "text-muted-foreground";
    }
};

const getStatusStyles = (status?: string) => {
    switch (status) {
        case 'APPROVED': return { color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Approved", icon: CheckCircle2 };
        case 'REJECTED': return { color: "text-rose-500", bg: "bg-rose-500/10", label: "Rejected", icon: XCircle };
        case 'PENDING': return { color: "text-amber-500", bg: "bg-amber-500/10", label: "Pending", icon: Clock };
        default: return { color: "text-muted-foreground", bg: "bg-secondary", label: status || "Unknown", icon: Clock };
    }
};

export function TaskRequestItem({
    task,
    memberMap,
    onResubmit
}: {
    task: Task;
    memberMap: Record<string, any>;
    onResubmit: (e: React.MouseEvent) => void;
}) {
    const statusStyles = getStatusStyles(task.approvalStatus);
    const StatusIcon = statusStyles.icon;

    // Use assignee instead of reporter for Request Item (since current user IS reporter)
    const assigneeIds = task.assigneeIds || [];
    const firstAssignee = assigneeIds.length > 0 ? memberMap[assigneeIds[0]] : null;
    const assigneeName = firstAssignee?.cachedUser?.name || firstAssignee?.name || "Unassigned";
    const assigneeAvatar = firstAssignee?.cachedUser?.avatar || firstAssignee?.avatar;


    return (
        <div className="group flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-all">
            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-2">
                {/* Header: Title & Badges */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 min-w-0 w-full">
                        <div className="flex items-center gap-2 flex-wrap">

                            <h4 className="font-medium text-sm truncate text-foreground">{task.title}</h4>

                            {/* Status Badge - Inlined like labels in ApprovalItem */}
                            <Badge
                                variant="outline"
                                className={cn("h-5 px-1.5 text-[10px] font-medium border-transparent shrink-0 gap-1", statusStyles.bg, statusStyles.color)}
                            >
                                <StatusIcon className="w-3 h-3" />
                                {statusStyles.label}
                            </Badge>

                            {task.taskLabels?.map((label: any) => (
                                <Badge
                                    key={label.id}
                                    variant="outline"
                                    className="h-5 px-1.5 text-[10px] font-medium border-transparent shrink-0"
                                    style={{
                                        backgroundColor: label.color ? `${label.color}15` : undefined,
                                        color: label.color,
                                    }}
                                >
                                    {label.name}
                                </Badge>
                            ))}
                        </div>

                        {/* Description Preview */}
                        {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 truncate max-w-[90%]">
                                {task.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Meta Row */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground/80 flex-wrap">
                    {/* Assignee (instead of reporter) */}
                    <div className="flex items-center gap-1.5 min-w-0" title={`Assigned to ${assigneeName}`}>
                        <Avatar className="h-4 w-4 border border-border/50">
                            <AvatarImage src={assigneeAvatar} />
                            <AvatarFallback className="text-[8px] bg-muted/50 text-muted-foreground">
                                {assigneeName?.substring(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[120px]">{assigneeName}</span>
                    </div>

                    <div className="h-3 w-[1px] bg-border/60" />

                    {/* Created Date */}
                    {task.createdAt && (
                        <div className="flex items-center gap-1.5" title="Created date">
                            <Calendar className="h-3 w-3 opacity-70" />
                            <span>{format(new Date(task.createdAt), "MMM d, yyyy")}</span>
                        </div>
                    )}

                    {/* Priority */}
                    {task.priority && (
                        <>
                            <div className="h-3 w-[1px] bg-border/60" />
                            <div className={cn("flex items-center gap-1.5 font-medium", getPriorityColor(task.priority))} title="Priority">
                                <Flag className={cn("h-3 w-3", getPriorityColor(task.priority).split(' ')[1])} />
                                <span className="capitalize">{task.priority.toLowerCase()}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Actions - Only visible if Resubmit needed */}
            {task.approvalStatus === 'REJECTED' && (
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 sm:border-l sm:pl-3 border-border/40">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onResubmit}
                        className="h-8 px-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                        Resubmit
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                </div>
            )}
        </div>
    );
}