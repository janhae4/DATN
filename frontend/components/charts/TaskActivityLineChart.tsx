"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// --- 1. CONFIG GIỮ NGUYÊN ---
const chartConfig = {
  tasksCreated: {
    label: "Created",
    color: "hsl(var(--primary))", // Dùng màu primary của theme
  },
  tasksCompleted: {
    label: "Completed",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

// --- 2. INTERFACE MỚI (Khớp với dữ liệu Backend trả về) ---
interface ActivityItem {
  date: string;
  tasksCreated: number;
  tasksCompleted: number;
}

interface TaskActivityLineChartProps {
  activity: ActivityItem[]; // ✅ Nhận thẳng mảng activity đã tính
}

export function TaskActivityLineChart({
  activity = [],
}: TaskActivityLineChartProps) {
  // State để toggle giữa Created và Completed
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("tasksCompleted");

  // --- 3. TÍNH TỔNG (Logic duy nhất còn lại ở Client) ---
  // Chỉ để hiển thị con số tổng to đùng ở Header
  const total = React.useMemo(
    () => ({
      tasksCreated: activity.reduce((acc, curr) => acc + curr.tasksCreated, 0),
      tasksCompleted: activity.reduce(
        (acc, curr) => acc + curr.tasksCompleted,
        0
      ),
    }),
    [activity]
  );

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
            const chart = key as keyof typeof chartConfig;
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
            );
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
            data={activity} // ✅ Truyền thẳng props vào đây
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-muted"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
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
                    });
                  }}
                />
              }
            />
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
  );
}
