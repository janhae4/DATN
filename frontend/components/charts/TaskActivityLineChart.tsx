"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Task, List } from "@/types"
import { ListCategoryEnum } from "@/types/common/enums"

// --- CẤU HÌNH MÀU SẮC ĐỘNG THEO THEME ---
const chartConfig = {
  tasksCreated: {
    label: "Created",
    color: "hsl(var(--foreground))",
  },
  tasksCompleted: {
    label: "Completed",
    color: "hsl(var(--foreground))",
  },
} satisfies ChartConfig

interface TaskActivityLineChartProps {
  tasks: Task[]
  lists: List[]
}

export function TaskActivityLineChart({ tasks = [], lists = [] }: TaskActivityLineChartProps) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("tasksCompleted")

  // --- TÍNH TOÁN DỮ LIỆU 7 NGÀY GẦN NHẤT ---
  const chartData = React.useMemo(() => {
    const dataMap = new Map<string, { date: string; tasksCreated: number; tasksCompleted: number }>();
    const today = new Date();

    // 1. Khởi tạo 7 ngày gần nhất với giá trị 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      dataMap.set(dateStr, { date: dateStr, tasksCreated: 0, tasksCompleted: 0 });
    }

    // 2. Tìm danh sách Done
    const doneListIds = lists
      .filter(l => l.category === ListCategoryEnum.DONE)
      .map(l => l.id);

    // 3. Duyệt Task để đếm
    tasks.forEach(task => {
      // Created Date
      const createdDate = task.createdAt ? new Date(task.createdAt).toISOString().split('T')[0] : null;
      if (createdDate && dataMap.has(createdDate)) {
        dataMap.get(createdDate)!.tasksCreated++;
      }

      // Completed Date (Dùng tạm UpdatedAt nếu task đang ở Done List)
      if (task.listId && doneListIds.includes(task.listId)) {
        const completedDate = task.updatedAt ? new Date(task.updatedAt).toISOString().split('T')[0] : null;
        if (completedDate && dataMap.has(completedDate)) {
          dataMap.get(completedDate)!.tasksCompleted++;
        }
      }
    });

    return Array.from(dataMap.values());
  }, [tasks, lists]);

  const total = React.useMemo(
    () => ({
      tasksCreated: chartData.reduce((acc, curr) => acc + curr.tasksCreated, 0),
      tasksCompleted: chartData.reduce((acc, curr) => acc + curr.tasksCompleted, 0),
    }),
    [chartData]
  )

  return (
    <Card className="py-6 sm:py-0 h-full flex flex-col border-border bg-card text-card-foreground">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>Task Activity</CardTitle>
          <CardDescription>
            Tasks created vs. completed (Last 7 days)
          </CardDescription>
        </div>
        <div className="flex">
          {["tasksCreated", "tasksCompleted"].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6 transition-colors hover:bg-muted/20"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl text-foreground">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6 flex-1 min-h-0">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
              className="text-muted-foreground text-xs"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px] bg-popover text-popover-foreground border-border"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
      // Trong phần return của component TaskActivityLineChart

<Line
  dataKey={activeChart}
  type="monotone"
  stroke="currentColor" 
  className="text-foreground"
  strokeWidth={2}
  dot={{
    fill: "var(--background)",
    stroke: "currentColor",
    r: 4,
  }}
  activeDot={{
    r: 6,
    fill: "currentColor", 
  }}
/>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}