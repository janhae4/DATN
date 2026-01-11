"use client";

import { useRouter } from "next/navigation";
import {
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isValid,
  parseISO,
} from "date-fns";
import { useTasks } from "@/hooks/useTasks";
import {
  FolderKanban,
  Users,
  ArrowRight,
  Zap,
  CheckCircle2,
  Clock,
  Circle,
  Loader2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Hooks
import { useProjects } from "@/hooks/useProjects";
import { Member, TeamMember } from "@/types/social";
import { useUserProfile } from "@/hooks/useAuth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Components
import { TeamAnalytics } from "./team-analytics";
import { StatsCard } from "./StatsCard";
import { EmptyState } from "./EmptyState";
import { TeamMembersList } from "./TeamMembersList";
import { ProjectSprintsModal } from "./ProjectSprintsModal";
import { TaskDetailModal } from "../backlogs/taskmodal";
import { Task } from "@/types";
import { listService } from "@/services/listService";
import { useQuery } from "@tanstack/react-query";

interface TeamOverviewTabProps {
  teamId: string;
  members: Member[];
}

export function TeamOverviewTab({ teamId, members }: TeamOverviewTabProps) {
  const router = useRouter();
  console.log("TeamOverviewTab rendered", teamId);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenSprintModal = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsModalOpen(true);
  };

  const { projects, isLoading: isLoadingProjects } = useProjects(teamId);
  const { data: user } = useUserProfile();

  const {
    tasks: myTasks,
    isLoading: isLoadingTasks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    updateTask,
    total: totalTasks,
  } = useTasks({
    teamId,
    assigneeIds: user?.id ? [user.id] : undefined,
    limit: 6,
    sortBy: ["dueDate:ASC"],
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Derived stats for the card
  const { overdueCount, dueSoonCount } = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    let overdue = 0;
    let soon = 0;

    myTasks.forEach(task => {
      if (!task.dueDate) return;
      const dueDate = new Date(task.dueDate);
      if (dueDate < now) {
        overdue++;
      } else if (dueDate <= nextWeek) {
        soon++;
      }
    });

    return { overdueCount: overdue, dueSoonCount: soon };
  }, [myTasks]);

  // Fetch lists for the selected task's project
  const { data: projectLists } = useQuery({
    queryKey: ["lists", selectedTask?.projectId],
    queryFn: () => listService.getLists(selectedTask!.projectId),
    enabled: !!selectedTask?.projectId,
  });

  const handleUpdateTask = (taskId: string, updates: any) => {
    updateTask(taskId, updates);
  };

  // Infinite Scroll Observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastTaskRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingTasks) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoadingTasks, hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const projectLookup = useMemo(() => {
    if (!projects) return {};
    return projects.reduce((acc, project) => {
      acc[project.id] = project.name;
      return acc;
    }, {} as Record<string, string>);
  }, [projects]);

  const activeProjectsCount = projects?.length || 0;
  const activeTasksCount = totalTasks || 0;

  const getDueDateLabel = (dateStr: string | null) => {
    if (!dateStr) return "No date";
    const date = parseISO(dateStr);
    if (!isValid(date)) return "Invalid date";

    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";

    if (new Date() > date) return "Overdue";

    return formatDistanceToNow(date, { addSuffix: true });
  };

  const recentProjects = projects?.slice(0, 3) || [];

  return (
    <>
      <div id="team-stats" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        {/* SECTION 2: ENHANCED STATS CARDS */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total Projects"
            value={activeProjectsCount}
            icon={FolderKanban}
            trend="+2 this month"
            trendUp={true}
            description="Active workspaces"
            loading={isLoadingProjects}
          />
          <StatsCard
            title="Team Members"
            value={members.length}
            icon={Users}
            trend="Stable"
            trendUp={null}
            description="Collaborators joined"
            loading={false}
          />
          <StatsCard
            title="Active Tasks"
            value={activeTasksCount}
            icon={CheckCircle2}
            trend={overdueCount > 0 ? `${overdueCount} overdue` : `${dueSoonCount} due soon`}
            trendUp={overdueCount > 0 ? false : true}
            description="Assigned to you"
            loading={isLoadingTasks}
          />
        </div>

        {/* SECTION 3: ANALYTICS CHARTS */}
        <div id="team-analytics">
          <TeamAnalytics members={members} projects={projects || []} />
        </div>

        <Separator />

        {/* SECTION 4: RECENT LISTS GRID */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* RECENT PROJECTS */}
          <Card id="recent-projects" className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl">Recent Projects</CardTitle>
                <CardDescription>Recently accessed projects.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {isLoadingProjects ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : recentProjects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="No projects"
                  description="Get started by creating a project."
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {recentProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleOpenSprintModal(project.id)}
                      className="flex items-center justify-between p-4 rounded-xl border bg-card/50 hover:bg-accent/50 hover:shadow-sm transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                          {project.icon ? (
                            <span className="text-lg">{project.icon}</span>
                          ) : (
                            <Zap className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">{project.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {project.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-muted/50">
                        {project.visibility}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ACTIVE DISCUSSIONS */}
          {/* UPCOMING TASKS */}
          <Card id="my-tasks" className="h-full flex flex-col shadow-sm border-muted/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  My Tasks
                </CardTitle>
                <CardDescription>
                  Tasks due soon across projects.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="h-[300px] px-6 overflow-y-auto">
                {isLoadingTasks ? (
                  <div className="space-y-4 py-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1 py-2">
                    {myTasks.length === 0 ? (
                      <div className="py-8">
                        <EmptyState
                          icon={CheckCircle2}
                          title="All caught up!"
                          description="No pending tasks assigned to you."
                        />
                      </div>
                    ) : (
                      <>
                        {myTasks.map((task, index) => (
                          <div
                            key={task.id}
                            ref={index === myTasks.length - 1 ? lastTaskRef : null}
                            onClick={() => setSelectedTask(task as Task)}
                            className="group p-3 rounded-lg hover:bg-muted/50 transition-all border border-transparent hover:border-border/50 flex items-start gap-3 cursor-pointer"
                          >
                            {/* Status Checkbox */}
                            <div className="mt-0.5 relative group/check">
                              <Circle className="h-5 w-5 text-muted-foreground group-hover/check:hidden" />
                              <CheckCircle2 className="h-5 w-5 text-primary hidden group-hover/check:block animate-in zoom-in duration-200" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p
                                  className={`text-sm font-medium truncate ${task.priority === "high" ? "text-red-600" : ""
                                    }`}
                                >
                                  {task.title}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] h-5 px-1.5 border-0 capitalize ${task.priority === "high"
                                    ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                    : task.priority === "medium"
                                      ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                                      : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                    }`}
                                >
                                  {task.priority}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1 truncate max-w-[120px]">
                                  <FolderKanban className="h-3 w-3" />
                                  {projectLookup[task.projectId] || "Project"}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span
                                  className={`flex items-center gap-1 ${task.dueDate && new Date(task.dueDate) < new Date()
                                    ? "text-red-500 font-medium"
                                    : ""
                                    }`}
                                >
                                  <Clock className="h-3 w-3" />
                                  {task.dueDate
                                    ? getDueDateLabel(task.dueDate)
                                    : "No date"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {isFetchingNextPage && (
                          <div className="py-2 flex justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />


        <div id="team-members">
          <TeamMembersList members={members} teamId={teamId} />
        </div>
      </div>

      {selectedProjectId && (
        <ProjectSprintsModal
          projectId={selectedProjectId}
          teamId={teamId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        lists={projectLists || []}
        onListChange={(id, listId) => handleUpdateTask(id, { listId })}
        onDateChange={(id, date) => handleUpdateTask(id, { dueDate: date?.toISOString() })}
        onPriorityChange={(id, p) => handleUpdateTask(id, { priority: p })}
        onAssigneeChange={(id, assigneeIds) => handleUpdateTask(id, { assigneeIds })}
        onTitleChange={(id, _, value) => handleUpdateTask(id, { title: value })}
        onDescriptionChange={(id, desc) => handleUpdateTask(id, { description: desc })}
        onLabelsChange={(id, labels) => handleUpdateTask(id, { labelIds: labels })}
        updateTask={handleUpdateTask}
      />
    </>
  );
}
