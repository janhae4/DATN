import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, X, Clock, AlertCircle, Trash2 } from "lucide-react"; // Thêm icon
import { MemberRole, Task, User } from "@/types";
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
  const isOwnerOrAdmin = currentRole === MemberRole.OWNER || currentRole === MemberRole.ADMIN;

  if (task.approvalStatus === "PENDING") {
    if (isOwnerOrAdmin) {
      return (
        <div
          className="flex items-center gap-1 mr-2 animate-in fade-in zoom-in duration-200"
          onClick={stopPropagation}
        >
          <div className="flex items-center bg-background/50 border rounded-md p-1 backdrop-blur-sm">
            <ActionTooltip label="Approve Request">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateTask(task.id, { approvalStatus: "APPROVED" });
                  toast.success("Task approved");
                }}
              >
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </Button>
            </ActionTooltip>

            <div className="h-3 w-[1px] bg-border mx-0.5" />

            <ActionTooltip label="Reject Request">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateTask(task.id, { approvalStatus: "REJECTED" });
                  toast.info("Task rejected");
                }}
              >
                <X className="h-3.5 w-3.5 stroke-[3]" />
              </Button>
            </ActionTooltip>
          </div>
        </div>
      );
    }

    return (
      <ActionTooltip label="Waiting for approval">
        <Badge
          variant="outline"
          className="mr-2 h-5 px-1.5 gap-1 font-normal text-[10px] text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 cursor-help transition-colors"
        >
          <Clock className="h-3 w-3" />
          <span>Pending</span>
        </Badge>
      </ActionTooltip>
    );
  }

  if (task.approvalStatus === "REJECTED") {
    return (
      <div className="flex items-center gap-1 mr-2 group/rejected">
        <ActionTooltip label="This task was rejected">
          <Badge
            variant="outline"
            className="h-5 px-1.5 gap-1 font-normal text-[10px] text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100 cursor-help"
          >
            <AlertCircle className="h-3 w-3" />
            <span>Rejected</span>
          </Badge>
        </ActionTooltip>

        {user?.id === task.reporterId && (
          <ActionTooltip label="Delete Task">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-full text-muted-foreground/50 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover/rejected:opacity-100 transition-all scale-90 hover:scale-100"
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

  return null;
}

function ActionTooltip({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="text-xs px-2 py-1 bg-zinc-900 text-white border-none animate-in fade-in zoom-in-95 duration-200"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
