"use client";

import { useParams } from "next/navigation";
import StatsCard from "./statsCard";
import {
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  CalendarIcon,
<<<<<<< HEAD
=======
  MoreVertical,
  Settings2,
>>>>>>> origin/blank_branch
} from "lucide-react";
import { TaskCompletionPieChart } from "../../charts/TaskCompletionPieChart";
import { TaskActivityLineChart } from "../../charts/TaskActivityLineChart";
import { EmailBox } from "./EmailBox";
<<<<<<< HEAD
import { EpicList } from "@/components/shared/epic/EpicList";
import { SummarySkeleton } from "@/components/skeletons/SummarySkeleton";
import { useProjectStats } from "@/hooks/useProjectStat";
=======
import { EpicList } from "@/components/shared/color-picker/epic/EpicList";
import { SummarySkeleton } from "@/components/skeletons/SummarySkeleton";
import { useProjectStats } from "@/hooks/useProjectStat";
import { useProject } from "@/hooks/useProjects";
import { useState } from "react";
import { EditProjectModal } from "../project/EditProjectModal";
import { Button } from "@/components/ui/button";
import { useSummaryTour } from "@/hooks/touring/useSummaryTour";
import { HelpCircle } from "lucide-react";
>>>>>>> origin/blank_branch

const Summary = () => {
  const params = useParams();
  const projectId = params.projectId as string;
<<<<<<< HEAD

  const { data, isLoading } = useProjectStats(projectId);

  if (isLoading || !data || !data.stats) {
=======
  const { data, isLoading: isStatsLoading } = useProjectStats(projectId);
  const { project, isLoading: isProjectLoading } = useProject(projectId);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { startTour } = useSummaryTour();

  if (isStatsLoading || isProjectLoading || !data || !data.stats) {
>>>>>>> origin/blank_branch
    return <SummarySkeleton />;
  }

  const { stats, lists, distribution, activity } = data;

  return (
    <div className="flex flex-1 flex-col gap-4 pt-0">
<<<<<<< HEAD
      <div className="grid auto-rows-min gap-4 md:grid-cols-4 sm:grid-cols-2">
=======
      {/* Project Header */}
      <div id="project-header" className="flex justify-between items-start mb-2 group">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {project?.name}
            </h1>

          </div>
          {project?.description && (
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={startTour}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditModalOpen(true)}
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {project && (
        <EditProjectModal
          project={project}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
        />
      )}

      <div id="stats-grid" className="grid auto-rows-min gap-4 md:grid-cols-4 sm:grid-cols-2">
>>>>>>> origin/blank_branch
        <StatsCard
          icon={<CheckCircleIcon className="text-green-600" />}
          value={stats.completed}
          title="Completed"
          period="All time"
          unit="tasks"
        />
        <StatsCard
          icon={<ClockIcon className="text-blue-600" />}
          value={stats.pending}
          title="Pending Tasks"
          period="Active tasks"
          unit="tasks"
        />
        <StatsCard
          icon={<AlertTriangleIcon className="text-red-600" />}
          value={stats.overdue}
          title="Overdue Tasks"
          period="Action required"
          unit="tasks"
          change={stats.overdue > 0 ? -stats.overdue : undefined}
        />
        <StatsCard
          icon={<CalendarIcon className="text-orange-600" />}
          value={stats.dueSoon}
          title="Due Soon"
          period="Next 7 days"
          unit="tasks"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<<<<<<< HEAD
        <div className="bg-background rounded-xl w-full h-full shadow-sm border">
          <TaskCompletionPieChart lists={lists} distribution={distribution} />
        </div>
        <div className="bg-background rounded-xl w-full h-full shadow-sm border">
=======
        <div id="completion-chart" className="bg-background rounded-xl w-full h-full shadow-sm border">
          <TaskCompletionPieChart lists={lists} distribution={distribution} />
        </div>
        <div id="activity-chart" className="bg-background rounded-xl w-full h-full shadow-sm border">
>>>>>>> origin/blank_branch
          <TaskActivityLineChart activity={activity} />
        </div>
      </div>

      {/* AI & Email Row (Keep Mock/AI as requested) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
<<<<<<< HEAD
        <div className="bg-background rounded-xl w-full h-full shadow-sm border p-4">
          <EpicList />
        </div>
        <div className=" aspect-video rounded-xl w-full">
=======
        <div id="epic-list" className="bg-background rounded-xl w-full h-full shadow-sm border p-4">
          <EpicList />
        </div>
        <div id="email-box" className=" aspect-video rounded-xl w-full">
>>>>>>> origin/blank_branch
          <EmailBox />
        </div>
      </div>
    </div>
  );
};

export default Summary;
