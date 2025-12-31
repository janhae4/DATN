"use client";

import React, { useMemo } from "react";
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
import { AISummaryBox } from "./AISummaryBox";
import { EmailBox } from "./EmailBox";

// Hooks & Types
import { useTasks } from "@/hooks/useTasks";
import { useLists } from "@/hooks/useList";
import { ListCategoryEnum } from "@/types/common/enums";
import { SummarySkeleton } from "@/components/skeletons/SummarySkeleton";

const Summary = () => {
  const params = useParams();
  const projectId = params.projectId as string;

  // 1. Fetch Real Data
  const { tasks, isLoading: isTasksLoading, error: tasksError } = useTasks(projectId);
  const { lists, isLoading: isListsLoading, error: listsError } = useLists(projectId);

  console.log({
    tasks,
    lists,
    isTasksLoading,
    isListsLoading,
    tasksError,
    listsError,
  })

  const isLoading = isTasksLoading || isListsLoading;

  // 2. Tính toán thống kê (Real-time Calculation)
  const stats = useMemo(() => {
    // Fallback an toàn nếu data chưa load xong
    if (!tasks || !lists)
      return { completed: 0, pending: 0, overdue: 0, dueSoon: 0 };

    // Tìm danh sách ID của các cột "Done"
    const doneListIds = lists
      .filter((l) => l.category === ListCategoryEnum.DONE)
      .map((l) => l.id);

    const now = new Date();
    // Reset giờ về 0 để so sánh ngày chính xác hơn
    now.setHours(0, 0, 0, 0);

    const next7Days = new Date(now);
    next7Days.setDate(now.getDate() + 7);

    let completed = 0;
    let pending = 0;
    let overdue = 0;
    let dueSoon = 0;

    tasks.forEach((task) => {
      const isDone = doneListIds.includes(task.listId);

      // --- Đếm số lượng theo trạng thái ---
      if (isDone) {
        completed++;
      } else {
        pending++;
      }

      // --- Đếm theo thời gian (Chỉ tính task chưa xong) ---
      if (!isDone && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        // Reset giờ của dueDate để so sánh
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < now) {
          overdue++;
        } else if (dueDate >= now && dueDate <= next7Days) {
          dueSoon++;
        }
      }
    });

    return { completed, pending, overdue, dueSoon };
  }, [tasks, lists]);

  if (isLoading) {
    return <SummarySkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pt-0">
      {/* Stats Cards Row */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-4 sm:grid-cols-2">
        <StatsCard
          icon={<CheckCircleIcon className="text-green-600" />}
          value={stats.completed}
          title="Completed"
          period="All time"
          unit="tasks"
          // Hiện tại chưa có API lịch sử để tính % change, để trống hoặc mock
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
          // Ví dụ: Nếu có overdue thì hiện số âm (màu đỏ) để cảnh báo
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
          {/* TRUYỀN DATA THẬT VÀO ĐÂY */}
          <TaskCompletionPieChart tasks={tasks} />
        </div>
        <div className="bg-background rounded-xl w-full h-full shadow-sm border">
          {/* VÀ VÀO ĐÂY */}
          <TaskActivityLineChart tasks={tasks} lists={lists} />
        </div>
      </div>

      {/* AI & Email Row (Keep Mock/AI as requested) */}
      <div className="flex gap-4">
        <div className="bg-muted/50 aspect-video rounded-xl w-full">
          <AISummaryBox />
        </div>
        <div className=" aspect-video rounded-xl w-full">
          <EmailBox />
        </div>
      </div>
    </div>
  );
};

export default Summary;
