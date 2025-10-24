"use client"

import * as React from "react"
import { Epic } from "@/lib/dto/epic.type"
import { Task } from "@/lib/dto/task.type"
import { Badge } from "@/components/ui/badge"
import { PriorityPicker } from "@/components/shared/PriorityPicker"
import { Progress } from "@/components/ui/progress" // <-- 1. IMPORT Progress
import { Target } from "lucide-react" // <-- 2. IMPORT Icon (ví dụ: Target)
import { useDroppable } from "@dnd-kit/core"
import {
  Table,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { db } from "@/public/mock-data/mock-data"
import TaskTreeList from "../task/TaskTreeList"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { cn } from "@/lib/utils"

type EpicListProps = {
  statuses?: any
}

export function EpicList({ statuses }: EpicListProps) {
  const { data } = useTaskManagementContext()

  const dataList = data ?? []
  const statusesList = statuses ?? []

  // Epics metadata
  const epicsMeta: Epic[] = React.useMemo(
    () => db.epics.filter((e: Epic) => e.projectId === "project-1"),
    []
  )

  return (
    <div className="flex flex-col">
      <Accordion
        type="multiple"
        className="w-full flex flex-col gap-4" // <-- Thêm gap giữa các Epic
      >
        {epicsMeta.map((epic: Epic) => {
          // --- Logic lấy task và tính toán tiến độ ---
          const epicTasks = (data as Task[]).filter((t) => t.epicId === epic.id)
          const completedTasks = epicTasks.filter(t => statusesList.find((s:any) => s.id === t.statusId)?.status === 'done').length;
          const totalTasks = epicTasks.length;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          // --- Kết thúc tính toán ---

          const epicSubtaskIds = new Set<string>()
          epicTasks.forEach((t) => t.subtaskIds?.forEach((id: string) => epicSubtaskIds.add(id)))
          const topLevelEpicTasks = epicTasks.filter((t: Task) => !epicSubtaskIds.has(t.id))

          const { setNodeRef, isOver } = useDroppable({
            id: epic.id,
            data: {
              type: "epic-drop-area",
              epic: epic,
            },
          });

          return (
            <AccordionItem
              ref={setNodeRef}
              value={epic.id}
              key={epic.id}
              className={cn(
                // --- 3. Style như Card ---
                "rounded-lg border transition-all",
                "data-[state=open]:bg-muted/20",
                // -------------------------
                isOver && "bg-primary/20 ring-2 ring-primary/40"
              )}
            >
              {/* --- 4. NÂNG CẤP UI TRIGGER --- */}
              <AccordionTrigger
                className={cn(
                  "hover:no-underline px-4 py-3 text-left", // Căn trái text
                  // Bỏ bo tròn dưới khi mở
                  "data-[state=open]:rounded-b-none"
                )}
              >
                <div className="flex w-full flex-col gap-2"> {/* Cho các dòng xếp chồng lên nhau */}
                  {/* Dòng 1: Icon, Title, Actions (Status, Priority) */}
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Target className="h-5 w-5 text-purple-600 flex-shrink-0" /> {/* Icon màu tím */}
                      <span className="text-base font-medium truncate" title={epic.title}>
                        {epic.title}
                      </span>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-4">
                      <Badge
                        variant={epic.status === "in_progress" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {epic.status.replace("_", " ")}
                      </Badge>
                      <PriorityPicker
                        priority={epic.priority}
                        onPriorityChange={() => { }}
                        disabled
                      />
                    </div>
                  </div>

                  {/* Dòng 2: Description (nếu có) */}
                  {epic.description && (
                     <p className="line-clamp-1 text-sm text-muted-foreground pr-8"> {/* Thêm padding phải để không đè lên chevron */}
                       {epic.description}
                     </p>
                  )}


                  {/* Dòng 3: Progress Bar và % */}
                  <div className="flex items-center gap-2 pt-1 pr-8"> {/* Thêm padding phải */}
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium text-muted-foreground w-10 text-right">
                      {progress}%
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              {/* --- KẾT THÚC NÂNG CẤP --- */}

              <AccordionContent className="border-t bg-background/50 p-0 data-[state=closed]:animate-none">
                <div className="p-2">
                  <Table>
                    <TaskTreeList
                      topLevelTasks={topLevelEpicTasks}
                      statuses={statusesList as any}
                    />
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}