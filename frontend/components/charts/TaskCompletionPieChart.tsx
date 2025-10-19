"use client"

import * as React from "react"
// --- CHANGED: Using a different icon for the footer ---
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

export const description = "A donut chart showing task completion percentage."

const chartData = [
  { status: "completed", count: 24, fill: "var(--color-completed)" },
  { status: "pending", count: 8, fill: "var(--color-pending)" },
]
const chartConfig = {
  count: {
    label: "Tasks",
  },
  completed: {
    label: "Completed",
    color: "black",
  },
  pending: {
    label: "Pending",
    color: "hsl(240, 5%, 85%)",
  },
} satisfies ChartConfig

export function TaskCompletionPieChart() {
  const totalTasks = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [])

  const completedTasks =
    chartData.find((item) => item.status === "completed")?.count || 0

  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Task Completion</CardTitle>
        <CardDescription>Overview of your task progress</CardDescription>
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
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
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
                          {completionPercentage.toLocaleString()}%
                        </tspan>
                        {/* --- CHANGED: Sub-label is now "Completed" --- */}
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Completed
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
            <Legend />
          </PieChart>
        </ChartContainer>
      </CardContent>
      {/* --- CHANGED: Footer provides a clear summary about tasks --- */}
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Great work! <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          You have completed {completedTasks} of {totalTasks} tasks.
        </div>
      </CardFooter>
    </Card>
  )
}