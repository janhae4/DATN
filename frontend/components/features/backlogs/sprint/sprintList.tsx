// components/features/backlogs/SprintList.tsx
"use client"

import * as React from "react"
import { db } from "@/public/mock-data/mock-data"
import { Sprint } from "@/types/sprint.type"
import { Task } from "@/types/task.type"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Table } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress" // <-- 1. IMPORT Progress
import { Rocket } from "lucide-react" // <-- 2. IMPORT Icon
import { formatDate, statusesForProject1 } from "@/lib/backlog-utils"
import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import TaskTreeList from "../task/TaskTreeList"
import { useTaskManagementContext } from "@/components/providers/TaskManagementContext"
import { Separator } from "@/components/ui/separator"
export function SprintList() {
  const { data } = useTaskManagementContext()
  const statusesList = statusesForProject1 ?? []

  const activeSprints = React.useMemo(() =>
    db.sprints.filter(
      s => s.projectId === "project-1" && s.status !== "completed"
    ),
    []
  );

  return (
    <Accordion type="multiple" className="w-full flex flex-col gap-4">
      {activeSprints.map((sprint: Sprint, index: number) => {
        const isLast = index === activeSprints.length - 1

        // --- 3. TÍNH TOÁN TIẾN ĐỘ ---
        const sprintTasks = (data as Task[]).filter((t) => t.sprintId === sprint.id)
        const completedTasks = sprintTasks.filter(t => statusesList.find((s:any) => s.id === t.statusId)?.status === 'done').length;
        const totalTasks = sprintTasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        // --- KẾT THÚC TÍNH TOÁN ---
        
        const topLevelSprintTasks = [...sprintTasks] // No need to filter subtasks anymore

        const { setNodeRef, isOver } = useDroppable({
          id: sprint.id,
          data: {
            type: "sprint-drop-area",
            sprint: sprint,
          },
        });

        return (
          <div key={sprint.id} className="flex flex-col">
            <AccordionItem
              ref={setNodeRef}
              value={sprint.id}
              className={cn(
                // Style như Card
                "!border rounded-sm transition-all",
                "data-[state=open]:bg-muted/20",
                // Hiệu ứng kéo thả
                isOver && "bg-primary/20 ring-2 ring-primary/40",
               
              )}
            >
            {/* --- 4. NÂNG CẤP UI TRIGGER --- */}
            <AccordionTrigger
              className={cn(
                "hover:no-underline px-4 py-3 text-left",
                "data-[state=open]:rounded-b-none" // Bỏ bo tròn dưới khi mở
              )}
            >
              <div className="flex w-full flex-col gap-2"> {/* Xếp chồng các dòng */}
                {/* Dòng 1: Icon, Title, Actions (Status, Task count) */}
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Rocket className="h-5 w-5 text-blue-600 flex-shrink-0" /> {/* Icon màu xanh */}
                    <span className="text-base font-medium truncate" title={sprint.title}>
                      {sprint.title}
                    </span>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-4">
                    <Badge
                      variant={sprint.status === "active" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {sprint.status.replace("_", " ")}
                    </Badge>
                     {/* Hiển thị số task thay vì ngày ở đây */}
                    <span className="text-sm font-normal text-muted-foreground">
                       {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
                     </span>
                  </div>
                </div>

                {/* Dòng 2: Khoảng thời gian */}
                 <p className="text-sm text-muted-foreground pr-8"> {/* Thêm padding phải */}
                   {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
                 </p>

                {/* Dòng 3: Progress Bar */}
                <div className="flex items-center gap-2 pt-1 pr-8"> {/* Thêm padding phải */}
                  <Progress value={progress} />
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
                    topLevelTasks={topLevelSprintTasks}
                    statuses={statusesList as any}
                  />
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>

          {!isLast && <Separator className="my-2" />}
          </div>
        );
      })}
    </Accordion>
  );
};