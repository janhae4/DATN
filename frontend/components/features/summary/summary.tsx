"use client";

import { useParams } from "next/navigation";
import StatsCard from "./statsCard";
import {
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  CalendarIcon,
} from "lucide-react";
import { TaskCompletionPieChart } from "../../charts/TaskCompletionPieChart";
import { TaskActivityLineChart } from "../../charts/TaskActivityLineChart";
import { EmailBox } from "./EmailBox";
import { EpicList } from "@/components/shared/epic/EpicList";
import { SummarySkeleton } from "@/components/skeletons/SummarySkeleton";
import { useProjectStats } from "@/hooks/useProjectStat";

const Summary = () => {
  const params = useParams();
  const projectId = params.projectId as string;

  const { data, isLoading } = useProjectStats(projectId);

  if (isLoading || !data || !data.stats) {
    return <SummarySkeleton />;
  }

  const { stats, lists, distribution, activity } = data;

  return (
    <div className="flex flex-1 flex-col gap-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-4 sm:grid-cols-2">
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
        <div className="bg-background rounded-xl w-full h-full shadow-sm border">
          <TaskCompletionPieChart lists={lists} distribution={distribution} />
        </div>
        <div className="bg-background rounded-xl w-full h-full shadow-sm border">
          <TaskActivityLineChart activity={activity} />
        </div>
      </div>

      {/* AI & Email Row (Keep Mock/AI as requested) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
        <div className="bg-background rounded-xl w-full h-full shadow-sm border p-4">
          <EpicList />
        </div>
        <div className=" aspect-video rounded-xl w-full">
          <EmailBox />
        </div>
      </div>
    </div>
  );
};

export default Summary;
