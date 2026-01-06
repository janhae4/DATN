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
      <div className="px-8 py-6 border-b border-zinc-100">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-black">{sprint.title}</h2>
              <SprintStatusBadge status={sprint.status} />
            </div>
            {sprint.goal && (
              <p className="text-zinc-500 text-sm max-w-xl">{sprint.goal}</p>
            )}
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-black">
              {Math.round(stats.progress)}%
            </div>
            <p className="text-xs text-zinc-500 mt-1">Complete</p>
          </div>
        </div>

        <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-black transition-all duration-500"
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
          <div className="divide-y divide-zinc-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between px-8 py-3 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center",
                      task.listId === "done"
                        ? "border-black bg-black"
                        : "border-zinc-300"
                    )}
                  >
                    {task.listId === "done" && (
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm truncate",
                        task.listId === "done"
                          ? "text-zinc-400 line-through"
                          : "text-black"
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-500">
                        {task.priority?.toUpperCase()}
                      </span>
                      {task.taskLabels?.map((l) => (
                        <span key={l.id} className="text-xs text-zinc-500">
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
                      <div className="h-6 w-6 rounded-full border border-dashed border-zinc-300 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                        <User className="h-3 w-3 text-zinc-400" />
                      </div>
                    )}
                  </div>

                  {task.dueDate && (
                    <div className="w-20 text-right">
                      <span className="text-xs text-zinc-500">
                        {format(new Date(task.dueDate), "dd MMM")}
                      </span>
                    </div>
                  )}

                  <button className="p-1 rounded hover:bg-zinc-100 text-zinc-400">
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
        "text-xs px-2 py-0.5 rounded border",
        isRunning
          ? "bg-black text-white border-black"
          : "bg-white text-zinc-500 border-zinc-300"
      )}
    >
      {status}
    </span>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl font-bold text-black">{value}</span>
      <span className="text-zinc-500">{label}</span>
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
              <Avatar className="h-6 w-6 border-2 border-white ring-1 ring-zinc-100 dark:ring-zinc-800 transition-transform hover:-translate-y-1 hover:z-10">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="text-[9px] font-bold bg-zinc-100 text-zinc-600">
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
              <div className="h-6 w-6 rounded-full border-2 border-white bg-zinc-100 ring-1 ring-zinc-200 flex items-center justify-center text-[9px] font-bold text-zinc-500 hover:bg-zinc-200 cursor-default hover:z-10 relative">
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
