import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types";
import { format } from "date-fns";
import { Calendar, Check, X, Flag, AlertCircle } from "lucide-react";
import React from 'react';
import { cn } from "@/lib/utils";

// Helper for priority colors
const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
        case 'urgent': return "text-red-500 fill-red-500/10";
        case 'high': return "text-orange-500 fill-orange-500/10";
        case 'medium': return "text-yellow-500 fill-yellow-500/10";
        case 'low': return "text-blue-500 fill-blue-500/10";
        default: return "text-muted-foreground";
    }
};

export function TaskApprovalItem({
    task,
    memberMap,
    onApprove,
    onReject,
    isUpdating
}: {
    task: Task;
    memberMap: Record<string, any>;
    onApprove: (e: React.MouseEvent) => void;
    onReject: (e: React.MouseEvent) => void;
    isUpdating: boolean;
}) {
    // Optimized lookup O(1)
    const reporter = memberMap[task.reporterId || ""] || null;

    // Handle case where reporter might be different structure depending on backend
    const reporterName = reporter?.cachedUser?.name || reporter?.name || "Unknown User";
    const reporterAvatar = reporter?.cachedUser?.avatar || reporter?.avatar;

    return (
        <div className="group flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-all">
            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-2">
                {/* Header: Title & Badges */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 min-w-0 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-sm truncate text-foreground">{task.title}</h4>
                            {task.taskLabels?.map((label: any) => (
                                <Badge
                                    key={label.id}
                                    variant="outline"
                                    className="h-5 px-1.5 text-[10px] font-medium border-transparent shrink-0"
                                    style={{
                                        backgroundColor: label.color ? `${label.color}15` : undefined, // 15% opacity background
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
                    {/* Reporter */}
                    <div className="flex items-center gap-1.5 min-w-0" title={`Reported by ${reporterName}`}>
                        <Avatar className="h-4 w-4 border border-border/50">
                            <AvatarImage src={reporterAvatar} />
                            <AvatarFallback className="text-[8px] bg-muted/50 text-muted-foreground">
                                {reporterName?.substring(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[120px]">{reporterName}</span>
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

            {/* Actions - Always visible but styled subtly until hover/interaction */}
            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 sm:border-l sm:pl-3 border-border/40">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={onReject}
                    disabled={isUpdating}
                    title="Reject Task"
                >
                    <X className="h-4 w-4 mr-1.5" />
                    <span className="sr-only sm:not-sr-only text-xs">Reject</span>
                </Button>
                <Button
                    size="sm"
                    className="h-8 px-3 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm transition-all"
                    onClick={onApprove}
                    disabled={isUpdating}
                    title="Approve Task"
                >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs font-medium">Approve</span>
                </Button>
            </div>
        </div>
    );
}
