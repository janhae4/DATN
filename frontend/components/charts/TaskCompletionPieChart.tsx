"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { Label, Legend, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Task } from "@/types"
import { ListCategoryEnum } from "@/types/common/enums"
import { useLists } from "@/hooks/useList"

// --- THAY ĐỔI: SỬ DỤNG BẢNG MÀU TAILWIND CHUẨN ---
const TAILWIND_COLORS = [
  "#3b82f6", // blue-500 (Thường dùng cho In Progress)
  "#eab308", // yellow-500 (Thường dùng cho Warning/QA)
  "#f97316", // orange-500
  "#ef4444", // red-500 (Thường dùng cho Blocked/Bug)
  "#a855f7", // purple-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#000000", // black
  "#ffffff", // white
];

const TAILWIND_COLOR_DONE = "#22c55e"; // green-500


interface TaskCompletionPieChartProps {
  tasks: Task[]
  projectId?: string
}

export function TaskCompletionPieChart({ tasks = [], projectId: propProjectId }: TaskCompletionPieChartProps) {
  const params = useParams();
  const projectId = propProjectId || (params.projectId as string);
  const { lists } = useLists(projectId);

  // 1. Tạo Config động cho Chart
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      count: { label: "Tasks" },
    };
    
    if (!lists) return config;

    lists.forEach((list, index) => {
      // Logic gán màu:
      // - Nếu là Done -> Luôn ưu tiên màu Xanh lá (Green-500)
      // - Nếu không -> Lấy màu theo thứ tự trong bảng màu
      let color;
      if (list.category === ListCategoryEnum.DONE) {
         color = TAILWIND_COLOR_DONE;
      } else {
         // Bỏ qua màu xanh lá trong vòng lặp để tránh trùng, hoặc cứ lấy theo index
         color = TAILWIND_COLORS[index % TAILWIND_COLORS.length];
      }

      config[list.id] = {
        label: list.name,
        color: color,
      };
    });

    return config;
  }, [lists]);

  // 2. Tính toán Data chi tiết theo từng List
  const chartData = React.useMemo(() => {
    if (!lists || lists.length === 0) {
      // Màu xám nhạt của Tailwind (slate-200 / slate-700)
      return [{ name: "loading", count: 0, fill: "#e2e8f0" }];
    }

    // Khởi tạo map đếm
    const counts: Record<string, number> = {};
    lists.forEach(l => counts[l.id] = 0);
    let unassignedCount = 0;

    tasks.forEach((task) => {
      if (task.listId && counts.hasOwnProperty(task.listId)) {
        counts[task.listId]++;
      } else {
        unassignedCount++;
      }
    });

    // Map về format của Recharts
    const data = lists.map((list) => ({
      id: list.id,     
      name: list.name, 
      count: counts[list.id],
      fill: `var(--color-${list.id})`, // Shadcn ChartContainer sẽ inject mã Hex vào biến này
    }));

    // Xử lý Empty State
    const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);
    if (totalCount === 0) {
       return [
         { id: "empty", name: "No Tasks", count: 1, fill: "#f1f5f9" } // slate-100
       ];
    }

    return data.filter(d => d.count > 0);
  }, [tasks, lists]);

  // 3. Tính toán % Hoàn thành
  const { completionPercentage, completedTasks, totalTasks } = React.useMemo(() => {
    if (!lists || tasks.length === 0) return { completionPercentage: 0, completedTasks: 0, totalTasks: 0 };

    const doneListIds = lists
      .filter((l) => l.category === ListCategoryEnum.DONE)
      .map((l) => l.id);

    const total = tasks.length;
    const completed = tasks.filter(t => t.listId && doneListIds.includes(t.listId)).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completionPercentage: percentage, completedTasks: completed, totalTasks: total };
  }, [tasks, lists]);

  return (
    <Card className="flex flex-col h-full border-border bg-card text-card-foreground">
      <CardHeader className="items-center pb-0">
        <CardTitle>Task Status Breakdown</CardTitle>
        <CardDescription>Real-time distribution of tasks</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="id" 
              innerRadius={60}
              strokeWidth={5}
              stroke="hsl(var(--background))"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalTasks === 0 ? "0" : `${completionPercentage}%`}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Done
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
            <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                iconType="circle"
                wrapperStyle={{ paddingTop: "20px" }}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4">
        <div className="flex items-center gap-2 leading-none font-medium text-foreground">
          {completionPercentage === 100 && totalTasks > 0 ? (
             <>All tasks completed! <CheckCircle2 className="h-4 w-4 text-green-500" /></>
          ) : (
             <>
                {completedTasks} / {totalTasks} tasks completed
             </> 
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Showing tasks by status lists
        </div>
      </CardFooter>
    </Card>
  )
}