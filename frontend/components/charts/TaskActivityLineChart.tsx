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

export const description =
  "An interactive line chart showing tasks created and completed over the last 7 days."

// --- CHANGED: Data now reflects 7 days of task activity
const chartData = [
  { date: "2024-10-12", tasksCreated: 5, tasksCompleted: 3 },
  { date: "2024-10-13", tasksCreated: 7, tasksCompleted: 8 },
  { date: "2024-10-14", tasksCreated: 4, tasksCompleted: 4 },
  { date: "2024-10-15", tasksCreated: 8, tasksCompleted: 6 },
  { date: "2024-10-16", tasksCreated: 6, tasksCompleted: 7 },
  { date: "2024-10-17", tasksCreated: 10, tasksCompleted: 5 },
  { date: "2024-10-18", tasksCreated: 3, tasksCompleted: 5 },
]

// --- CHANGED: Config matches the new data keys
const chartConfig = {
  tasksCreated: {
    label: "Created",
    color: "black",
  },
  tasksCompleted: {
    label: "Completed",
    color: "black",
  },
} satisfies ChartConfig

export function TaskActivityLineChart() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("tasksCompleted")

  const total = React.useMemo(
    () => ({
      tasksCreated: chartData.reduce((acc, curr) => acc + curr.tasksCreated, 0),
      tasksCompleted: chartData.reduce(
        (acc, curr) => acc + curr.tasksCompleted,
        0
      ),
    }),
    []
  )

  return (
    <Card className="py-6 sm:py-0 h-full">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          {/* --- CHANGED: Title and Description updated */}
          <CardTitle>Task Activity</CardTitle>
          <CardDescription>
            Showing tasks created vs. completed for the last 7 days
          </CardDescription>
        </div>
        <div className="flex">
          {/* --- CHANGED: Buttons now map over the new keys */}
          {["tasksCreated", "tasksCompleted"].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
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
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                // --- CHANGED: Formats date as "Oct 18"
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  // --- FIXED: Removed 'nameKey' prop so the tooltip
                  // correctly shows "Created" or "Completed"
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
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={`var(--color-${activeChart})`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}