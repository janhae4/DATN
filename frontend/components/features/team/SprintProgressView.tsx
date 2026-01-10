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
import { ListCategoryEnum, Member, Sprint, SprintStatus, Task } from "@/types";
import {
  CheckCircle2,
  LayoutList,
  MoreHorizontal,
  User,
  TrendingUp,
  CheckCircle,
  Circle,
  Clock,
  Target,
  ChevronRight,
  Trash2
} from "lucide-react";
import { useMemo, useState } from "react";
import { MemberAvatarGroup } from "@/components/shared/assignee/MemberAvatarGroup";
import { AssigneePicker } from "@/components/shared/assignee/AssigneePicker";
import { PriorityPicker } from "@/components/shared/PriorityPicker";
import { DatePicker } from "@/components/shared/DatePicker";
import { Priority } from "@/types/common/enums";
import { TaskDetailModal } from "../backlogs/taskmodal";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function SprintProgressView({
  projectId,
  teamId,
  sprint,
}: {
  projectId: string;
  teamId: string;
  sprint: Sprint;
}) {
  const { tasks = [], isLoading: isLoadingTasks, updateTask, deleteTasks } = useTasks({
    sprintId: [sprint.id],
    projectId,
  });

  const { lists = [] } = useLists(projectId);
  const { data: members } = useTeamMembers(teamId);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterCategory, setFilterCategory] = useState<ListCategoryEnum | "all">("all");
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handleUpdateTask = (taskId: string, updates: any) => {
    updateTask(taskId, updates);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTasks([taskToDelete.id]);
      toast.success("Task deleted successfully");
      setTaskToDelete(null);
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const stats = useMemo(() => {
    if (!tasks.length || !lists.length)
      return { todo: 0, inProgress: 0, done: 0, total: 0, progress: 0, categoryMap: {} as Record<string, ListCategoryEnum> };

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
      categoryMap
    };
  }, [tasks, lists]);

  const filteredTasks = useMemo(() => {
    if (filterCategory === "all") return tasks;
    return tasks.filter(t => stats.categoryMap?.[t.listId] === filterCategory);
  }, [tasks, filterCategory, stats.categoryMap]);

  if (isLoadingTasks)
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-background/50">
      <div className="px-8 py-2">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {sprint.title}
              </h2>
              <SprintStatusBadge status={sprint.status} />
            </div>
            {sprint.goal && (
              <p className="text-sm text-muted-foreground italic">
                "{sprint.goal}"
              </p>
            )}
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-primary">
              {Math.round(stats.progress)}%
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Sprint Progress
            </p>
          </div>
        </div>

        <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden mb-10 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-1000 ease-out relative"
            style={{ width: `${stats.progress}%` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-shimmer" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Tasks"
            value={stats.total}
            active={filterCategory === "all"}
            onClick={() => setFilterCategory("all")}
            color="indigo"
          />
          <StatCard
            label="To Do"
            value={stats.todo}
            active={filterCategory === ListCategoryEnum.TODO}
            onClick={() => setFilterCategory(ListCategoryEnum.TODO)}
            color="slate"
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            active={filterCategory === ListCategoryEnum.IN_PROGRESS}
            onClick={() => setFilterCategory(ListCategoryEnum.IN_PROGRESS)}
            color="orange"
          />
          <StatCard
            label="Done"
            value={stats.done}
            active={filterCategory === ListCategoryEnum.DONE}
            onClick={() => setFilterCategory(ListCategoryEnum.DONE)}
            color="emerald"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            Task List
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="text-xs font-medium lowercase">
              {filterCategory === "all" ? "showing all" : `filtering by ${filterCategory}`}
            </span>
          </h3>
          <span className="text-[10px] font-medium text-muted-foreground">{filteredTasks.length} tasks matching</span>
        </div>
        {filteredTasks.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground/40 bg-muted/20 rounded-3xl border border-dashed border-border gap-4 mt-2">
            <div className="p-4 bg-background rounded-2xl shadow-sm border">
              <LayoutList className="h-8 w-8 text-muted-foreground/20" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-muted-foreground">No tasks found</p>
              <p className="text-xs">Adjust your status filter above</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between px-5 py-3.5 bg-card hover:bg-muted/40 border border-transparent hover:border-border/50 rounded-2xl transition-all duration-200 group relative"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Checkbox
                    checked={stats.categoryMap?.[task.listId] === ListCategoryEnum.DONE}
                    onCheckedChange={(checked) => {
                      const targetCategory = checked ? ListCategoryEnum.DONE : ListCategoryEnum.TODO;
                      const targetList = lists.find(l => l.category === targetCategory);
                      if (targetList) {
                        updateTask(task.id, { listId: targetList.id });
                      }
                    }}
                    className="h-4 w-4 rounded-sm border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all duration-200"
                  />

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-bold tracking-tight transition-colors",
                        task.listId === "done"
                          ? "text-muted-foreground/50 line-through"
                          : "text-foreground group-hover:text-primary"
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                      <PriorityPicker
                        priority={task.priority as Priority}
                        onPriorityChange={(p) => updateTask(task.id, { priority: p || undefined })}
                      />
                      <div className="h-3 w-px bg-border/50 mx-1" />
                      <div className="flex items-center gap-1.5">
                        {task.taskLabels?.slice(0, 3).map((l: any) => (
                          <span key={l.id} className="text-[10px] font-semibold text-muted-foreground/70 bg-muted/60 px-2 py-0.5 rounded-full border border-border/10">
                            {l.name}
                          </span>
                        ))}
                        {task.taskLabels && task.taskLabels.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{task.taskLabels.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-end min-w-[80px]">
                    <AssigneePicker
                      value={task.assigneeIds || []}
                      users={members || []}
                      onChange={(newIds) => updateTask(task.id, { assigneeIds: newIds })}
                    />
                  </div>

                  <DatePicker
                    date={task.dueDate}
                    onDateSelect={(d) => updateTask(task.id, { dueDate: d?.toISOString() })}
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-all duration-200 hover:text-foreground active:scale-95">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => setSelectedTask(task)} className="cursor-pointer">
                        <User className="h-3.5 w-3.5 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setTaskToDelete(task)}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        lists={lists}
        onListChange={(id, listId) => handleUpdateTask(id, { listId })}
        onDateChange={(id, date) => handleUpdateTask(id, { dueDate: date?.toISOString() })}
        onPriorityChange={(id, p) => handleUpdateTask(id, { priority: p })}
        onAssigneeChange={(id, assigneeIds) => handleUpdateTask(id, { assigneeIds })}
        onTitleChange={(id, _, value) => handleUpdateTask(id, { title: value })}
        onDescriptionChange={(id, desc) => handleUpdateTask(id, { description: desc })}
        onLabelsChange={(id, labels) => handleUpdateTask(id, { labelIds: labels })}
        updateTask={handleUpdateTask}
      />

      <AlertDialog open={!!taskToDelete} onOpenChange={(open: boolean) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              <span className="font-semibold text-foreground px-1">"{taskToDelete?.title}"</span>
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SprintStatusBadge({ status }: { status: SprintStatus }) {
  const isRunning = status === SprintStatus.ACTIVE;
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
        isRunning
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-muted text-muted-foreground border-border"
      )}
    >
      <div className={cn("h-1.5 w-1.5 rounded-full", isRunning ? "bg-primary animate-pulse" : "bg-muted-foreground")} />
      {status}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
  color: "indigo" | "emerald" | "orange" | "slate";
}

function StatCard({ label, value, active, onClick, color }: StatCardProps) {
  const themes = {
    indigo: "indigo-500/50 indigo-50/50 indigo-500/5 indigo-600 indigo-400 indigo-600/50 indigo-500/10",
    emerald: "emerald-500/50 emerald-50/50 emerald-500/5 emerald-600 emerald-400 emerald-600/50 emerald-500/10",
    orange: "orange-500/50 orange-50/50 orange-500/5 orange-600 orange-400 orange-600/50 orange-500/10",
    slate: "slate-500/50 slate-50/50 slate-500/5 slate-600 slate-400 slate-600/50 slate-500/10",
  };

  const getThemeClasses = (c: keyof typeof themes) => {
    const [hover, bg, darkBg, text, darkText, activeBorder, activeRing] = themes[c].split(" ");
    return {
      base: `hover:border-${hover} bg-${bg} dark:bg-${darkBg} text-${text} dark:text-${darkText}`,
      active: `border-${activeBorder} ring-2 ring-${activeRing}`
    };
  };

  const theme = getThemeClasses(color);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group",
        theme.base,
        active ? theme.active : "border-border shadow-sm hover:shadow-md"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl font-black">{value}</div>
        <ChevronRight className={cn(
          "h-3 w-3 transition-transform duration-300",
          active ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-50"
        )} />
      </div>
      <div className="text-[10px] font-bold uppercase tracking-tight opacity-70">{label}</div>
    </button>
  );
}

