import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLists } from "@/hooks/useList";
import { useTasks } from "@/hooks/useTasks";
import { useTeam, useTeamMembers } from "@/hooks/useTeam";
import { cn } from "@/lib/utils";
import { ListCategoryEnum, Member, Sprint, SprintStatus } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { format } from "date-fns";
import { CheckCircle2, LayoutList, MoreHorizontal, User } from "lucide-react";
import { useMemo } from "react";

export function SprintProgressView({
  projectId,
  teamId,
  sprint,
}: {
  projectId: string;
  teamId: string;
  sprint: Sprint;
}) {
  const { tasks = [], isLoading: isLoadingTasks } = useTasks({
    sprintId: [sprint.id],
    projectId,
  });

  const { lists = [] } = useLists(projectId);
  const { data: members } = useTeamMembers(teamId);

  const stats = useMemo(() => {
    if (!tasks.length || !lists.length)
      return { todo: 0, inProgress: 0, done: 0, total: 0, progress: 0 };

    const categoryMap = lists.reduce((acc, list) => {
      acc[list.id] = list.category;
      return acc;
    }, {} as Record<string, ListCategoryEnum>);

    let todo = 0,
      inProgress = 0,
      done = 0;
    tasks.forEach((t) => {
      const cat = categoryMap[t.listId];
      if (cat === ListCategoryEnum.TODO) todo++;
      else if (cat === ListCategoryEnum.IN_PROGRESS) inProgress++;
      else if (cat === ListCategoryEnum.DONE) done++;
    });

    const total = tasks.length;
    return {
      todo,
      inProgress,
      done,
      total,
      progress: total > 0 ? (done / total) * 100 : 0,
    };
  }, [tasks, lists]);

  if (isLoadingTasks)
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-6 border-b border-border">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-foreground">{sprint.title}</h2>
              <SprintStatusBadge status={sprint.status} />
            </div>
            {sprint.goal && (
              <p className="text-muted-foreground text-sm max-w-xl">{sprint.goal}</p>
            )}
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-foreground">
              {Math.round(stats.progress)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Complete</p>
          </div>
        </div>

        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${stats.progress}%` }}
          />
        </div>

        <div className="flex gap-6">
          <StatBox label="Total" value={stats.total} />
          <StatBox label="To Do" value={stats.todo} />
          <StatBox label="In Progress" value={stats.inProgress} />
          <StatBox label="Done" value={stats.done} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-300 gap-2">
            <LayoutList className="h-12 w-12" />
            <p className="text-sm">No tasks</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between px-8 py-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      "h-4 w-4 rounded-sm border flex items-center justify-center transition-colors",
                      task.listId === "done"
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30 bg-background group-hover:border-primary/50"
                    )}
                  >
                    {task.listId === "done" && (
                      <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium transition-colors",
                        task.listId === "done"
                          ? "text-muted-foreground/50 line-through"
                          : "text-foreground group-hover:text-primary"
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 rounded uppercase",
                        task.priority === 'high' ? "text-red-500 bg-red-500/10" : "text-muted-foreground bg-muted"
                      )}>
                        {task.priority || 'medium'}
                      </span>
                      {task.taskLabels?.map((l: any) => (
                        <span key={l.id} className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 rounded">
                          #{l.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-end min-w-[80px]">
                    {task.assigneeIds && task.assigneeIds.length > 0 ? (
                      <MemberAvatarGroup
                        assigneeIds={task.assigneeIds}
                        members={members || []}
                        limit={2}
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full border border-dashed border-border flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                        <User className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {task.dueDate && (
                    <div className="w-20 text-right">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {format(new Date(task.dueDate), "dd MMM")}
                      </span>
                    </div>
                  )}

                  <button className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SprintStatusBadge({ status }: { status: SprintStatus }) {
  const isRunning = status === SprintStatus.ACTIVE;
  return (
    <span
      className={cn(
        "text-[10px] uppercase font-bold px-2 py-0.5 rounded border tracking-wider",
        isRunning
          ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
          : "bg-muted text-muted-foreground border-border"
      )}
    >
      {status}
    </span>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-tight">{label}</span>
    </div>
  );
}

interface MemberAvatarGroupProps {
  assigneeIds: string[];
  members: Member[];
  limit?: number;
}

export function MemberAvatarGroup({
  assigneeIds,
  members,
  limit = 3,
}: MemberAvatarGroupProps) {
  if (!assigneeIds?.length) return null;

  const assignees = assigneeIds
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean) as Member[];

  const visibleAssignees = assignees.slice(0, limit);
  const hiddenCount = assignees.length - limit;

  return (
    <div className="flex items-center -space-x-2">
      <TooltipProvider delayDuration={300}>
        {visibleAssignees.map((member) => (
          <Tooltip key={member.id}>
            <TooltipTrigger asChild>
              <Avatar className="h-6 w-6 border-2 border-background ring-1 ring-border transition-transform hover:-translate-y-1 hover:z-10 cursor-pointer">
                <AvatarImage src={member.avatar} alt={member.name} className="h-full w-full object-cover rounded-full" />
                <AvatarFallback className="text-[9px] font-bold bg-muted text-muted-foreground flex items-center justify-center rounded-full h-full w-full">
                  {member.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p>{member.name || "Unknown User"}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-6 w-6 rounded-full border-2 border-background bg-muted ring-1 ring-border flex items-center justify-center text-[9px] font-bold text-muted-foreground hover:bg-accent cursor-default hover:z-10 relative">
                +{hiddenCount}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <div className="flex flex-col gap-1">
                {assignees
                  .slice(limit)
                  .slice(0, 5)
                  .map((m) => (
                    <span key={m.id}>{m.name}</span>
                  ))}
                {hiddenCount > 5 && <span>...</span>}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}
